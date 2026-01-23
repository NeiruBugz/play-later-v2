output "function_name" {
  description = "The name of the Lambda function"
  value       = aws_lambda_function.this.function_name
}

output "function_arn" {
  description = "The ARN of the Lambda function"
  value       = aws_lambda_function.this.arn
}

output "invoke_arn" {
  description = "The ARN to be used for invoking the Lambda function from API Gateway"
  value       = aws_lambda_function.this.invoke_arn
}

output "qualified_arn" {
  description = "The qualified ARN of the Lambda function (includes version)"
  value       = aws_lambda_function.this.qualified_arn
}

output "role_arn" {
  description = "The ARN of the Lambda execution role"
  value       = aws_iam_role.this.arn
}

output "role_name" {
  description = "The name of the Lambda execution role"
  value       = aws_iam_role.this.name
}

output "log_group_name" {
  description = "The name of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.this.name
}

output "log_group_arn" {
  description = "The ARN of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.this.arn
}

output "event_source_mapping_uuid" {
  description = "UUID of the SQS event source mapping (if configured)"
  value       = try(aws_lambda_event_source_mapping.sqs[0].uuid, null)
}

output "event_source_mapping_state" {
  description = "State of the SQS event source mapping (if configured)"
  value       = try(aws_lambda_event_source_mapping.sqs[0].state, null)
}
