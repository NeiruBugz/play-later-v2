output "vercel_oidc_provider_arn" {
  description = "Vercel OIDC provider ARN; prod/ looks it up by URL"
  value       = aws_iam_openid_connect_provider.vercel.arn
}

output "github_oidc_provider_arn" {
  description = "GitHub Actions OIDC provider ARN; prod/ looks it up by URL"
  value       = aws_iam_openid_connect_provider.github.arn
}
