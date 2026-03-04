import SwiftUI

struct DashboardView: View {
    @EnvironmentObject var vm: TrainingViewModel

    var body: some View {
        NavigationStack {
            ZStack {
                Theme.background.ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 20) {
                        // Quick Actions
                        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                            if let first = vm.routines.first {
                                quickAction("Start Workout", icon: "play.fill", color: Theme.success) {
                                    vm.startWorkout(routine: first)
                                }
                            } else {
                                quickAction("Start Workout", icon: "play.fill", color: Theme.secondaryBtn) { }
                            }
                            quickAction("New Routine", icon: "plus.circle.fill", color: Theme.accent) { }
                            quickAction("Add Exercise", icon: "figure.run", color: Theme.accent) { }
                            quickAction("My Profile", icon: "person.fill", color: Theme.accent) { }
                        }

                        // Saved Routines
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Saved Routines")
                                .font(.headline)
                                .foregroundStyle(Theme.text)

                            if vm.routines.isEmpty {
                                Text("No routines yet")
                                    .foregroundStyle(Theme.hint)
                                    .padding(.vertical, 4)
                            }

                            ForEach(vm.routines) { routine in
                                Button {
                                    vm.startWorkout(routine: routine)
                                } label: {
                                    HStack {
                                        VStack(alignment: .leading, spacing: 2) {
                                            Text(routine.name)
                                                .foregroundStyle(Theme.text)
                                                .fontWeight(.medium)
                                            Text("\(routine.exercises.count) exercises · \(routine.daysPerWeek) days/wk")
                                                .font(.caption)
                                                .foregroundStyle(Theme.hint)
                                        }
                                        Spacer()
                                        Image(systemName: "play.circle.fill")
                                            .foregroundStyle(Theme.success)
                                            .font(.title3)
                                    }
                                    .padding(12)
                                    .background(Theme.cardBg)
                                    .clipShape(RoundedRectangle(cornerRadius: 10))
                                }
                            }
                        }

                        // Recent Workouts
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Recent Workouts")
                                .font(.headline)
                                .foregroundStyle(Theme.text)

                            if vm.workoutLog.isEmpty {
                                Text("No workout history yet")
                                    .foregroundStyle(Theme.hint)
                                    .padding(.vertical, 4)
                            }

                            ForEach(vm.workoutLog) { entry in
                                VStack(alignment: .leading, spacing: 4) {
                                    HStack {
                                        Text(entry.routineName)
                                            .foregroundStyle(Theme.text)
                                            .fontWeight(.medium)
                                        Spacer()
                                        Text(formatDate(entry.completedAt))
                                            .font(.caption)
                                            .foregroundStyle(Theme.hint)
                                    }
                                    Text("\(entry.exercises.count) exercises · \(entry.totalSets) sets · \(Int(entry.totalVolume)) \(vm.units) volume")
                                        .font(.caption)
                                        .foregroundStyle(Theme.hint)
                                }
                                .padding(12)
                                .background(Theme.cardBg)
                                .clipShape(RoundedRectangle(cornerRadius: 10))
                            }
                        }
                    }
                    .padding()
                }
            }
            .navigationTitle("Dashboard")
            .toolbarColorScheme(.dark, for: .navigationBar)
            .task {
                await vm.loadProfile()
                await vm.loadRoutines()
                await vm.loadWorkoutLog()
            }
        }
    }

    private func quickAction(_ title: String, icon: String, color: Color, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.title2)
                Text(title)
                    .font(.caption)
                    .fontWeight(.medium)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 20)
            .background(color.opacity(0.15))
            .foregroundStyle(color == Theme.secondaryBtn ? Theme.hint : color)
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .overlay(RoundedRectangle(cornerRadius: 12).stroke(color.opacity(0.3), lineWidth: 1))
        }
    }

    private func formatDate(_ iso: String) -> String {
        let formatter = ISO8601DateFormatter()
        guard let date = formatter.date(from: iso) else { return iso }
        let display = DateFormatter()
        display.dateStyle = .medium
        return display.string(from: date)
    }
}
