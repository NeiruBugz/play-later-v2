output "user_pool_id" {
  description = "Cognito User Pool ID"
  value       = aws_cognito_user_pool.this.id
}

output "user_pool_client_id" {
  description = "Cognito App Client ID"
  value       = aws_cognito_user_pool_client.web.id
}

output "user_pool_client_secret" {
  description = "Cognito App Client Secret"
  value       = aws_cognito_user_pool_client.web.client_secret
  sensitive   = true
}

output "domain" {
  description = "Cognito Hosted UI domain prefix"
  value       = aws_cognito_user_pool_domain.this.domain
}

output "issuer" {
  description = "OIDC issuer URL for this user pool"
  value       = "https://cognito-idp.${var.region}.amazonaws.com/${aws_cognito_user_pool.this.id}"
}

