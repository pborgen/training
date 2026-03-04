import SwiftUI

enum Theme {
    static let background   = Color(hex: 0x0B1220)
    static let cardBg       = Color(hex: 0x111827)
    static let inputBg      = Color(hex: 0x0F172A)
    static let accent       = Color(hex: 0x1D4ED8)
    static let accentHover  = Color(hex: 0x2563EB)
    static let danger       = Color(hex: 0xDC2626)
    static let success      = Color(hex: 0x16A34A)
    static let secondaryBtn = Color(hex: 0x374151)
    static let text         = Color(hex: 0xE5E7EB)
    static let hint         = Color(hex: 0x94A3B8)
    static let border       = Color(hex: 0x334155)
}

extension Color {
    init(hex: UInt, opacity: Double = 1.0) {
        self.init(
            .sRGB,
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255,
            opacity: opacity
        )
    }
}
