import Capacitor

/// Registers native functionality that lives directly in the iOS app target.
final class TTWITTUNBridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        super.capacitorDidLoad()
        // Capacitor 7 ignores registerPluginType while automatic plugin
        // registration is enabled. Instance registration remains available for
        // plugins compiled directly into the application target.
        bridge?.registerPluginInstance(TTWITTUNRunPlugin())
    }
}
