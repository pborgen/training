import Foundation

struct SessionResponse: Codable {
    let ok: Bool?
    let authenticated: Bool
    let email: String?
}

struct APIClient {
    var baseURL: String = ""
    var userEmail: String = ""
    var idToken: String = ""

    // MARK: - Base request helper

    private func request<T: Decodable>(_ method: String, path: String, body: (any Encodable)? = nil) async throws -> T {
        guard let url = URL(string: "\(baseURL)\(path)") else { throw URLError(.badURL) }
        var req = URLRequest(url: url)
        req.httpMethod = method
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if !userEmail.isEmpty { req.setValue(userEmail, forHTTPHeaderField: "x-user-email") }
        if !idToken.isEmpty { req.setValue("Bearer \(idToken)", forHTTPHeaderField: "Authorization") }
        if let body {
            req.httpBody = try JSONEncoder().encode(AnyEncodable(body))
        }
        let (data, response) = try await URLSession.shared.data(for: req)
        if let http = response as? HTTPURLResponse, http.statusCode == 401 {
            throw APIError.unauthorized
        }
        return try JSONDecoder().decode(T.self, from: data)
    }

    private func requestVoid(_ method: String, path: String, body: (any Encodable)? = nil) async throws {
        guard let url = URL(string: "\(baseURL)\(path)") else { throw URLError(.badURL) }
        var req = URLRequest(url: url)
        req.httpMethod = method
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if !userEmail.isEmpty { req.setValue(userEmail, forHTTPHeaderField: "x-user-email") }
        if !idToken.isEmpty { req.setValue("Bearer \(idToken)", forHTTPHeaderField: "Authorization") }
        if let body {
            req.httpBody = try JSONEncoder().encode(AnyEncodable(body))
        }
        let (_, response) = try await URLSession.shared.data(for: req)
        if let http = response as? HTTPURLResponse, http.statusCode == 401 {
            throw APIError.unauthorized
        }
    }

    // MARK: - Session

    func session() async throws -> SessionResponse {
        try await request("GET", path: "/api/session")
    }

    // MARK: - Profile

    func fetchProfile() async throws -> UserProfile {
        try await request("GET", path: "/api/profile")
    }

    func saveProfile(_ profile: UserProfile) async throws -> UserProfile {
        let resp: ProfileResponse = try await request("PUT", path: "/api/profile", body: profile)
        return resp.profile ?? profile
    }

    // MARK: - Exercise Catalog

    func fetchExercises() async throws -> [Exercise] {
        try await request("GET", path: "/api/exercises")
    }

    // MARK: - User Exercises

    func fetchUserExercises() async throws -> [UserExercise] {
        try await request("GET", path: "/api/user-exercises")
    }

    func createUserExercise(_ ex: UserExercise) async throws -> UserExercise {
        let resp: ExerciseResponse = try await request("POST", path: "/api/user-exercises", body: ex)
        return resp.exercise ?? ex
    }

    func updateUserExercise(_ ex: UserExercise) async throws -> UserExercise {
        let resp: ExerciseResponse = try await request("PUT", path: "/api/user-exercises/\(ex.id)", body: ex)
        return resp.exercise ?? ex
    }

    func deleteUserExercise(_ id: String) async throws {
        try await requestVoid("DELETE", path: "/api/user-exercises/\(id)")
    }

    // MARK: - Routines

    func fetchRoutines() async throws -> [Routine] {
        try await request("GET", path: "/api/routines")
    }

    func fetchRoutine(_ id: String) async throws -> Routine {
        try await request("GET", path: "/api/routines/\(id)")
    }

    func createRoutine(_ routine: Routine) async throws -> Routine {
        let resp: RoutineResponse = try await request("POST", path: "/api/routines", body: routine)
        return resp.routine ?? routine
    }

    func updateRoutine(_ routine: Routine) async throws -> Routine {
        let resp: RoutineResponse = try await request("PUT", path: "/api/routines/\(routine.id)", body: routine)
        return resp.routine ?? routine
    }

    func deleteRoutine(_ id: String) async throws {
        try await requestVoid("DELETE", path: "/api/routines/\(id)")
    }

    // MARK: - Workout Log

    func fetchWorkoutLog(limit: Int = 0) async throws -> [WorkoutLogEntry] {
        let path = limit > 0 ? "/api/workout-log?limit=\(limit)" : "/api/workout-log"
        return try await request("GET", path: path)
    }

    func saveWorkoutLog(_ entry: WorkoutLogEntry) async throws -> WorkoutLogEntry {
        let resp: WorkoutLogResponse = try await request("POST", path: "/api/workout-log", body: entry)
        return resp.entry ?? entry
    }

    // MARK: - Legacy Sync

    func pull() async throws -> [WorkoutRow] {
        let payload: SyncPayload = try await request("GET", path: "/api/sync")
        return payload.rows
    }

    func push(rows: [WorkoutRow]) async throws {
        try await requestVoid("POST", path: "/api/sync", body: SyncPayload(rows: rows))
    }
}

// MARK: - Helpers

enum APIError: LocalizedError {
    case unauthorized
    var errorDescription: String? {
        switch self { case .unauthorized: return "Session expired. Please sign in again." }
    }
}

private struct AnyEncodable: Encodable {
    let value: any Encodable
    init(_ value: any Encodable) { self.value = value }
    func encode(to encoder: Encoder) throws { try value.encode(to: encoder) }
}
