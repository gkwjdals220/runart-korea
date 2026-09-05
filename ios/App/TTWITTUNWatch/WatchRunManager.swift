import Foundation
import HealthKit
import CoreLocation
import WatchConnectivity
import WatchKit

@MainActor
final class WatchRunManager: NSObject, ObservableObject {
    enum RunState: String { case idle, running, paused, saving, finished }

    @Published var state: RunState = .idle
    @Published var isAuthorized = false
    @Published var elapsedSeconds = 0
    @Published var distanceMeters: Double = 0
    @Published var heartRate: Double = 0
    @Published var averageHeartRate: Double = 0
    @Published var activeCalories: Double = 0
    @Published var errorMessage: String?
    @Published var pendingSyncCount = 0

    private let healthStore = HKHealthStore()
    private let locationManager = CLLocationManager()
    private var workoutSession: HKWorkoutSession?
    private var workoutBuilder: HKLiveWorkoutBuilder?
    private var routeBuilder: HKWorkoutRouteBuilder?
    private var timer: Timer?
    private var startedAt: Date?
    private var pausedAt: Date?
    private var pausedDuration: TimeInterval = 0
    private var lastLocation: CLLocation?
    private var routeLocations: [CLLocation] = []
    private var heartRateTotal: Double = 0
    private var heartRateSamples = 0
    private var wcSession: WCSession?

    var distanceKm: Double { distanceMeters / 1000 }
    var elapsedText: String {
        let sec = elapsedSeconds
        let h = sec / 3600, m = (sec % 3600) / 60, s = sec % 60
        return h > 0 ? String(format: "%d:%02d:%02d", h, m, s) : String(format: "%02d:%02d", m, s)
    }
    var paceText: String {
        guard distanceMeters >= 50 else { return "--:--" }
        let pace = Int(Double(elapsedSeconds) / (distanceMeters / 1000))
        return String(format: "%d:%02d", pace / 60, pace % 60)
    }

    override init() {
        super.init()
        locationManager.delegate = self
        locationManager.activityType = .fitness
        locationManager.desiredAccuracy = kCLLocationAccuracyBest
        locationManager.distanceFilter = 3
        locationManager.pausesLocationUpdatesAutomatically = false
        if WCSession.isSupported() {
            let session = WCSession.default
            session.delegate = self
            session.activate()
            wcSession = session
        }
        refreshPendingSyncCount()
    }

    func prepare() async {
        guard HKHealthStore.isHealthDataAvailable() else {
            errorMessage = "Apple Watch에서 Health 데이터를 사용할 수 없습니다."
            return
        }
        do {
            let workout = HKObjectType.workoutType()
            let read: Set<HKObjectType> = [
                HKObjectType.quantityType(forIdentifier: .heartRate)!,
                HKObjectType.quantityType(forIdentifier: .activeEnergyBurned)!,
                HKObjectType.quantityType(forIdentifier: .distanceWalkingRunning)!
            ]
            try await healthStore.requestAuthorization(toShare: [workout], read: read)
            locationManager.requestWhenInUseAuthorization()
            isAuthorized = true
        } catch {
            errorMessage = "Health 권한을 확인해주세요: \(error.localizedDescription)"
        }
    }

    func startRun() async {
        if !isAuthorized { await prepare() }
        guard isAuthorized, state == .idle || state == .finished else { return }

        let configuration = HKWorkoutConfiguration()
        configuration.activityType = .running
        configuration.locationType = .outdoor

        do {
            let session = try HKWorkoutSession(healthStore: healthStore, configuration: configuration)
            let builder = session.associatedWorkoutBuilder()
            builder.dataSource = HKLiveWorkoutDataSource(healthStore: healthStore, workoutConfiguration: configuration)
            session.delegate = self
            builder.delegate = self
            workoutSession = session
            workoutBuilder = builder
            routeBuilder = HKWorkoutRouteBuilder(healthStore: healthStore, device: .local())

            resetRunValues()
            let start = Date()
            startedAt = start
            state = .running
            session.startActivity(with: start)
            try await builder.beginCollection(at: start)
            locationManager.startUpdatingLocation()
            startTimer()
            WKInterfaceDevice.current().play(.start)
        } catch {
            state = .idle
            errorMessage = "러닝을 시작할 수 없습니다: \(error.localizedDescription)"
        }
    }

