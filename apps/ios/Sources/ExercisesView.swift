import SwiftUI

struct ExercisesView: View {
    @EnvironmentObject var vm: TrainingViewModel
    @State private var showingForm = false

    var body: some View {
        NavigationStack {
            ZStack {
                Theme.background.ignoresSafeArea()

                List {
                    // My Exercises
                    Section {
                        if vm.userExercises.isEmpty {
                            Text("No custom exercises yet")
                                .foregroundStyle(Theme.hint)
                        }
                        ForEach(vm.userExercises) { ex in
                            exerciseRow(name: ex.name, detail: "\(ex.muscleGroup) · \(ex.type) · \(ex.defaultSets)x\(ex.defaultReps) @ \(Int(ex.defaultWeightKg)) \(vm.units)")
                        }
                        .onDelete { indexSet in
                            for idx in indexSet {
                                let id = vm.userExercises[idx].id
                                Task { await vm.deleteExercise(id) }
                            }
                        }
                    } header: {
                        Text("My Exercises").foregroundStyle(Theme.text)
                    }

                    // Catalog
                    Section {
                        ForEach(vm.catalogExercises) { ex in
                            exerciseRow(name: ex.name, detail: "\(ex.muscleGroup) · \(ex.category) · \(ex.defaultSets)x\(ex.defaultReps) @ \(Int(ex.defaultWeight)) lbs")
                        }
                    } header: {
                        Text("Exercise Catalog").foregroundStyle(Theme.text)
                    }
                }
                .scrollContentBackground(.hidden)
            }
            .navigationTitle("Exercises")
            .toolbarColorScheme(.dark, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button { showingForm = true } label: {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showingForm) {
                ExerciseFormView()
            }
            .task { await vm.loadExercises() }
        }
    }

    private func exerciseRow(name: String, detail: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(name).foregroundStyle(Theme.text).fontWeight(.medium)
            Text(detail).font(.caption).foregroundStyle(Theme.hint)
        }
        .listRowBackground(Theme.cardBg)
    }
}

struct ExerciseFormView: View {
    @EnvironmentObject var vm: TrainingViewModel
    @Environment(\.dismiss) private var dismiss

    @State private var exercise = UserExercise.empty

    private let types = ["strength", "cardio", "flexibility", "bodyweight"]
    private let muscleGroups = ["Quads", "Hamstrings", "Glutes", "Back", "Chest", "Shoulders", "Arms", "Core", "Full Body"]

    var body: some View {
        NavigationStack {
            ZStack {
                Theme.background.ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 14) {
                        formField("Exercise Name", text: $exercise.name)

                        formPicker("Type", selection: $exercise.type, options: types)
                        formPicker("Muscle Group", selection: $exercise.muscleGroup, options: muscleGroups)

                        HStack(spacing: 12) {
                            formNumber("Sets", value: $exercise.defaultSets)
                            formNumber("Reps", value: $exercise.defaultReps)
                            formDouble("Weight", value: $exercise.defaultWeightKg)
                        }

                        Button {
                            exercise.id = UUID().uuidString.lowercased()
                            Task {
                                await vm.createExercise(exercise)
                                dismiss()
                            }
                        } label: {
                            Text("Add Exercise")
                                .frame(maxWidth: .infinity)
                                .padding(14)
                                .background(exercise.name.isEmpty ? Theme.secondaryBtn : Theme.accent)
                                .foregroundStyle(.white)
                                .clipShape(RoundedRectangle(cornerRadius: 10))
                        }
                        .disabled(exercise.name.isEmpty)
                    }
                    .padding()
                }
            }
            .navigationTitle("New Exercise")
            .toolbarColorScheme(.dark, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }

    private func formField(_ label: String, text: Binding<String>) -> some View {
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

    private func formPicker(_ label: String, selection: Binding<String>, options: [String]) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label).font(.caption).foregroundStyle(Theme.hint)
            Picker(label, selection: selection) {
                ForEach(options, id: \.self) { Text($0.capitalized).tag($0) }
            }
            .pickerStyle(.menu)
            .padding(10)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Theme.inputBg)
            .clipShape(RoundedRectangle(cornerRadius: 8))
            .overlay(RoundedRectangle(cornerRadius: 8).stroke(Theme.border, lineWidth: 1))
        }
    }

    private func formNumber(_ label: String, value: Binding<Int>) -> some View {
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

    private func formDouble(_ label: String, value: Binding<Double>) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label).font(.caption).foregroundStyle(Theme.hint)
            TextField(label, value: value, format: .number)
                .keyboardType(.decimalPad)
                .padding(10)
                .background(Theme.inputBg)
                .foregroundStyle(Theme.text)
                .clipShape(RoundedRectangle(cornerRadius: 8))
                .overlay(RoundedRectangle(cornerRadius: 8).stroke(Theme.border, lineWidth: 1))
        }
    }
}
