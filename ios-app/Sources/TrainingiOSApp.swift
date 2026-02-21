import SwiftUI

@main
struct TrainingiOSApp: App {
    @StateObject private var vm = TrainingViewModel()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(vm)
        }
    }
}
