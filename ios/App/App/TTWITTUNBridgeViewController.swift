import Capacitor

/// Registers native functionality that lives directly in the iOS app target.
final class TTWITTUNBridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        super.capacitorDidLoad()
        bridge?.registerPluginType(TTWITTUNRunPlugin.self)
    }
}
