import SwiftUI
import Charts

struct ChartsView: View {
    let rows: [WorkoutRow]

    var body: some View {
        let byExercise = Dictionary(grouping: rows, by: { $0.Exercise.isEmpty ? "Unknown" : $0.Exercise })
            .map { (key, value) in
                (exercise: key, volume: value.reduce(0) { $0 + (Double($1.Volume) ?? 0) })
            }
            .sorted { $0.volume > $1.volume }

        Chart(byExercise, id: \.exercise) {
            BarMark(
                x: .value("Exercise", $0.exercise),
                y: .value("Volume", $0.volume)
            )
        }
        .frame(height: 220)
    }
}
