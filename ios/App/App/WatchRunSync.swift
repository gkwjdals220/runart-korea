import Foundation
import WatchConnectivity

final class WatchRunSync: NSObject, WCSessionDelegate {
    static let shared = WatchRunSync()
    private let defaultsKey = "ttwittun.iphone.pendingWatchRuns"
    private var session: WCSession?

    private override init() {
        super.init()
    }

    func start() {
        guard WCSession.isSupported() else { return }
        let session = WCSession.default
        session.delegate = self
        session.activate()
        self.session = session
    }

    var status: [String: Any] {
        guard let session else {
            return ["supported": false, "paired": false, "watchAppInstalled": false, "reachable": false]
        }
        return [
            "supported": true,
            "paired": session.isPaired,
            "watchAppInstalled": session.isWatchAppInstalled,
            "reachable": session.isReachable,
            "activationState": session.activationState.rawValue
        ]
    }

    func pendingRuns() -> [[String: Any]] {
        UserDefaults.standard.array(forKey: defaultsKey) as? [[String: Any]] ?? []
    }

    func acknowledge(_ id: String) {
        var rows = pendingRuns()
        rows.removeAll { ($0["id"] as? String) == id }
        UserDefaults.standard.set(rows, forKey: defaultsKey)
    }

    func requestFlush() {
        guard let session, session.activationState == .activated else { return }
        if session.isReachable {
            session.sendMessage(["kind": "flushWatchRuns"], replyHandler: nil, errorHandler: nil)
        }
    }

    private func persist(_ payload: [String: Any]) {
        guard let id = payload["id"] as? String, !id.isEmpty else { return }
        var rows = pendingRuns()
        if !rows.contains(where: { ($0["id"] as? String) == id }) {
            rows.append(payload)
            if rows.count > 100 { rows.removeFirst(rows.count - 100) }
            UserDefaults.standard.set(rows, forKey: defaultsKey)
        }
        DispatchQueue.main.async {
            NotificationCenter.default.post(name: .ttwittunWatchRunReceived, object: nil, userInfo: payload)
        }
    }

    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        if activationState == .activated { requestFlush() }
    }

    func sessionDidBecomeInactive(_ session: WCSession) {}

    func sessionDidDeactivate(_ session: WCSession) {
        session.activate()
    }

    func session(_ session: WCSession, didReceiveUserInfo userInfo: [String : Any] = [:]) {
        guard userInfo["kind"] as? String == "ttwittunWatchRun",
              let payload = userInfo["payload"] as? [String: Any] else { return }
        persist(payload)
    }

    func session(_ session: WCSession, didReceiveMessage message: [String : Any]) {
        guard message["kind"] as? String == "ttwittunWatchRun",
              let payload = message["payload"] as? [String: Any] else { return }
        persist(payload)
    }
}

extension Notification.Name {
    static let ttwittunWatchRunReceived = Notification.Name("ttwittun.watchRunReceived")
}
