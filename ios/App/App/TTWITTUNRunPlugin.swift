import Foundation
import CoreLocation
import Capacitor
#if canImport(ActivityKit)
import ActivityKit
#endif

@objc(TTWITTUNRunPlugin)
public class TTWITTUNRunPlugin: CAPPlugin, CAPBridgedPlugin, CLLocationManagerDelegate {
    public let identifier = "TTWITTUNRunPlugin"
    public let jsName = "TTWITTUNRun"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "start", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "pause", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "resume", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stop", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "status", returnType: CAPPluginReturnPromise)
    ]

    private let manager = CLLocationManager()
    private var startedAt: Date?
    private var pausedAt: Date?
    private var pausedDuration: TimeInterval = 0
    private var distanceMeters: Double = 0
    private var lastLocation: CLLocation?
    private var locations: [[String: Any]] = []
    private var runName = "자유 러닝"
    private var running = false
    private var paused = false
    private var activity: Any?
    private var liveActivityError: String?

    public override func load() {
        manager.delegate = self
        manager.activityType = .fitness
        manager.desiredAccuracy = kCLLocationAccuracyBest
        manager.distanceFilter = 3
        manager.pausesLocationUpdatesAutomatically = false
        manager.showsBackgroundLocationIndicator = true
        restorePersistedState()
    }

    @objc func start(_ call: CAPPluginCall) {
        guard CLLocationManager.locationServicesEnabled() else {
            call.reject("위치 서비스를 사용할 수 없습니다.")
            return
        }
        runName = call.getString("name") ?? "자유 러닝"
        reset()
        startedAt = Date()
        running = true
        paused = false
        manager.requestWhenInUseAuthorization()
        manager.allowsBackgroundLocationUpdates = true
        manager.startUpdatingLocation()
        startLiveActivity()
        persistState()
        emitUpdate()
        call.resolve(snapshot())
    }

    @objc func pause(_ call: CAPPluginCall) {
        guard running, !paused else { call.resolve(snapshot()); return }
        paused = true
        pausedAt = Date()
        lastLocation = nil
        updateLiveActivity()
        emitUpdate()
        call.resolve(snapshot())
    }

    @objc func resume(_ call: CAPPluginCall) {
        guard running, paused else { call.resolve(snapshot()); return }
        if let pausedAt { pausedDuration += Date().timeIntervalSince(pausedAt) }
        self.pausedAt = nil
        paused = false
        lastLocation = nil
        manager.startUpdatingLocation()
        updateLiveActivity()
        emitUpdate()
        call.resolve(snapshot())
    }

    @objc func stop(_ call: CAPPluginCall) {
        running = false
        paused = false
        manager.stopUpdatingLocation()
        manager.allowsBackgroundLocationUpdates = false
        endLiveActivity()
        let result = snapshot(includeTrack: true)
        clearPersistedState()
        call.resolve(result)
    }

    @objc func status(_ call: CAPPluginCall) {
        call.resolve(snapshot(includeTrack: true))
    }

    public func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        let status = manager.authorizationStatus
        if status == .denied || status == .restricted {
            notifyListeners("runError", data: ["message": "위치 권한을 허용해주세요."])
        }
    }

    public func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        notifyListeners("runError", data: ["message": error.localizedDescription])
    }

    public func locationManager(_ manager: CLLocationManager, didUpdateLocations updates: [CLLocation]) {
        guard running, !paused else { return }
        for location in updates where location.horizontalAccuracy >= 0 && location.horizontalAccuracy <= 80 {
            if let previous = lastLocation {
                let delta = location.distance(from: previous)
                if delta >= 1 && delta < 120 { distanceMeters += delta }
            }
            lastLocation = location
            locations.append([
                "lat": location.coordinate.latitude,
                "lng": location.coordinate.longitude,
                "ts": Int(location.timestamp.timeIntervalSince1970 * 1000),
                "accuracy": location.horizontalAccuracy
            ])
            if locations.count > 6000 { locations.removeFirst(locations.count - 6000) }
        }
        persistState()
        updateLiveActivity()
        emitUpdate()
    }

    private func elapsedSeconds() -> Int {
        guard let startedAt else { return 0 }
        let currentPause = pausedAt.map { Date().timeIntervalSince($0) } ?? 0
        return max(0, Int(Date().timeIntervalSince(startedAt) - pausedDuration - currentPause))
    }

    private func pace() -> Int? {
        guard distanceMeters >= 50 else { return nil }
        return Int(Double(elapsedSeconds()) / (distanceMeters / 1000))
    }

    private func snapshot(includeTrack: Bool = false) -> [String: Any] {
        var value: [String: Any] = [
            "available": true,
            "nativePlugin": true,
            "running": running,
            "paused": paused,
            "distanceM": distanceMeters,
            "elapsed": elapsedSeconds(),
            "name": runName,
            "startedAt": Int((startedAt ?? Date()).timeIntervalSince1970 * 1000),
            "pausedDuration": pausedDuration
        ]
        #if canImport(ActivityKit)
        if #available(iOS 16.1, *) {
            value["liveActivitySupported"] = true
            value["liveActivityEnabled"] = ActivityAuthorizationInfo().areActivitiesEnabled
            value["liveActivityActive"] = !Activity<RunActivityAttributes>.activities.isEmpty
        } else {
            value["liveActivitySupported"] = false
            value["liveActivityEnabled"] = false
            value["liveActivityActive"] = false
        }
        #else
        value["liveActivitySupported"] = false
        value["liveActivityEnabled"] = false
        value["liveActivityActive"] = false
        #endif
        if let liveActivityError { value["liveActivityError"] = liveActivityError }
        if let pace = pace() { value["paceSecPerKm"] = pace }
        if let accuracy = lastLocation?.horizontalAccuracy { value["accuracy"] = accuracy }
        if let location = lastLocation {
            value["point"] = ["lat": location.coordinate.latitude, "lng": location.coordinate.longitude, "ts": Int(location.timestamp.timeIntervalSince1970 * 1000), "accuracy": location.horizontalAccuracy]
        }
        if includeTrack { value["track"] = locations }
        return value
    }

    private func emitUpdate() {
        DispatchQueue.main.async { self.notifyListeners("runUpdate", data: self.snapshot()) }
    }

    private func reset() {
        startedAt = nil; pausedAt = nil; pausedDuration = 0; distanceMeters = 0
        lastLocation = nil; locations = []; running = false; paused = false
        liveActivityError = nil
    }

    private func persistState() {
        UserDefaults.standard.set(snapshot(includeTrack: true), forKey: "ttwittun.nativeRun")
    }

    private func restorePersistedState() {
        guard let value = UserDefaults.standard.dictionary(forKey: "ttwittun.nativeRun"),
              value["running"] as? Bool == true,
              let startedMillis = (value["startedAt"] as? NSNumber)?.doubleValue,
              Date().timeIntervalSince1970 * 1000 - startedMillis < 43_200_000 else {
            clearPersistedState()
            return
        }
        startedAt = Date(timeIntervalSince1970: startedMillis / 1000)
        pausedDuration = (value["pausedDuration"] as? NSNumber)?.doubleValue ?? 0
        distanceMeters = (value["distanceM"] as? NSNumber)?.doubleValue ?? 0
        runName = value["name"] as? String ?? "자유 러닝"
        locations = value["track"] as? [[String: Any]] ?? []
        running = true
        paused = value["paused"] as? Bool ?? false
        if paused { pausedAt = Date() }
        if let point = locations.last,
           let lat = (point["lat"] as? NSNumber)?.doubleValue,
           let lng = (point["lng"] as? NSNumber)?.doubleValue,
           let ts = (point["ts"] as? NSNumber)?.doubleValue {
            lastLocation = CLLocation(coordinate: CLLocationCoordinate2D(latitude: lat, longitude: lng), altitude: 0, horizontalAccuracy: (point["accuracy"] as? NSNumber)?.doubleValue ?? -1, verticalAccuracy: -1, timestamp: Date(timeIntervalSince1970: ts / 1000))
        }
        #if canImport(ActivityKit)
        if #available(iOS 16.1, *) { activity = Activity<RunActivityAttributes>.activities.first }
        #endif
        manager.allowsBackgroundLocationUpdates = true
        if !paused { manager.startUpdatingLocation() }
    }

    private func clearPersistedState() {
        UserDefaults.standard.removeObject(forKey: "ttwittun.nativeRun")
    }

    private func startLiveActivity() {
        #if canImport(ActivityKit)
        guard #available(iOS 16.1, *) else {
            liveActivityError = "Live Activity는 iOS 16.1 이상에서 사용할 수 있습니다."
            return
        }
        guard ActivityAuthorizationInfo().areActivitiesEnabled else {
            liveActivityError = "iPhone 설정에서 실시간 현황이 허용되지 않았습니다."
            return
        }
        guard let startedAt else {
            liveActivityError = "러닝 시작 시간이 생성되지 않았습니다."
            return
        }
        let attributes = RunActivityAttributes(runName: runName, startedAt: startedAt)
        let state = RunActivityAttributes.ContentState(distanceKm: 0, elapsedSeconds: 0, paceSecondsPerKm: nil, paused: false)
        do {
            activity = try Activity.request(attributes: attributes, contentState: state, pushType: nil)
            liveActivityError = nil
        } catch {
            liveActivityError = error.localizedDescription
            notifyListeners("runError", data: ["message": "Live Activity 오류: \(error.localizedDescription)"])
        }
        #else
        liveActivityError = "이 빌드에는 ActivityKit이 포함되지 않았습니다."
        #endif
    }

    private func updateLiveActivity() {
        #if canImport(ActivityKit)
        guard #available(iOS 16.1, *), let activity = activity as? Activity<RunActivityAttributes> else { return }
        let state = RunActivityAttributes.ContentState(distanceKm: distanceMeters / 1000, elapsedSeconds: elapsedSeconds(), paceSecondsPerKm: pace(), paused: paused)
        Task { await activity.update(using: state) }
        #endif
    }

    private func endLiveActivity() {
        #if canImport(ActivityKit)
        guard #available(iOS 16.1, *), let activity = activity as? Activity<RunActivityAttributes> else { return }
        let state = RunActivityAttributes.ContentState(distanceKm: distanceMeters / 1000, elapsedSeconds: elapsedSeconds(), paceSecondsPerKm: pace(), paused: false)
        Task { await activity.end(using: state, dismissalPolicy: .default) }
        self.activity = nil
        #endif
    }
}
