import Foundation

@MainActor
final class TrainingViewModel: ObservableObject {
    // MARK: - Auth
    @Published var baseURL: String = UserDefaults.standard.string(forKey: "training.baseURL") ?? "http://YOUR-HOST-IP:8080" {
        didSet { UserDefaults.standard.set(baseURL, forKey: "training.baseURL"); updateAPI() }
    }
    @Published var userEmail: String = UserDefaults.standard.string(forKey: "training.userEmail") ?? "" {
        didSet { UserDefaults.standard.set(userEmail, forKey: "training.userEmail"); updateAPI() }
    }
    @Published var idToken: String = "" { didSet { updateAPI() } }
    @Published var isAuthenticated = false

    // MARK: - Data
    @Published var profile = UserProfile.empty
    @Published var catalogExercises: [Exercise] = []
    @Published var userExercises: [UserExercise] = []
    @Published var routines: [Routine] = []
    @Published var workoutLog: [WorkoutLogEntry] = []
    @Published var status: String = ""

    // MARK: - Active Workout
    @Published var activeWorkoutRoutine: Routine?
    @Published var showingWorkout = false

    private var api = APIClient()

    init() { updateAPI() }

    private func updateAPI() {
        api.baseURL = baseURL
        api.userEmail = userEmail
        api.idToken = idToken
    }

    // MARK: - Auth

    func signIn(idToken: String, email: String) {
        self.idToken = idToken
        self.userEmail = email
        self.isAuthenticated = true
        status = "Signed in as \(email)"
    }

    func signOut() {
        idToken = ""
        isAuthenticated = false
        profile = .empty
        catalogExercises = []
        userExercises = []
        routines = []
        workoutLog = []
        status = "Signed out"
    }

    func checkSession() async {
        do {
            let sess = try await api.session()
            isAuthenticated = sess.authenticated
            if let email = sess.email, !email.isEmpty { userEmail = email }
        } catch {
            isAuthenticated = false
        }
    }

    // MARK: - Profile

    func loadProfile() async {
        do { profile = try await api.fetchProfile() }
        catch { /* no profile yet */ }
    }

    func saveProfile() async {
        do {
            profile = try await api.saveProfile(profile)
            status = "Profile saved"
        } catch {
            status = "Failed to save profile"
        }
    }

    var units: String { profile.units.isEmpty ? "lbs" : profile.units }

    // MARK: - Exercises

    func loadExercises() async {
        do {
            async let cat = api.fetchExercises()
            async let user = api.fetchUserExercises()
            catalogExercises = try await cat
            userExercises = try await user
        } catch {
            status = "Failed to load exercises"
        }
    }

    func createExercise(_ ex: UserExercise) async {
        do {
            let created = try await api.createUserExercise(ex)
            userExercises.append(created)
        } catch {
            status = "Failed to create exercise"
        }
    }

    func deleteExercise(_ id: String) async {
        do {
            try await api.deleteUserExercise(id)
            userExercises.removeAll { $0.id == id }
        } catch {
            status = "Failed to delete exercise"
        }
    }

    // MARK: - Routines

    func loadRoutines() async {
        do { routines = try await api.fetchRoutines() }
        catch { status = "Failed to load routines" }
    }

    func createRoutine(_ routine: Routine) async {
        do {
            let created = try await api.createRoutine(routine)
            routines.append(created)
        } catch {
            status = "Failed to create routine"
        }
    }

    func updateRoutine(_ routine: Routine) async {
        do {
            let updated = try await api.updateRoutine(routine)
            if let idx = routines.firstIndex(where: { $0.id == routine.id }) {
                routines[idx] = updated
            }
        } catch {
            status = "Failed to update routine"
        }
    }

    func deleteRoutine(_ id: String) async {
        do {
            try await api.deleteRoutine(id)
            routines.removeAll { $0.id == id }
        } catch {
            status = "Failed to delete routine"
        }
    }

    // MARK: - Workout Log

    func loadWorkoutLog(limit: Int = 5) async {
        do { workoutLog = try await api.fetchWorkoutLog(limit: limit) }
        catch { status = "Failed to load workout history" }
    }

    func saveWorkoutLog(_ entry: WorkoutLogEntry) async {
        do {
            let saved = try await api.saveWorkoutLog(entry)
            workoutLog.insert(saved, at: 0)
            status = "Workout saved!"
        } catch {
            status = "Failed to save workout"
        }
    }

    // MARK: - Start Workout

    func startWorkout(routine: Routine) {
        activeWorkoutRoutine = routine
        showingWorkout = true
    }

    // MARK: - Helpers

    func exerciseName(for id: String) -> String {
        if let ex = catalogExercises.first(where: { $0.id == id }) { return ex.name }
        if let ex = userExercises.first(where: { $0.id == id }) { return ex.name }
        return id
    }

    var allExercises: [(id: String, name: String, sets: Int, reps: Int, weight: Double)] {
        let cat = catalogExercises.map { ($0.id, $0.name, $0.defaultSets, $0.defaultReps, $0.defaultWeight) }
        let user = userExercises.map { ($0.id, $0.name, $0.defaultSets, $0.defaultReps, $0.defaultWeightKg) }
        return cat + user
    }
}
