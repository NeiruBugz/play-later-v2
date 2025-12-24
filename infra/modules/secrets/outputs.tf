output "secret_arns" {
  description = "Map of secret names to their ARNs"
  value       = { for k, v in aws_secretsmanager_secret.this : k => v.arn }
}

output "secret_names" {
  description = "Map of secret keys to their full names in Secrets Manager"
  value       = { for k, v in aws_secretsmanager_secret.this : k => v.name }
}

output "secret_ids" {
  description = "Map of secret keys to their IDs"
  value       = { for k, v in aws_secretsmanager_secret.this : k => v.id }
}
