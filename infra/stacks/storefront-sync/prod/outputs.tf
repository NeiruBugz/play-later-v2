output "gather_queue_url" {
  description = "Vercel env STEAM_SYNC_GATHER_QUEUE_URL"
  value       = module.pipeline.gather_queue_url
}

output "enrich_queue_url" {
  description = "Enrich queue URL (already injected into the gather Lambda as STEAM_SYNC_ENRICH_QUEUE_URL)"
  value       = module.pipeline.enrich_queue_url
}

output "vercel_sqs_role_arn" {
  description = "Vercel env AWS_SYNC_ROLE_ARN"
  value       = aws_iam_role.vercel_sqs_send.arn
}

output "github_lambda_deploy_role_arn" {
  description = "GitHub repo variable for the deploy-lambdas job (role to assume via OIDC)"
  value       = aws_iam_role.github_lambda_deploy.arn
}

output "gather_function_name" {
  description = "GitHub repo variable: gather Lambda function name"
  value       = module.pipeline.function_names["gather"]
}

output "enrich_function_name" {
  description = "GitHub repo variable: enrich Lambda function name"
  value       = module.pipeline.function_names["enrich"]
}

output "aws_region" {
  description = "Region for Vercel AWS_REGION and the GitHub region variable"
  value       = var.aws_region
}

output "ssm_parameter_prefix" {
  description = "SSM path prefix holding the Lambda secrets"
  value       = module.pipeline.ssm_parameter_prefix
}

output "ssm_parameter_names" {
  description = "Parameters to fill with aws ssm put-parameter --type SecureString --overwrite"
  value       = module.pipeline.ssm_parameter_names
}

output "dead_letter_queue_urls" {
  description = "DLQ URLs by pipeline stage"
  value       = module.pipeline.dead_letter_queue_urls
}
