import Foundation
import UIKit
import GoogleSignIn

@MainActor
final class GoogleSignInManager {
    static let shared = GoogleSignInManager()

    func signIn(presentingViewController: UIViewController) async throws -> (idToken: String, email: String) {
        let result = try await GIDSignIn.sharedInstance.signIn(withPresenting: presentingViewController)
        guard let idToken = result.user.idToken?.tokenString else {
            throw NSError(domain: "GoogleSignIn", code: 1, userInfo: [NSLocalizedDescriptionKey: "Missing ID token"])
        }
        let email = result.user.profile?.email ?? "unknown"
        return (idToken, email)
    }
}
