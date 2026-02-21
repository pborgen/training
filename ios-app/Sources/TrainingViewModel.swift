import Foundation

@MainActor
final class TrainingViewModel: ObservableObject {
    @Published var baseURL: String = UserDefaults.standard.string(forKey: "training.baseURL") ?? "http://YOUR-HOST-IP:8080"
    @Published var userEmail: String = UserDefaults.standard.string(forKey: "training.userEmail") ?? "you@example.com"
    @Published var rows: [WorkoutRow] = []
    @Published var status: String = ""

    private let api = APIClient()

    func addRow() {
        rows.append(.empty)
    }

    func recalc(_ idx: Int) {
        guard rows.indices.contains(idx) else { return }
        let w = Double(rows[idx].Weight) ?? 0
        let s = Double(rows[idx].Sets) ?? 0
        let r = Double(rows[idx].Reps) ?? 0
        rows[idx].Volume = String(Int(w * s * r))
    }

    func persistSettings() {
        UserDefaults.standard.set(baseURL, forKey: "training.baseURL")
        UserDefaults.standard.set(userEmail, forKey: "training.userEmail")
    }

    func pull() async {
        do {
            persistSettings()
            status = "Pulling..."
            rows = try await api.pull(baseURL: baseURL, userEmail: userEmail)
            status = "Pulled \(rows.count) rows"
        } catch {
            status = "Pull error: \(error.localizedDescription)"
        }
    }

    func push() async {
        do {
            persistSettings()
            status = "Pushing..."
            try await api.push(baseURL: baseURL, userEmail: userEmail, rows: rows)
            status = "Push complete"
        } catch {
            status = "Push error: \(error.localizedDescription)"
        }
    }
}
