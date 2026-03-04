import SwiftUI

struct RoutinesView: View {
    @EnvironmentObject var vm: TrainingViewModel
    @State private var showingNewRoutine = false

    var body: some View {
        NavigationStack {
            ZStack {
                Theme.background.ignoresSafeArea()

                List {
                    if vm.routines.isEmpty {
                        Text("No routines yet. Tap + to create one.")
                            .foregroundStyle(Theme.hint)
                            .listRowBackground(Theme.cardBg)
                    }
                    ForEach(vm.routines) { routine in
                        NavigationLink(value: routine.id) {
                            VStack(alignment: .leading, spacing: 4) {
                                HStack {
                                    Text(routine.name)
                                        .foregroundStyle(Theme.text)
                                        .fontWeight(.semibold)
                                    if !routine.goal.isEmpty {
                                        Text(routine.goal.replacingOccurrences(of: "_", with: " "))
                                            .font(.caption)
                                            .padding(.horizontal, 8)
                                            .padding(.vertical, 2)
                                            .background(Theme.accent.opacity(0.3))
                                            .foregroundStyle(Theme.accent)
                                            .clipShape(Capsule())
                                    }
                                }
                                Text("\(routine.exercises.count) exercises · \(routine.daysPerWeek) days/wk")
                                    .font(.caption)
                                    .foregroundStyle(Theme.hint)
                            }
                        }
                        .listRowBackground(Theme.cardBg)
                    }
                    .onDelete { indexSet in
                        for idx in indexSet {
                            let id = vm.routines[idx].id
                            Task { await vm.deleteRoutine(id) }
                        }
                    }
                }
                .scrollContentBackground(.hidden)
                .navigationDestination(for: String.self) { routineId in
                    if let routine = vm.routines.first(where: { $0.id == routineId }) {
                        RoutineDetailView(routine: routine)
                    }
                }
            }
            .navigationTitle("Routines")
            .toolbarColorScheme(.dark, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button { showingNewRoutine = true } label: {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showingNewRoutine) {
                RoutineDetailView(routine: .empty, isNew: true)
            }
            .task { await vm.loadRoutines(); await vm.loadExercises() }
        }
    }
}

struct RoutineDetailView: View {
    @EnvironmentObject var vm: TrainingViewModel
    @Environment(\.dismiss) private var dismiss

    @State var routine: Routine
    var isNew: Bool = false

    @State private var showingExercisePicker = false

    private let goals = ["strength", "muscle_building", "endurance", "fat_loss", "general"]

    var body: some View {
        ZStack {
            Theme.background.ignoresSafeArea()

            ScrollView {
                VStack(spacing: 16) {
                    // Metadata
                    formField("Routine Name", text: $routine.name)

                    VStack(alignment: .leading, spacing: 4) {
                        Text("Goal").font(.caption).foregroundStyle(Theme.hint)
                        Picker("Goal", selection: $routine.goal) {
                            ForEach(goals, id: \.self) {
                                Text($0.replacingOccurrences(of: "_", with: " ").capitalized).tag($0)
                            }
                        }
                        .pickerStyle(.menu)
                        .padding(10)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Theme.inputBg)
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(Theme.border, lineWidth: 1))
                    }

                    formNumber("Days per Week", value: $routine.daysPerWeek)

                    // Exercises in routine
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Text("Exercises").font(.headline).foregroundStyle(Theme.text)
                            Spacer()
                            Button { showingExercisePicker = true } label: {
                                Image(systemName: "plus.circle.fill")
                                    .foregroundStyle(Theme.accent)
                            }
                        }

                        if routine.exercises.isEmpty {
                            Text("No exercises added yet")
                                .foregroundStyle(Theme.hint)
                                .padding(.vertical, 8)
                        }

                        ForEach(Array(routine.exercises.enumerated()), id: \.element.exerciseId) { idx, ex in
                            HStack {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(ex.exerciseName ?? vm.exerciseName(for: ex.exerciseId))
                                        .foregroundStyle(Theme.text)
                                        .fontWeight(.medium)
                                    Text("\(ex.sets)x\(ex.reps) @ \(Int(ex.weightKg)) \(vm.units)")
                                        .font(.caption)
                                        .foregroundStyle(Theme.hint)
                                }
                                Spacer()
                                Button {
                                    routine.exercises.remove(at: idx)
                                } label: {
                                    Image(systemName: "trash")
                                        .foregroundStyle(Theme.danger)
                                }
                            }
                            .padding(10)
                            .background(Theme.inputBg)
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                        }
                    }

