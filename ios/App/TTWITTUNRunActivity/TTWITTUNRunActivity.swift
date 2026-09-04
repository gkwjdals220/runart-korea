import ActivityKit
import WidgetKit
import SwiftUI
import Foundation

private func paceText(_ seconds: Int?) -> String {
    guard let seconds, seconds > 0 else { return "--:--" }
    return "\(seconds / 60):\(String(format: "%02d", seconds % 60))"
}

private func elapsedText(_ seconds: Int) -> String {
    let hours = seconds / 3600, minutes = (seconds % 3600) / 60, rest = seconds % 60
    return hours > 0 ? String(format: "%d:%02d:%02d", hours, minutes, rest) : String(format: "%02d:%02d", minutes, rest)
}

struct TTWITTUNRunActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: RunActivityAttributes.self) { context in
            HStack(spacing: 14) {
                ZStack { Circle().fill(Color(red: 0.84, green: 1, blue: 0.18)); Image(systemName: context.state.paused ? "pause.fill" : "figure.run").foregroundStyle(.black) }.frame(width: 44, height: 44)
                VStack(alignment: .leading, spacing: 3) { Text(context.attributes.runName).font(.caption).foregroundStyle(.secondary).lineLimit(1); Text("\(context.state.distanceKm, specifier: "%.2f") km").font(.title3.bold()) }
                Spacer()
                VStack(alignment: .trailing, spacing: 3) { Text(elapsedText(context.state.elapsedSeconds)).font(.headline.monospacedDigit()); Text("\(paceText(context.state.paceSecondsPerKm))/km").font(.caption).foregroundStyle(.secondary) }
            }
            .padding(14)
            .activityBackgroundTint(Color(red: 0.055, green: 0.075, blue: 0.09))
            .activitySystemActionForegroundColor(.white)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) { Label("\(context.state.distanceKm, specifier: "%.2f") km", systemImage: "figure.run").font(.headline) }
                DynamicIslandExpandedRegion(.trailing) { Text(elapsedText(context.state.elapsedSeconds)).font(.headline.monospacedDigit()) }
                DynamicIslandExpandedRegion(.bottom) { HStack { Text(context.attributes.runName).lineLimit(1); Spacer(); Text("\(paceText(context.state.paceSecondsPerKm))/km") }.font(.caption) }
            } compactLeading: {
                Image(systemName: context.state.paused ? "pause.fill" : "figure.run").foregroundStyle(Color(red: 0.84, green: 1, blue: 0.18))
            } compactTrailing: {
                Text("\(context.state.distanceKm, specifier: "%.1f")K").font(.caption2.bold()).monospacedDigit()
            } minimal: {
                Image(systemName: "figure.run").foregroundStyle(Color(red: 0.84, green: 1, blue: 0.18))
            }
            .keylineTint(Color(red: 0.84, green: 1, blue: 0.18))
        }
    }
}

@main
struct TTWITTUNRunActivityBundle: WidgetBundle {
    var body: some Widget { TTWITTUNRunActivity() }
}
