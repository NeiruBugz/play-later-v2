resource "aws_ssm_parameter" "secret" {
  for_each = local.secret_parameter_names

  name        = "${local.ssm_parameter_prefix}/${each.key}"
  description = "Storefront sync Lambda secret ${each.key}; real value is set out of band with aws ssm put-parameter"
  type        = "SecureString"
  value       = "placeholder-set-with-aws-ssm-put-parameter"

  tags = merge(var.required_tags, {
    Name = "${local.name_prefix}-${each.key}"
  })

  lifecycle {
    ignore_changes = [value]
  }
}