    func togglePause() {
        guard let session = workoutSession else { return }
        if state == .running {
            pausedAt = Date()
            state = .paused
            session.pause()
            locationManager.stopUpdatingLocation()
            lastLocation = nil
            WKInterfaceDevice.current().play(.stop)
        } else if state == .paused {
            if let pausedAt { pausedDuration += Date().timeIntervalSince(pausedAt) }
            self.pausedAt = nil
            state = .running
            session.resume()
            locationManager.startUpdatingLocation()
            lastLocation = nil
            WKInterfaceDevice.current().play(.start)
        }
    }

    func finishRun() {
        guard state == .running || state == .paused else { return }
        state = .saving
        timer?.invalidate(); timer = nil
        locationManager.stopUpdatingLocation()
        workoutSession?.end()
        WKInterfaceDevice.current().play(.success)
    }

    private func resetRunValues() {
        elapsedSeconds = 0
        distanceMeters = 0
        heartRate = 0
        averageHeartRate = 0
        activeCalories = 0
        pausedDuration = 0
        pausedAt = nil
        lastLocation = nil
        routeLocations = []
        heartRateTotal = 0
        heartRateSamples = 0
    }

    private func startTimer() {
        timer?.invalidate()
        timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { [weak self] _ in
            Task { @MainActor in self?.refreshElapsed() }
        }
    }

    private func refreshElapsed() {
        guard let startedAt else { return }
        let currentPause = pausedAt.map { Date().timeIntervalSince($0) } ?? 0
        elapsedSeconds = max(0, Int(Date().timeIntervalSince(startedAt) - pausedDuration - currentPause))
    }

    private func completeWorkout(at endDate: Date) {
        guard let builder = workoutBuilder else {
            finalizePayload(endDate: endDate, workout: nil)
            return
        }
        builder.endCollection(withEnd: endDate) { [weak self] _, error in
            guard let self else { return }
            if let error {
                Task { @MainActor in self.errorMessage = "운동 저장 오류: \(error.localizedDescription)" }
            }
            builder.finishWorkout { workout, finishError in
                if let finishError {
                    Task { @MainActor in self.errorMessage = "Health 운동 저장 오류: \(finishError.localizedDescription)" }
                }
                if let workout, let routeBuilder = self.routeBuilder, !self.routeLocations.isEmpty {
                    routeBuilder.finishRoute(with: workout, metadata: nil) { _, routeError in
                        if let routeError {
                            Task { @MainActor in self.errorMessage = "GPS 경로 저장 오류: \(routeError.localizedDescription)" }
                        }
                        Task { @MainActor in self.finalizePayload(endDate: endDate, workout: workout) }
                    }
                } else {
                    Task { @MainActor in self.finalizePayload(endDate: endDate, workout: workout) }
                }
            }
        }
    }

    private func finalizePayload(endDate: Date, workout: HKWorkout?) {
        refreshElapsed()
        let runId = UUID().uuidString.lowercased()
        let route = routeLocations.suffix(3000).map { location -> [String: Any] in
            [
                "lat": location.coordinate.latitude,
                "lng": location.coordinate.longitude,
                "ts": Int(location.timestamp.timeIntervalSince1970 * 1000),
                "accuracy": location.horizontalAccuracy
            ]
        }
        let payload: [String: Any] = [
            "id": runId,
            "source": "apple_watch",
            "startedAt": Int((startedAt ?? endDate).timeIntervalSince1970 * 1000),
            "finishedAt": Int(endDate.timeIntervalSince1970 * 1000),
            "elapsedSeconds": elapsedSeconds,
            "distanceMeters": distanceMeters,
            "avgPaceSecPerKm": distanceMeters >= 50 ? Int(Double(elapsedSeconds) / (distanceMeters / 1000)) : 0,
            "activeCalories": activeCalories,
            "averageHeartRate": averageHeartRate,
            "workoutUUID": workout?.uuid.uuidString ?? "",
            "route": route
        ]
        queueForPhone(payload)
        state = .finished
        workoutSession = nil
        workoutBuilder = nil
        routeBuilder = nil
        startedAt = nil
    }

    private func queueForPhone(_ payload: [String: Any]) {
        let defaults = UserDefaults.standard
        var pending = defaults.array(forKey: "ttwittun.watch.pendingRuns") as? [[String: Any]] ?? []
        pending.append(payload)
        defaults.set(pending, forKey: "ttwittun.watch.pendingRuns")
        flushPendingRuns()
    }

