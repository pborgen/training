import SwiftUI

struct ContentView: View {
    @EnvironmentObject var vm: TrainingViewModel

    var body: some View {
        NavigationStack {
            VStack(spacing: 10) {
                HStack {
                    TextField("Backend URL", text: $vm.baseURL)
                        .textInputAutocapitalization(.never)
                    TextField("User Email", text: $vm.userEmail)
                        .textInputAutocapitalization(.never)
                }
                .padding(8)
                .background(.thinMaterial)
                .clipShape(RoundedRectangle(cornerRadius: 8))

                HStack {
                    Button("Google Sign-In") { Task { await signIn() } }
                    Button("Pull") { Task { await vm.pull() } }
                    Button("Push") { Task { await vm.push() } }
                    Button("Add Row") { vm.addRow() }
                }
                .buttonStyle(.borderedProminent)

                ChartsView(rows: vm.rows)

                List {
                    Section("Workout Rows") {
                        ForEach(Array(vm.rows.enumerated()), id: \.element.id) { idx, _ in
                            VStack(alignment: .leading) {
                                TextField("Exercise", text: $vm.rows[idx].Exercise)
                                HStack {
                                    TextField("Weight", text: $vm.rows[idx].Weight)
                                    TextField("Sets", text: $vm.rows[idx].Sets)
                                    TextField("Reps", text: $vm.rows[idx].Reps)
                                    TextField("Volume", text: $vm.rows[idx].Volume)
                                }
                                .textFieldStyle(.roundedBorder)
                                Button("Recalc") { vm.recalc(idx) }
                                    .buttonStyle(.bordered)
                            }
                        }
                    }
                }

                if !vm.status.isEmpty {
                    Text(vm.status).font(.footnote).foregroundStyle(.secondary)
                }
            }
            .padding()
            .navigationTitle("Training")
        }
    }

    private func signIn() async {
        guard let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let root = scene.windows.first?.rootViewController else {
            vm.status = "No root view controller"
            return
        }
        do {
            let t = try await GoogleSignInManager.shared.signIn(presentingViewController: root)
            vm.idToken = t.idToken
            vm.userEmail = t.email
            vm.status = "Signed in as \(t.email)"
        } catch {
            vm.status = "Google sign-in error: \(error.localizedDescription)"
        }
    }
}
