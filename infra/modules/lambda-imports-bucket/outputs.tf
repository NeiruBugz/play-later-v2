output "bucket_name" {
  description = "The name of the S3 bucket"
  value       = aws_s3_bucket.this.id
}

output "bucket_arn" {
  description = "The ARN of the S3 bucket"
  value       = aws_s3_bucket.this.arn
}

output "bucket_domain_name" {
  description = "The bucket domain name"
  value       = aws_s3_bucket.this.bucket_domain_name
}

output "lambda_access_policy_arn" {
  description = "The ARN of the IAM policy for Lambda access"
  value       = aws_iam_policy.lambda_access.arn
}

output "lambda_access_policy_name" {
  description = "The name of the IAM policy for Lambda access"
  value       = aws_iam_policy.lambda_access.name
}
