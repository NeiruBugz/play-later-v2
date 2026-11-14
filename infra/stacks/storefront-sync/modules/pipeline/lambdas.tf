data "archive_file" "stub" {
  type        = "zip"
  source_file = "${path.module}/stub/index.mjs"
  output_path = "${path.module}/.build/stub.zip"
}

resource "aws_cloudwatch_log_group" "function" {
  for_each = local.functions

  name              = "/aws/lambda/${local.name_prefix}-${each.key}"
  retention_in_days = local.log_retention_days

  tags = merge(var.required_tags, {
    Name = "${local.name_prefix}-${each.key}"
  })
}

resource "aws_lambda_function" "function" {
  for_each = local.functions

  function_name = "${local.name_prefix}-${each.key}"
  role          = aws_iam_role.function[each.key].arn
  runtime       = "nodejs22.x"
  architectures = ["arm64"]
  handler       = "index.handler"
  memory_size   = each.value.memory_size
  timeout       = each.value.timeout_seconds

  filename         = data.archive_file.stub.output_path
  source_code_hash = data.archive_file.stub.output_base64sha256

  environment {
    variables = merge(
      {
        NODE_ENV               = "production"
        LOG_LEVEL              = "info"
        SSM_PARAM_PREFIX       = local.ssm_parameter_prefix
        DB_POOL_MAX            = "2"
        IGDB_MIN_INTERVAL_MS   = "750"
        SYNC_MAX_RECEIVE_COUNT = tostring(var.max_receive_count)
      },
      each.value.sends_to == null ? {} : {
        STEAM_SYNC_ENRICH_QUEUE_URL = module.queue[each.value.sends_to].queue_url
      },
    )
  }

  tags = merge(var.required_tags, {
    Name = "${local.name_prefix}-${each.key}"
  })

  depends_on = [
    aws_cloudwatch_log_group.function,
    aws_iam_role_policy.function,
  ]

  lifecycle {
    ignore_changes = [filename, source_code_hash]
  }
}

resource "aws_lambda_event_source_mapping" "function" {
  for_each = local.functions

  event_source_arn        = module.queue[each.key].queue_arn
  function_name           = aws_lambda_function.function[each.key].arn
  batch_size              = 1
  function_response_types = ["ReportBatchItemFailures"]

  scaling_config {
    maximum_concurrency = each.value.maximum_concurrency
  }

  tags = merge(var.required_tags, {
    Name = "${local.name_prefix}-${each.key}"
  })
}