    private func flushPendingRuns() {
        guard let session = wcSession, session.activationState == .activated else {
            refreshPendingSyncCount(); return
        }
        let defaults = UserDefaults.standard
        let pending = defaults.array(forKey: "ttwittun.watch.pendingRuns") as? [[String: Any]] ?? []
        guard !pending.isEmpty else { refreshPendingSyncCount(); return }
        for payload in pending {
            session.transferUserInfo(["kind": "ttwittunWatchRun", "payload": payload])
        }
        defaults.removeObject(forKey: "ttwittun.watch.pendingRuns")
        refreshPendingSyncCount()
    }

    private func refreshPendingSyncCount() {
        let pending = UserDefaults.standard.array(forKey: "ttwittun.watch.pendingRuns") as? [[String: Any]] ?? []
        pendingSyncCount = pending.count
    }
}

extension WatchRunManager: CLLocationManagerDelegate {
    nonisolated func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        let status = manager.authorizationStatus
        if status == .denied || status == .restricted {
            Task { @MainActor in
                self.isAuthorized = false
                self.errorMessage = "Apple Watch 설정에서 위치 권한을 허용해주세요."
            }
        }
    }

    nonisolated func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        Task { @MainActor in self.errorMessage = error.localizedDescription }
    }

    nonisolated func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        let good = locations.filter { $0.horizontalAccuracy >= 0 && $0.horizontalAccuracy <= 60 }
        guard !good.isEmpty else { return }
        Task { @MainActor in
            guard self.state == .running else { return }
            for location in good {
                if let previous = self.lastLocation {
                    let delta = location.distance(from: previous)
                    if delta >= 1 && delta < 120 { self.distanceMeters += delta }
                }
                self.lastLocation = location
                self.routeLocations.append(location)
                if self.routeLocations.count > 3000 { self.routeLocations.removeFirst(self.routeLocations.count - 3000) }
            }
            self.routeBuilder?.insertRouteData(good) { _, _ in }
        }
    }
}

extension WatchRunManager: HKWorkoutSessionDelegate {
    nonisolated func workoutSession(_ workoutSession: HKWorkoutSession, didChangeTo toState: HKWorkoutSessionState, from fromState: HKWorkoutSessionState, date: Date) {
        if toState == .ended {
            Task { @MainActor in self.completeWorkout(at: date) }
        }
    }

    nonisolated func workoutSession(_ workoutSession: HKWorkoutSession, didFailWithError error: Error) {
        Task { @MainActor in
            self.timer?.invalidate(); self.timer = nil
            self.state = .idle
            self.errorMessage = "Workout 오류: \(error.localizedDescription)"
        }
    }
}

extension WatchRunManager: HKLiveWorkoutBuilderDelegate {
    nonisolated func workoutBuilderDidCollectEvent(_ workoutBuilder: HKLiveWorkoutBuilder) {}

    nonisolated func workoutBuilder(_ workoutBuilder: HKLiveWorkoutBuilder, didCollectDataOf collectedTypes: Set<HKSampleType>) {
        Task { @MainActor in
            for type in collectedTypes {
                guard let quantityType = type as? HKQuantityType,
                      let stats = workoutBuilder.statistics(for: quantityType) else { continue }
                switch quantityType.identifier {
                case HKQuantityTypeIdentifier.heartRate.rawValue:
                    if let value = stats.mostRecentQuantity()?.doubleValue(for: HKUnit.count().unitDivided(by: .minute())) {
                        self.heartRate = value
                        self.heartRateTotal += value
                        self.heartRateSamples += 1
                        self.averageHeartRate = self.heartRateTotal / Double(self.heartRateSamples)
                    }
                case HKQuantityTypeIdentifier.activeEnergyBurned.rawValue:
                    self.activeCalories = stats.sumQuantity()?.doubleValue(for: .kilocalorie()) ?? self.activeCalories
                default:
                    break
                }
            }
        }
    }
}

extension WatchRunManager: WCSessionDelegate {
    nonisolated func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        Task { @MainActor in
            if let error { self.errorMessage = "iPhone 연결 오류: \(error.localizedDescription)" }
            self.flushPendingRuns()
        }
    }

    nonisolated func session(_ session: WCSession, didReceiveMessage message: [String : Any]) {
        if message["kind"] as? String == "flushWatchRuns" {
            Task { @MainActor in self.flushPendingRuns() }
        }
    }
}
