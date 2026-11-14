data "aws_region" "current" {}

data "aws_kms_alias" "ssm" {
  name = "alias/aws/ssm"
}

locals {
  name_prefix          = "${var.project}-${var.environment}-storefront"
  ssm_parameter_prefix = "/${var.project}/${var.environment}/storefront-sync"

  visibility_timeout_multiplier = 6
  queue_retention_seconds       = 4 * 24 * 60 * 60
  dead_letter_retention_seconds = 14 * 24 * 60 * 60
  log_retention_days            = 7

  functions = {
    gather = {
      memory_size         = 512
      timeout_seconds     = 120
      maximum_concurrency = 5
      sends_to            = "enrich"
    }
    enrich = {
      memory_size         = 512
      timeout_seconds     = 60
      maximum_concurrency = 2
      sends_to            = null
    }
  }

  secret_parameter_names = toset([
    "POSTGRES_PRISMA_URL",
    "IGDB_CLIENT_ID",
    "IGDB_CLIENT_SECRET",
    "STEAM_API_KEY",
  ])
}

module "queue" {
  source  = "terraform-aws-modules/sqs/aws"
  version = "5.2.2"

  for_each = local.functions

  name                       = "${local.name_prefix}-${each.key}"
  visibility_timeout_seconds = each.value.timeout_seconds * local.visibility_timeout_multiplier
  message_retention_seconds  = local.queue_retention_seconds
  sqs_managed_sse_enabled    = true

  create_dlq                    = true
  dlq_name                      = "${local.name_prefix}-${each.key}-dlq"
  dlq_message_retention_seconds = local.dead_letter_retention_seconds
  dlq_sqs_managed_sse_enabled   = true
  redrive_policy = {
    maxReceiveCount = var.max_receive_count
  }

  tags = merge(var.required_tags, {
    Name = "${local.name_prefix}-${each.key}"
  })
  dlq_tags = merge(var.required_tags, {
    Name = "${local.name_prefix}-${each.key}-dlq"
  })
}
