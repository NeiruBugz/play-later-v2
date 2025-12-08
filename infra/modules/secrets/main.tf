locals {
  default_tags = {
    Environment = var.environment
    ManagedBy   = "terraform"
    Module      = "secrets"
  }

  tags = merge(local.default_tags, var.tags)

  secret_names_set = toset(var.secret_names)
}

resource "aws_secretsmanager_secret" "this" {
  for_each = local.secret_names_set

  name                    = "${var.name_prefix}/${var.environment}/${each.key}"
  recovery_window_in_days = var.recovery_window_in_days

  tags = local.tags
}

resource "aws_secretsmanager_secret_version" "this" {
  for_each = local.secret_names_set

  secret_id     = aws_secretsmanager_secret.this[each.key].id
  secret_string = var.secret_values[each.key]
}
