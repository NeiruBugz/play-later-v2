output "gather_queue_url" {
  description = "Gather queue URL; set as STEAM_SYNC_GATHER_QUEUE_URL on Vercel"
  value       = module.queue["gather"].queue_url
}

output "gather_queue_arn" {
  description = "Gather queue ARN; the only resource the Vercel role may send to"
  value       = module.queue["gather"].queue_arn
}

output "enrich_queue_url" {
  description = "Enrich queue URL; already injected into the gather Lambda as STEAM_SYNC_ENRICH_QUEUE_URL"
  value       = module.queue["enrich"].queue_url
}

output "enrich_queue_arn" {
  description = "Enrich queue ARN"
  value       = module.queue["enrich"].queue_arn
}

output "dead_letter_queue_urls" {
  description = "DLQ URLs by pipeline stage, for inspecting poison messages"
  value       = { for stage, queue in module.queue : stage => queue.dead_letter_queue_url }
}

output "function_names" {
  description = "Lambda function names by pipeline stage; set as GitHub repo variables for update-function-code"
  value       = { for stage, function in aws_lambda_function.function : stage => function.function_name }
}

output "function_arns" {
  description = "Lambda function ARNs by pipeline stage; the only resources the GitHub deploy role may update"
  value       = { for stage, function in aws_lambda_function.function : stage => function.arn }
}

output "ssm_parameter_prefix" {
  description = "SSM path prefix the Lambdas read; passed to them as SSM_PARAM_PREFIX (parameter name = prefix + / + env var name)"
  value       = local.ssm_parameter_prefix
}

output "ssm_parameter_names" {
  description = "Full SSM parameter names to fill with aws ssm put-parameter --type SecureString --overwrite"
  value       = [for parameter in aws_ssm_parameter.secret : parameter.name]
}
