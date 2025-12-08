data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

locals {
  # Default to a globally-unique pattern by including AWS account ID and region.
  default_bucket_name = lower(replace(
    format("%s-%s-%s-%s", var.name_prefix, var.environment, data.aws_caller_identity.current.account_id, data.aws_region.current.name),
    "_",
    "-"
  ))
  resolved_bucket_name = var.bucket_name != "" ? var.bucket_name : local.default_bucket_name
}

resource "aws_s3_bucket" "this" {
  bucket = local.resolved_bucket_name
}

resource "aws_s3_bucket_versioning" "this" {
  bucket = aws_s3_bucket.this.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "this" {
  bucket                  = aws_s3_bucket.this.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_cors_configuration" "this" {
  bucket = aws_s3_bucket.this.id

  cors_rule {
    allowed_methods = ["GET", "PUT", "POST", "DELETE", "HEAD"]
    allowed_origins = length(var.cors_allowed_origins) > 0 ? var.cors_allowed_origins : ["*"]
    allowed_headers = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

data "aws_iam_policy_document" "s3_rw" {
  statement {
    sid = "AllowS3ObjectRW"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject"
    ]
    resources = [
      "${aws_s3_bucket.this.arn}/*"
    ]
  }

  statement {
    sid       = "AllowListBucket"
    actions   = ["s3:ListBucket"]
    resources = [aws_s3_bucket.this.arn]
  }
}

resource "aws_iam_policy" "s3_access" {
  name        = "${var.name_prefix}-${var.environment}-s3-access"
  description = "RW access to S3 bucket ${local.resolved_bucket_name} for app runtime"
  policy      = data.aws_iam_policy_document.s3_rw.json
}

# Optionally attach the policy to an existing ECS task role by name
resource "aws_iam_role_policy_attachment" "ecs_task_attach" {
  count      = var.ecs_task_role_name != "" ? 1 : 0
  role       = var.ecs_task_role_name
  policy_arn = aws_iam_policy.s3_access.arn
}
