output "bucket_name" {
  value       = aws_s3_bucket.this.bucket
  description = "S3 bucket name"
}

output "bucket_arn" {
  value       = aws_s3_bucket.this.arn
  description = "S3 bucket ARN"
}

output "s3_access_policy_arn" {
  value       = aws_iam_policy.s3_access.arn
  description = "IAM policy ARN granting RW access to the bucket"
}

