import SwiftUI

struct ContentView: View {
    @EnvironmentObject var vm: TrainingViewModel

    var body: some View {
        if vm.isAuthenticated {
            MainTabView()
        } else {
            LoginView()
        }
    }
}

struct LoginView: View {
    @EnvironmentObject var vm: TrainingViewModel

    var body: some View {
        ZStack {
            Theme.background.ignoresSafeArea()

            VStack(spacing: 24) {
                Spacer()

                Image(systemName: "dumbbell.fill")
                    .font(.system(size: 60))
                    .foregroundStyle(Theme.accent)

                Text("Training")
                    .font(.largeTitle.bold())
                    .foregroundStyle(Theme.text)

                Text("Sign in to sync your workouts")
                    .font(.subheadline)
                    .foregroundStyle(Theme.hint)

                VStack(spacing: 12) {
                    TextField("Backend URL", text: $vm.baseURL)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .padding(12)
                        .background(Theme.inputBg)
                        .foregroundStyle(Theme.text)
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(Theme.border, lineWidth: 1))

                    TextField("Email", text: $vm.userEmail)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .keyboardType(.emailAddress)
                        .padding(12)
                        .background(Theme.inputBg)
                        .foregroundStyle(Theme.text)
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(Theme.border, lineWidth: 1))
                }
                .padding(.horizontal)

                Button {
                    Task { await googleSignIn() }
                } label: {
                    HStack {
                        Image(systemName: "person.badge.key.fill")
                        Text("Sign in with Google")
                    }
                    .frame(maxWidth: .infinity)
                    .padding(14)
                    .background(Theme.accent)
                    .foregroundStyle(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                }
                .padding(.horizontal)

                Button {
                    Task { await devSignIn() }
                } label: {
                    Text("Dev Sign-In (no Google)")
                        .font(.footnote)
                        .foregroundStyle(Theme.hint)
                }

                if !vm.status.isEmpty {
                    Text(vm.status)
                        .font(.footnote)
                        .foregroundStyle(Theme.hint)
                        .padding(.horizontal)
                }

                Spacer()
            }
        }
    }

    private func googleSignIn() async {
        guard let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let root = scene.windows.first?.rootViewController else {
            vm.status = "No root view controller"
            return
        }
        do {
            let result = try await GoogleSignInManager.shared.signIn(presentingViewController: root)
            vm.signIn(idToken: result.idToken, email: result.email)
        } catch {
            vm.status = "Sign-in error: \(error.localizedDescription)"
        }
    }

    private func devSignIn() async {
        guard !vm.userEmail.isEmpty else {
            vm.status = "Enter an email first"
            return
        }
        vm.signIn(idToken: "", email: vm.userEmail)
    }
}
