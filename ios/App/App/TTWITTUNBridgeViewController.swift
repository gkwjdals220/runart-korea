import Capacitor

/// Registers native functionality that is always part of the baseline iOS app target.
/// Apple Watch support is injected by `npm run mobile:watch` when the watch target is configured.
final class TTWITTUNBridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        super.capacitorDidLoad()
        bridge?.registerPluginInstance(TTWITTUNRunPlugin())
    }
}
