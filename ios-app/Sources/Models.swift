import Foundation

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
