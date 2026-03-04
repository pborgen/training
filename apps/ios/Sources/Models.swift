import Foundation

// MARK: - Legacy (backward compat)

struct WorkoutRow: Codable, Identifiable {
    var id = UUID()
    var Phase: String
    var Order: String
    var Exercise: String
    var Weight: String
    var Sets: String
    var Reps: String
    var Volume: String
    var Notes: String
    var Formula: String

    static let empty = WorkoutRow(Phase: "", Order: "", Exercise: "", Weight: "", Sets: "", Reps: "", Volume: "", Notes: "", Formula: "")
}

struct SyncPayload: Codable {
    let rows: [WorkoutRow]
}

// MARK: - Exercise Catalog

struct Exercise: Codable, Identifiable {
    let id: String
    let name: String
    let muscleGroup: String
    let category: String
    let defaultWeight: Double
    let defaultSets: Int
    let defaultReps: Int
}

// MARK: - User Exercise

struct UserExercise: Codable, Identifiable {
    var id: String
    var name: String
    var type: String
    var muscleGroup: String
    var defaultSets: Int
    var defaultReps: Int
    var defaultWeightKg: Double
    var createdAt: String?

    static let empty = UserExercise(
        id: UUID().uuidString.lowercased(),
        name: "", type: "strength", muscleGroup: "Quads",
        defaultSets: 3, defaultReps: 10, defaultWeightKg: 0
    )
}

// MARK: - User Profile

struct UserProfile: Codable {
    var fullName: String
    var age: Int
    var gender: String
    var heightCm: Double
    var weightKg: Double
    var activityLevel: String
    var units: String

    static let empty = UserProfile(
        fullName: "", age: 0, gender: "", heightCm: 0, weightKg: 0,
        activityLevel: "moderate", units: "lbs"
    )
}

// MARK: - Routine

struct RoutineExercise: Codable, Identifiable {
    var id: String { exerciseId }
    var exerciseId: String
    var exerciseName: String?
    var sets: Int
    var reps: Int
    var weightKg: Double

    enum CodingKeys: String, CodingKey {
        case exerciseId, exerciseName, sets, reps, weightKg
    }
}

struct Routine: Codable, Identifiable {
    var id: String
    var name: String
    var goal: String
    var daysPerWeek: Int
    var exercises: [RoutineExercise]
    var createdAt: String?
    var updatedAt: String?

    static let empty = Routine(
        id: UUID().uuidString.lowercased(),
        name: "", goal: "strength", daysPerWeek: 3, exercises: []
    )
}

// MARK: - Workout Log

struct SetLog: Codable {
    var setNumber: Int
    var repsCompleted: Int
    var weightUsedKg: Double
}

struct ExerciseLog: Codable, Identifiable {
    var id: String { exerciseId }
    var exerciseId: String
    var exerciseName: String
    var targetSets: Int
    var targetReps: Int
    var setsCompleted: [SetLog]

    enum CodingKeys: String, CodingKey {
        case exerciseId, exerciseName, targetSets, targetReps, setsCompleted
    }
}

struct WorkoutLogEntry: Codable, Identifiable {
    var id: String
    var routineId: String
    var routineName: String
    var startedAt: String
    var completedAt: String
    var exercises: [ExerciseLog]

    var totalVolume: Double {
        exercises.flatMap(\.setsCompleted).reduce(0) {
            $0 + Double($1.repsCompleted) * $1.weightUsedKg
        }
    }

    var totalSets: Int {
        exercises.flatMap(\.setsCompleted).count
    }
}

// MARK: - API Response Wrappers

struct ProfileResponse: Codable {
    let ok: Bool?
    let profile: UserProfile?
}

struct ExerciseResponse: Codable {
    let ok: Bool?
    let exercise: UserExercise?
}

struct RoutineResponse: Codable {
    let ok: Bool?
    let routine: Routine?
}

struct WorkoutLogResponse: Codable {
    let ok: Bool?
    let entry: WorkoutLogEntry?
}

struct OkResponse: Codable {
    let ok: Bool
}
