import SwiftUI

@main
struct TTWITTUNWatchApp: App {
    @StateObject private var runManager = WatchRunManager()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(runManager)
        }
    }
}
