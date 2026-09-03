import Foundation
#if canImport(ActivityKit)
import ActivityKit

@available(iOS 16.1, *)
struct RunActivityAttributes: ActivityAttributes {
    struct ContentState: Codable, Hashable {
        var distanceKm: Double
        var elapsedSeconds: Int
        var paceSecondsPerKm: Int?
        var paused: Bool
    }

    var runName: String
    var startedAt: Date
}
#endif
