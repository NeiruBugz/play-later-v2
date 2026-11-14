data "aws_iam_openid_connect_provider" "vercel" {
  url = "https://${local.vercel_oidc_host}"
}

data "aws_iam_openid_connect_provider" "github" {
  url = "https://${local.github_oidc_host}"
}

data "aws_iam_policy_document" "vercel_sqs_send_trust" {
  statement {
    sid     = "VercelProductionOidc"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [data.aws_iam_openid_connect_provider.vercel.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "${local.vercel_oidc_host}:aud"
      values   = ["https://vercel.com/${var.vercel_team_slug}"]
    }

    condition {
      test     = "StringEquals"
      variable = "${local.vercel_oidc_host}:sub"
      values   = ["owner:${var.vercel_team_slug}:project:${var.vercel_project_name}:environment:production"]
    }
  }
}

data "aws_iam_policy_document" "vercel_sqs_send" {
  statement {
    sid       = "SendToGatherQueue"
    actions   = ["sqs:SendMessage"]
    resources = [module.pipeline.gather_queue_arn]
  }
}

resource "aws_iam_role" "vercel_sqs_send" {
  name               = "${local.project}-${local.environment}-vercel-sqs-send"
  assume_role_policy = data.aws_iam_policy_document.vercel_sqs_send_trust.json

  tags = merge(local.required_tags, {
    Name = "${local.project}-${local.environment}-vercel-sqs-send"
  })
}

resource "aws_iam_role_policy" "vercel_sqs_send" {
  name   = "send-to-gather-queue"
  role   = aws_iam_role.vercel_sqs_send.id
  policy = data.aws_iam_policy_document.vercel_sqs_send.json
}

data "aws_iam_policy_document" "github_lambda_deploy_trust" {
  statement {
    sid     = "GithubProductionEnvironmentOidc"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [data.aws_iam_openid_connect_provider.github.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "${local.github_oidc_host}:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "${local.github_oidc_host}:sub"
      values   = ["repo:${var.github_repository}:environment:production"]
    }
  }
}

data "aws_iam_policy_document" "github_lambda_deploy" {
  statement {
    sid = "UpdatePipelineFunctionCode"
    actions = [
      "lambda:UpdateFunctionCode",
      "lambda:GetFunction",
      "lambda:GetFunctionConfiguration",
    ]
    resources = values(module.pipeline.function_arns)
  }
}

resource "aws_iam_role" "github_lambda_deploy" {
  name               = "${local.project}-${local.environment}-github-lambda-deploy"
  assume_role_policy = data.aws_iam_policy_document.github_lambda_deploy_trust.json

  tags = merge(local.required_tags, {
    Name = "${local.project}-${local.environment}-github-lambda-deploy"
  })
}

resource "aws_iam_role_policy" "github_lambda_deploy" {
  name   = "update-pipeline-function-code"
  role   = aws_iam_role.github_lambda_deploy.id
  policy = data.aws_iam_policy_document.github_lambda_deploy.json
}
