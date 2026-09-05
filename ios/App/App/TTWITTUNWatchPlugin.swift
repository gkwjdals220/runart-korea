import Foundation
import Capacitor

@objc(TTWITTUNWatchPlugin)
public final class TTWITTUNWatchPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "TTWITTUNWatchPlugin"
    public let jsName = "TTWITTUNWatch"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "status", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "pendingRuns", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "acknowledge", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestFlush", returnType: CAPPluginReturnPromise)
    ]

    private var observer: NSObjectProtocol?

    public override func load() {
        WatchRunSync.shared.start()
        observer = NotificationCenter.default.addObserver(
            forName: .ttwittunWatchRunReceived,
            object: nil,
            queue: .main
        ) { [weak self] notification in
            guard let payload = notification.userInfo as? [String: Any] else { return }
            self?.notifyListeners("watchRunReceived", data: payload)
        }
    }

    deinit {
        if let observer { NotificationCenter.default.removeObserver(observer) }
    }

    @objc func status(_ call: CAPPluginCall) {
        call.resolve(WatchRunSync.shared.status)
    }

    @objc func pendingRuns(_ call: CAPPluginCall) {
        call.resolve(["runs": WatchRunSync.shared.pendingRuns()])
    }

    @objc func acknowledge(_ call: CAPPluginCall) {
        guard let id = call.getString("id"), !id.isEmpty else {
            call.reject("watch run id가 필요합니다.")
            return
        }
        WatchRunSync.shared.acknowledge(id)
        call.resolve()
    }

    @objc func requestFlush(_ call: CAPPluginCall) {
        WatchRunSync.shared.requestFlush()
        call.resolve(WatchRunSync.shared.status)
    }
}
