import SwiftUI

struct MainTabView: View {
    @EnvironmentObject var vm: TrainingViewModel

    var body: some View {
        TabView {
            DashboardView()
                .tabItem { Label("Dashboard", systemImage: "house.fill") }
            RoutinesView()
                .tabItem { Label("Routines", systemImage: "dumbbell.fill") }
            ExercisesView()
                .tabItem { Label("Exercises", systemImage: "figure.run") }
            ProfileView()
                .tabItem { Label("Profile", systemImage: "person.fill") }
        }
        .tint(Theme.accent)
        .fullScreenCover(isPresented: $vm.showingWorkout) {
            if let routine = vm.activeWorkoutRoutine {
                WorkoutView(routine: routine)
                    .environmentObject(vm)
            }
        }
    }
}