                    // Start Workout button (for existing routines)
                    if !isNew && !routine.exercises.isEmpty {
                        Button {
                            vm.startWorkout(routine: routine)
                        } label: {
                            HStack {
                                Image(systemName: "play.fill")
                                Text("Start Workout")
                            }
                            .frame(maxWidth: .infinity)
                            .padding(14)
                            .background(Theme.success)
                            .foregroundStyle(.white)
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                        }
                    }

                    // Save button
                    Button {
                        Task {
                            if isNew {
                                await vm.createRoutine(routine)
                            } else {
                                await vm.updateRoutine(routine)
                            }
                            dismiss()
                        }
                    } label: {
                        Text(isNew ? "Create Routine" : "Save Changes")
                            .frame(maxWidth: .infinity)
                            .padding(14)
                            .background(routine.name.isEmpty ? Theme.secondaryBtn : Theme.accent)
                            .foregroundStyle(.white)
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                    }
                    .disabled(routine.name.isEmpty)
                }
                .padding()
            }
        }
        .navigationTitle(isNew ? "New Routine" : routine.name)
        .toolbarColorScheme(.dark, for: .navigationBar)
        .toolbar {
            if isNew {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
        .sheet(isPresented: $showingExercisePicker) {
            ExercisePickerSheet(routine: $routine)
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
}

struct ExercisePickerSheet: View {
    @EnvironmentObject var vm: TrainingViewModel
    @Environment(\.dismiss) private var dismiss
    @Binding var routine: Routine

    @State private var sets = 3
    @State private var reps = 10
    @State private var weight: Double = 0

    var body: some View {
        NavigationStack {
            ZStack {
                Theme.background.ignoresSafeArea()

                List {
                    Section("Set Defaults") {
                        HStack(spacing: 12) {
                            VStack {
                                Text("Sets").font(.caption).foregroundStyle(Theme.hint)
                                TextField("Sets", value: $sets, format: .number)
                                    .keyboardType(.numberPad)
                                    .padding(8)
                                    .background(Theme.inputBg)
                                    .clipShape(RoundedRectangle(cornerRadius: 6))
                            }
                            VStack {
                                Text("Reps").font(.caption).foregroundStyle(Theme.hint)
                                TextField("Reps", value: $reps, format: .number)
                                    .keyboardType(.numberPad)
                                    .padding(8)
                                    .background(Theme.inputBg)
                                    .clipShape(RoundedRectangle(cornerRadius: 6))
                            }
                            VStack {
                                Text("Weight").font(.caption).foregroundStyle(Theme.hint)
                                TextField("Weight", value: $weight, format: .number)
                                    .keyboardType(.decimalPad)
                                    .padding(8)
                                    .background(Theme.inputBg)
                                    .clipShape(RoundedRectangle(cornerRadius: 6))
                            }
                        }
                        .foregroundStyle(Theme.text)
                        .listRowBackground(Theme.cardBg)
                    }

                    if !vm.catalogExercises.isEmpty {
                        Section("Catalog") {
                            ForEach(vm.catalogExercises) { ex in
                                Button {
                                    addExercise(id: ex.id, name: ex.name, defSets: ex.defaultSets, defReps: ex.defaultReps, defWeight: ex.defaultWeight)
                                } label: {
                                    VStack(alignment: .leading) {
                                        Text(ex.name).foregroundStyle(Theme.text)
                                        Text(ex.muscleGroup).font(.caption).foregroundStyle(Theme.hint)
                                    }
                                }
                                .listRowBackground(Theme.cardBg)
                            }
                        }
                    }

                    if !vm.userExercises.isEmpty {
                        Section("My Exercises") {
                            ForEach(vm.userExercises) { ex in
                                Button {
                                    addExercise(id: ex.id, name: ex.name, defSets: ex.defaultSets, defReps: ex.defaultReps, defWeight: ex.defaultWeightKg)
                                } label: {
                                    VStack(alignment: .leading) {
                                        Text(ex.name).foregroundStyle(Theme.text)
                                        Text(ex.muscleGroup).font(.caption).foregroundStyle(Theme.hint)
                                    }
                                }
                                .listRowBackground(Theme.cardBg)
                            }
                        }
                    }
                }
                .scrollContentBackground(.hidden)
            }
            .navigationTitle("Add Exercise")
            .toolbarColorScheme(.dark, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") { dismiss() }
                }
            }
        }
    }

    private func addExercise(id: String, name: String, defSets: Int, defReps: Int, defWeight: Double) {
        let re = RoutineExercise(
            exerciseId: id,
            exerciseName: name,
            sets: sets > 0 ? sets : defSets,
            reps: reps > 0 ? reps : defReps,
            weightKg: weight > 0 ? weight : defWeight
        )
        routine.exercises.append(re)
        dismiss()
    }
}
