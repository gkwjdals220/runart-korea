import SwiftUI

struct ContentView: View {
    @EnvironmentObject private var run: WatchRunManager

    private let lime = Color(red: 214 / 255, green: 1, blue: 47 / 255)

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            if run.state == .idle || run.state == .finished {
                readyView
            } else {
                activeView
            }
        }
        .task {
            await run.prepare()
        }
        .alert("뛰뚠뛰뚠", isPresented: Binding(get: { run.errorMessage != nil }, set: { if !$0 { run.errorMessage = nil } })) {
            Button("확인", role: .cancel) { run.errorMessage = nil }
        } message: {
            Text(run.errorMessage ?? "")
        }
    }

    private var readyView: some View {
        ScrollView {
            VStack(spacing: 10) {
                Text("TTWITTUN")
                    .font(.system(size: 12, weight: .black, design: .rounded))
                    .foregroundStyle(lime)
                Text("WATCH RUN")
                    .font(.system(size: 10, weight: .bold, design: .rounded))
                    .foregroundStyle(.secondary)

                Button {
                    Task { await run.startRun() }
                } label: {
                    ZStack {
                        Circle()
                            .fill(lime)
                            .frame(width: 92, height: 92)
                            .shadow(color: lime.opacity(0.32), radius: 14)
                        Image(systemName: "figure.run")
                            .font(.system(size: 40, weight: .black))
                            .foregroundStyle(.black)
                    }
                }
                .buttonStyle(.plain)
                .disabled(!run.isAuthorized || run.state == .saving)

                Text(run.isAuthorized ? "워치 단독 러닝 시작" : "Health·위치 권한 확인 중")
                    .font(.system(size: 12, weight: .bold, design: .rounded))

                if run.state == .finished {
                    VStack(spacing: 2) {
                        Text("마지막 러닝")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                        Text(String(format: "%.2f km · %@", run.distanceKm, run.elapsedText))
                            .font(.system(size: 13, weight: .bold, design: .rounded))
                    }
                    .padding(.top, 4)
                }

                if run.pendingSyncCount > 0 {
                    Text("iPhone 동기화 대기 \(run.pendingSyncCount)건")
                        .font(.caption2)
                        .foregroundStyle(lime)
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.horizontal, 8)
        }
    }

    private var activeView: some View {
        TabView {
            metricsPage
            controlPage
        }
        .tabViewStyle(.verticalPage)
    }

    private var metricsPage: some View {
        VStack(spacing: 3) {
            HStack {
                Circle()
                    .fill(run.state == .paused ? Color.orange : lime)
                    .frame(width: 7, height: 7)
                Text(run.state == .paused ? "PAUSED" : "RUNNING")
                    .font(.system(size: 9, weight: .black, design: .rounded))
                    .foregroundStyle(run.state == .paused ? .orange : lime)
                Spacer()
                Text(run.elapsedText)
                    .font(.system(size: 11, weight: .bold, design: .monospaced))
            }

            Spacer(minLength: 1)

            Text(String(format: "%.2f", run.distanceKm))
                .font(.system(size: 39, weight: .black, design: .rounded))
                .minimumScaleFactor(0.7)
            Text("KM")
                .font(.system(size: 9, weight: .black, design: .rounded))
                .foregroundStyle(.secondary)

            Spacer(minLength: 2)

            HStack(spacing: 4) {
                metricBox(title: "PACE", value: run.paceText)
                metricBox(title: "BPM", value: run.heartRate > 0 ? String(Int(run.heartRate.rounded())) : "--")
                metricBox(title: "KCAL", value: String(Int(run.activeCalories.rounded())))
            }
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 5)
    }

    private var controlPage: some View {
        VStack(spacing: 8) {
            Text("TTWITTUN RUN")
                .font(.system(size: 11, weight: .black, design: .rounded))
                .foregroundStyle(lime)

            Button {
                run.togglePause()
            } label: {
                Label(run.state == .paused ? "다시 시작" : "일시정지", systemImage: run.state == .paused ? "play.fill" : "pause.fill")
                    .frame(maxWidth: .infinity)
            }
            .tint(run.state == .paused ? lime : .white)
            .foregroundStyle(.black)

            Button(role: .destructive) {
                run.finishRun()
            } label: {
                Label("러닝 종료", systemImage: "stop.fill")
                    .frame(maxWidth: .infinity)
            }

            Text("iPhone 없이도 GPS·심박·운동 기록을 저장합니다.")
                .font(.caption2)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding(.horizontal, 8)
    }

    private func metricBox(title: String, value: String) -> some View {
        VStack(spacing: 1) {
            Text(value)
                .font(.system(size: 13, weight: .black, design: .rounded))
                .minimumScaleFactor(0.7)
            Text(title)
                .font(.system(size: 7, weight: .bold, design: .rounded))
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 5)
        .background(Color.white.opacity(0.08), in: RoundedRectangle(cornerRadius: 9, style: .continuous))
    }
}
