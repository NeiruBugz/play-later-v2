data "aws_iam_policy_document" "lambda_trust" {
  statement {
    sid     = "LambdaAssumeRole"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

data "aws_iam_policy_document" "function" {
  for_each = local.functions

  statement {
    sid       = "ConsumeOwnQueue"
    actions   = ["sqs:ReceiveMessage", "sqs:DeleteMessage", "sqs:GetQueueAttributes"]
    resources = [module.queue[each.key].queue_arn]
  }

  dynamic "statement" {
    for_each = each.value.sends_to == null ? [] : [each.value.sends_to]

    content {
      sid       = "SendToDownstreamQueue"
      actions   = ["sqs:SendMessage"]
      resources = [module.queue[statement.value].queue_arn]
    }
  }

  statement {
    sid       = "WriteOwnLogs"
    actions   = ["logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["${aws_cloudwatch_log_group.function[each.key].arn}:*"]
  }

  statement {
    sid       = "ReadSecretParameters"
    actions   = ["ssm:GetParameters"]
    resources = [for parameter in aws_ssm_parameter.secret : parameter.arn]
  }

  statement {
    sid       = "DecryptSecretParametersViaSsm"
    actions   = ["kms:Decrypt"]
    resources = [data.aws_kms_alias.ssm.target_key_arn]

    condition {
      test     = "StringEquals"
      variable = "kms:ViaService"
      values   = ["ssm.${data.aws_region.current.region}.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "function" {
  for_each = local.functions

  name               = "${local.name_prefix}-${each.key}"
  assume_role_policy = data.aws_iam_policy_document.lambda_trust.json

  tags = merge(var.required_tags, {
    Name = "${local.name_prefix}-${each.key}"
  })
}

resource "aws_iam_role_policy" "function" {
  for_each = local.functions

  name   = "${local.name_prefix}-${each.key}"
  role   = aws_iam_role.function[each.key].id
  policy = data.aws_iam_policy_document.function[each.key].json
}
