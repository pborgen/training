import Foundation

struct APIClient {
    func pull(baseURL: String, userEmail: String) async throws -> [WorkoutRow] {
        var req = URLRequest(url: URL(string: "\(baseURL)/api/sync")!)
        req.setValue(userEmail, forHTTPHeaderField: "x-user-email")
        let (data, _) = try await URLSession.shared.data(for: req)
        let decoded = try JSONDecoder().decode(SyncPayload.self, from: data)
        return decoded.rows
    }

    func push(baseURL: String, userEmail: String, rows: [WorkoutRow]) async throws {
        var req = URLRequest(url: URL(string: "\(baseURL)/api/sync")!)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue(userEmail, forHTTPHeaderField: "x-user-email")
        req.httpBody = try JSONEncoder().encode(SyncPayload(rows: rows))
        _ = try await URLSession.shared.data(for: req)
    }
}
