data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

locals {
  account_id  = data.aws_caller_identity.current.account_id
  region      = data.aws_region.current.name
  bucket_name = "${var.name_prefix}-${var.environment}-imports-${local.account_id}-${local.region}"

  default_tags = {
    Environment = var.environment
    ManagedBy   = "terraform"
    Module      = "lambda-imports-bucket"
  }

  tags = merge(local.default_tags, var.tags)
}

resource "aws_s3_bucket" "this" {
  bucket = local.bucket_name

  tags = local.tags
}

resource "aws_s3_bucket_versioning" "this" {
  bucket = aws_s3_bucket.this.id

  versioning_configuration {
    status = var.enable_versioning ? "Enabled" : "Disabled"
  }
}

resource "aws_s3_bucket_public_access_block" "this" {
  bucket = aws_s3_bucket.this.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "this" {
  bucket = aws_s3_bucket.this.id

  rule {
    id     = "expire-old-imports"
    status = "Enabled"

    filter {
      prefix = "imports/"
    }

    expiration {
      days = var.lifecycle_expiration_days
    }

    noncurrent_version_expiration {
      noncurrent_days = 7
    }
  }
}

resource "aws_iam_policy" "lambda_access" {
  name        = "${var.name_prefix}-${var.environment}-imports-bucket-access"
  description = "Policy for Lambda functions to access the imports bucket"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ListBucket"
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.this.arn
      },
      {
        Sid    = "ReadWriteObjects"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = "${aws_s3_bucket.this.arn}/*"
      }
    ]
  })

  tags = local.tags
}
