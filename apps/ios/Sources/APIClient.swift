import Foundation

struct APIClient {
    func pull(baseURL: String, userEmail: String, idToken: String) async throws -> [WorkoutRow] {
        var req = URLRequest(url: URL(string: "\(baseURL)/api/sync")!)
        req.setValue(userEmail, forHTTPHeaderField: "x-user-email")
        if !idToken.isEmpty { req.setValue("Bearer \(idToken)", forHTTPHeaderField: "Authorization") }
        let (data, _) = try await URLSession.shared.data(for: req)
        let decoded = try JSONDecoder().decode(SyncPayload.self, from: data)
        return decoded.rows
    }

    func push(baseURL: String, userEmail: String, idToken: String, rows: [WorkoutRow]) async throws {
        var req = URLRequest(url: URL(string: "\(baseURL)/api/sync")!)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue(userEmail, forHTTPHeaderField: "x-user-email")
        if !idToken.isEmpty { req.setValue("Bearer \(idToken)", forHTTPHeaderField: "Authorization") }
        req.httpBody = try JSONEncoder().encode(SyncPayload(rows: rows))
        _ = try await URLSession.shared.data(for: req)
    }
}
