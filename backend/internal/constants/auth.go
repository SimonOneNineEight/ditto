package constants

const (
	AuthProviderLocal    = "local"
	AuthProviderGithub   = "github"
	AuthProviderGoogle   = "google"
	AuthProviderLinkedin = "linkedin"
)

var ValidOAuthProviders = map[string]bool{
	AuthProviderGithub:   true,
	AuthProviderGoogle:   true,
	AuthProviderLinkedin: true,
	AuthProviderLocal:    true,
}

func IsValidOAuthProvider(provider string) bool {
	return ValidOAuthProviders[provider]
}
