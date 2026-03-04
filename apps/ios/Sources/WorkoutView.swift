import SwiftUI

struct WorkoutView: View {
    @EnvironmentObject var vm: TrainingViewModel
    @Environment(\.dismiss) private var dismiss

    let routine: Routine

    @State private var currentIndex = 0
    @State private var exerciseLogs: [ExerciseLog] = []
    @State private var currentSets: [SetLog] = []
    @State private var isFinished = false
    @State private var savedEntry: WorkoutLogEntry?
    @State private var startedAt = Date()

    var body: some View {
        ZStack {
            Theme.background.ignoresSafeArea()

            if isFinished, let entry = savedEntry {
                summaryView(entry)
            } else if currentIndex < exerciseLogs.count {
                exerciseView
            } else {
                finishView
            }
        }
        .onAppear { setupExerciseLogs() }
    }

    // MARK: - Exercise View

    private var exerciseView: some View {
        let current = exerciseLogs[currentIndex]
        return ScrollView {
            VStack(spacing: 16) {
                // Header
                HStack {
                    Button { dismiss() } label: {
                        Image(systemName: "xmark")
                            .foregroundStyle(Theme.hint)
                            .font(.title3)
                    }
                    Spacer()
                    Text("\(currentIndex + 1) of \(exerciseLogs.count)")
                        .foregroundStyle(Theme.hint)
                }

                Text(routine.name)
                    .font(.title2.bold())
                    .foregroundStyle(Theme.text)

                // Current exercise card
                VStack(spacing: 12) {
                    Text(current.exerciseName)
                        .font(.title3.bold())
                        .foregroundStyle(Theme.text)

                    Text("Target: \(current.targetSets) sets × \(current.targetReps) reps")
                        .foregroundStyle(Theme.hint)

                    Divider().background(Theme.border)

                    // Set inputs
                    ForEach(0..<currentSets.count, id: \.self) { idx in
                        HStack(spacing: 12) {
                            Text("Set \(idx + 1)")
                                .foregroundStyle(Theme.hint)
                                .frame(width: 50, alignment: .leading)

                            VStack(alignment: .leading, spacing: 2) {
                                Text("Reps").font(.caption2).foregroundStyle(Theme.hint)
                                TextField("Reps", value: $currentSets[idx].repsCompleted, format: .number)
                                    .keyboardType(.numberPad)
                                    .padding(8)
                                    .background(Theme.inputBg)
                                    .foregroundStyle(Theme.text)
                                    .clipShape(RoundedRectangle(cornerRadius: 6))
                                    .overlay(RoundedRectangle(cornerRadius: 6).stroke(Theme.border, lineWidth: 1))
                            }

                            VStack(alignment: .leading, spacing: 2) {
                                Text(vm.units).font(.caption2).foregroundStyle(Theme.hint)
                                TextField("Weight", value: $currentSets[idx].weightUsedKg, format: .number)
                                    .keyboardType(.decimalPad)
                                    .padding(8)
                                    .background(Theme.inputBg)
                                    .foregroundStyle(Theme.text)
                                    .clipShape(RoundedRectangle(cornerRadius: 6))
                                    .overlay(RoundedRectangle(cornerRadius: 6).stroke(Theme.border, lineWidth: 1))
                            }
                        }
                    }
                }
                .padding(16)
                .background(Theme.cardBg)
                .clipShape(RoundedRectangle(cornerRadius: 12))

                // Log & Next button
                Button {
                    logCurrentAndAdvance()
                } label: {
                    HStack {
                        Image(systemName: currentIndex + 1 < exerciseLogs.count ? "arrow.right" : "checkmark")
                        Text(currentIndex + 1 < exerciseLogs.count ? "Log & Next" : "Log & Finish")
                    }
                    .frame(maxWidth: .infinity)
                    .padding(16)
                    .background(Theme.success)
                    .foregroundStyle(.white)
                    .font(.headline)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                }

                // Upcoming exercises
                if currentIndex + 1 < exerciseLogs.count {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Up Next")
                            .font(.subheadline)
                            .foregroundStyle(Theme.hint)

                        ForEach(Array(exerciseLogs[(currentIndex + 1)...].enumerated()), id: \.offset) { _, ex in
                            HStack {
                                Text(ex.exerciseName)
                                    .foregroundStyle(Theme.text)
                                Spacer()
                                Text("\(ex.targetSets)×\(ex.targetReps)")
                                    .foregroundStyle(Theme.hint)
                            }
                            .padding(10)
                            .background(Theme.cardBg)
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                        }
                    }
                }
            }
            .padding()
        }
    }

    // MARK: - Finish View

    private var finishView: some View {
        VStack(spacing: 20) {
            Spacer()
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 60))
                .foregroundStyle(Theme.success)
            Text("All exercises logged!")
                .font(.title2.bold())
                .foregroundStyle(Theme.text)
            Button {
                Task { await finishWorkout() }
            } label: {
                Text("Finish Workout")
                    .frame(maxWidth: .infinity)
                    .padding(16)
                    .background(Theme.accent)
                    .foregroundStyle(.white)
                    .font(.headline)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            .padding(.horizontal)
            Spacer()
        }
    }

    // MARK: - Summary View

    private func summaryView(_ entry: WorkoutLogEntry) -> some View {
        ScrollView {
            VStack(spacing: 16) {
                Image(systemName: "trophy.fill")
                    .font(.system(size: 50))
                    .foregroundStyle(.yellow)

                Text("Workout Complete!")
                    .font(.title.bold())
                    .foregroundStyle(Theme.text)

                Text("\(entry.exercises.count) exercises · \(entry.totalSets) sets · \(Int(entry.totalVolume)) \(vm.units) volume")
                    .foregroundStyle(Theme.hint)

                ForEach(entry.exercises, id: \.exerciseId) { ex in
                    let exVol = ex.setsCompleted.reduce(0.0) { $0 + Double($1.repsCompleted) * $1.weightUsedKg }
                    HStack {
                        VStack(alignment: .leading) {
                            Text(ex.exerciseName)
                                .foregroundStyle(Theme.text)
                                .fontWeight(.medium)
                            Text("\(ex.setsCompleted.count) sets · \(Int(exVol)) \(vm.units)")
                                .font(.caption)
                                .foregroundStyle(Theme.hint)
                        }
                        Spacer()
                    }
                    .padding(12)
                    .background(Theme.cardBg)
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                }

                Button {
                    vm.showingWorkout = false
                    vm.activeWorkoutRoutine = nil
                } label: {
                    Text("Back to Dashboard")
                        .frame(maxWidth: .infinity)
                        .padding(14)
                        .background(Theme.accent)
                        .foregroundStyle(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                }
            }
            .padding()
        }
    }

    // MARK: - Logic

    private func setupExerciseLogs() {
        startedAt = Date()
        exerciseLogs = routine.exercises.map { ex in
            ExerciseLog(
                exerciseId: ex.exerciseId,
                exerciseName: ex.exerciseName ?? vm.exerciseName(for: ex.exerciseId),
                targetSets: ex.sets,
                targetReps: ex.reps,
                setsCompleted: []
            )
        }
        if !exerciseLogs.isEmpty {
            setupSetsForCurrent()
        }
    }

    private func setupSetsForCurrent() {
        guard currentIndex < exerciseLogs.count else { return }
        let ex = exerciseLogs[currentIndex]
        let routineEx = routine.exercises[currentIndex]
        currentSets = (1...ex.targetSets).map { num in
            SetLog(setNumber: num, repsCompleted: ex.targetReps, weightUsedKg: routineEx.weightKg)
        }
    }

    private func logCurrentAndAdvance() {
        guard currentIndex < exerciseLogs.count else { return }
        exerciseLogs[currentIndex].setsCompleted = currentSets
        currentIndex += 1
        if currentIndex < exerciseLogs.count {
            setupSetsForCurrent()
        }
    }

    private func finishWorkout() async {
        let entry = WorkoutLogEntry(
            id: UUID().uuidString.lowercased(),
            routineId: routine.id,
            routineName: routine.name,
            startedAt: ISO8601DateFormatter().string(from: startedAt),
            completedAt: ISO8601DateFormatter().string(from: Date()),
            exercises: exerciseLogs
        )
        await vm.saveWorkoutLog(entry)
        savedEntry = entry
        isFinished = true
    }
}
