import SwiftUI

struct ContentView: View {
    @EnvironmentObject var vm: TrainingViewModel

    var body: some View {
        NavigationStack {
            VStack(spacing: 10) {
                TextField("Backend URL", text: $vm.baseURL)
                    .textInputAutocapitalization(.never)
                    .padding(8)
                    .background(.thinMaterial)
                    .clipShape(RoundedRectangle(cornerRadius: 8))

                TextField("User Email", text: $vm.userEmail)
                    .textInputAutocapitalization(.never)
                    .padding(8)
                    .background(.thinMaterial)
                    .clipShape(RoundedRectangle(cornerRadius: 8))

                HStack {
                    Button("Pull") { Task { await vm.pull() } }
                    Button("Push") { Task { await vm.push() } }
                    Button("Add Row") { vm.addRow() }
                }
                .buttonStyle(.borderedProminent)

                List {
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

                if !vm.status.isEmpty {
                    Text(vm.status).font(.footnote).foregroundStyle(.secondary)
                }
            }
            .padding()
            .navigationTitle("Training")
        }
    }
}
