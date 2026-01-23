data "aws_region" "current" {}

locals {
  has_s3_access        = length(var.s3_bucket_arns) > 0
  has_secrets_access   = length(var.secrets_arns) > 0
  has_vpc_config       = var.vpc_config != null
  has_sqs_event_source = var.sqs_event_source != null

  default_tags = {
    ManagedBy = "terraform"
    Module    = "lambda-container"
  }

  tags = merge(local.default_tags, var.tags)
}

resource "aws_iam_role" "this" {
  name = "${var.function_name}-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = local.tags
}

resource "aws_iam_role_policy_attachment" "basic_execution" {
  role       = aws_iam_role.this.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "vpc_execution" {
  count = local.has_vpc_config ? 1 : 0

  role       = aws_iam_role.this.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_iam_role_policy" "s3_access" {
  count = local.has_s3_access ? 1 : 0

  name = "${var.function_name}-s3-access"
  role = aws_iam_role.this.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ListBuckets"
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = var.s3_bucket_arns
      },
      {
        Sid    = "ReadWriteObjects"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = [for arn in var.s3_bucket_arns : "${arn}/*"]
      }
    ]
  })
}

resource "aws_iam_role_policy" "secrets_access" {
  count = local.has_secrets_access ? 1 : 0

  name = "${var.function_name}-secrets-access"
  role = aws_iam_role.this.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "GetSecrets"
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = var.secrets_arns
      }
    ]
  })
}

resource "aws_iam_role_policy" "sqs_access" {
  count = local.has_sqs_event_source ? 1 : 0

  name = "${var.function_name}-sqs-access"
  role = aws_iam_role.this.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "SQSEventSourceAccess"
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = var.sqs_event_source.queue_arn
      }
    ]
  })
}

resource "aws_cloudwatch_log_group" "this" {
  name              = "/aws/lambda/${var.function_name}"
  retention_in_days = var.log_retention_days

  tags = local.tags
}

resource "aws_lambda_function" "this" {
  function_name = var.function_name
  description   = var.description
  role          = aws_iam_role.this.arn

  package_type  = "Image"
  image_uri     = var.image_uri
  architectures = var.architectures

  memory_size = var.memory_size
  timeout     = var.timeout

  reserved_concurrent_executions = var.reserved_concurrent_executions

  dynamic "environment" {
    for_each = length(var.environment_variables) > 0 ? [1] : []
    content {
      variables = var.environment_variables
    }
  }

  dynamic "vpc_config" {
    for_each = local.has_vpc_config ? [var.vpc_config] : []
    content {
      subnet_ids         = vpc_config.value.subnet_ids
      security_group_ids = vpc_config.value.security_group_ids
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.this,
    aws_iam_role_policy_attachment.basic_execution,
    aws_iam_role_policy_attachment.vpc_execution,
    aws_iam_role_policy.s3_access,
    aws_iam_role_policy.secrets_access,
    aws_iam_role_policy.sqs_access
  ]

  tags = local.tags
}

resource "aws_lambda_event_source_mapping" "sqs" {
  count = local.has_sqs_event_source ? 1 : 0

  event_source_arn = var.sqs_event_source.queue_arn
  function_name    = aws_lambda_function.this.arn
  enabled          = var.sqs_event_source.enabled

  batch_size                         = var.sqs_event_source.batch_size
  maximum_batching_window_in_seconds = var.sqs_event_source.maximum_batching_window
  function_response_types            = var.sqs_event_source.function_response_types

  dynamic "scaling_config" {
    for_each = var.sqs_event_source.scaling_config != null ? [var.sqs_event_source.scaling_config] : []
    content {
      maximum_concurrency = scaling_config.value.maximum_concurrency
    }
  }

  depends_on = [
    aws_iam_role_policy.sqs_access
  ]
}
