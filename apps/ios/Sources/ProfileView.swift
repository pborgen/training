import SwiftUI

struct ProfileView: View {
    @EnvironmentObject var vm: TrainingViewModel
    @State private var saved = false

    var body: some View {
        NavigationStack {
            ZStack {
                Theme.background.ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 16) {
                        profileField("Full Name", text: $vm.profile.fullName)
                        profileField("Age", value: $vm.profile.age)
                        profilePicker("Gender", selection: $vm.profile.gender,
                                      options: ["", "male", "female", "other"])
                        profileField("Height (cm)", double: $vm.profile.heightCm)
                        profileField("Weight (\(vm.units))", double: $vm.profile.weightKg)
                        profilePicker("Activity Level", selection: $vm.profile.activityLevel,
                                      options: ["sedentary", "light", "moderate", "active", "very_active"])

                        // Units toggle
                        HStack {
                            Text("Units").foregroundStyle(Theme.text)
                            Spacer()
                            Picker("Units", selection: $vm.profile.units) {
                                Text("lbs").tag("lbs")
                                Text("kg").tag("kg")
                            }
                            .pickerStyle(.segmented)
                            .frame(width: 140)
                        }
                        .padding(12)
                        .background(Theme.cardBg)
                        .clipShape(RoundedRectangle(cornerRadius: 8))

                        Button {
                            Task {
                                await vm.saveProfile()
                                saved = true
                                try? await Task.sleep(for: .seconds(2))
                                saved = false
                            }
                        } label: {
                            Text(saved ? "Saved!" : "Save Profile")
                                .frame(maxWidth: .infinity)
                                .padding(14)
                                .background(saved ? Theme.success : Theme.accent)
                                .foregroundStyle(.white)
                                .clipShape(RoundedRectangle(cornerRadius: 10))
                        }

                        Divider().background(Theme.border)

                        Button {
                            vm.signOut()
                        } label: {
                            Text("Sign Out")
                                .frame(maxWidth: .infinity)
                                .padding(14)
                                .background(Theme.danger)
                                .foregroundStyle(.white)
                                .clipShape(RoundedRectangle(cornerRadius: 10))
                        }
                    }
                    .padding()
                }
            }
            .navigationTitle("Profile")
            .toolbarColorScheme(.dark, for: .navigationBar)
            .task { await vm.loadProfile() }
        }
    }

    private func profileField(_ label: String, text: Binding<String>) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label).font(.caption).foregroundStyle(Theme.hint)
            TextField(label, text: text)
                .padding(10)
                .background(Theme.inputBg)
                .foregroundStyle(Theme.text)
                .clipShape(RoundedRectangle(cornerRadius: 8))
                .overlay(RoundedRectangle(cornerRadius: 8).stroke(Theme.border, lineWidth: 1))
        }
    }

    private func profileField(_ label: String, value: Binding<Int>) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label).font(.caption).foregroundStyle(Theme.hint)
            TextField(label, value: value, format: .number)
                .keyboardType(.numberPad)
                .padding(10)
                .background(Theme.inputBg)
                .foregroundStyle(Theme.text)
                .clipShape(RoundedRectangle(cornerRadius: 8))
                .overlay(RoundedRectangle(cornerRadius: 8).stroke(Theme.border, lineWidth: 1))
        }
    }

    private func profileField(_ label: String, double: Binding<Double>) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label).font(.caption).foregroundStyle(Theme.hint)
            TextField(label, value: double, format: .number)
                .keyboardType(.decimalPad)
                .padding(10)
                .background(Theme.inputBg)
                .foregroundStyle(Theme.text)
                .clipShape(RoundedRectangle(cornerRadius: 8))
                .overlay(RoundedRectangle(cornerRadius: 8).stroke(Theme.border, lineWidth: 1))
        }
    }

    private func profilePicker(_ label: String, selection: Binding<String>, options: [String]) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label).font(.caption).foregroundStyle(Theme.hint)
            Picker(label, selection: selection) {
                ForEach(options, id: \.self) { opt in
                    Text(opt.isEmpty ? "Select..." : opt.replacingOccurrences(of: "_", with: " ").capitalized)
                        .tag(opt)
                }
            }
            .pickerStyle(.menu)
            .padding(10)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Theme.inputBg)
            .clipShape(RoundedRectangle(cornerRadius: 8))
            .overlay(RoundedRectangle(cornerRadius: 8).stroke(Theme.border, lineWidth: 1))
        }
    }
}
