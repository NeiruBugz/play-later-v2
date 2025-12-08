locals {
  repository_name = "${var.name_prefix}-${var.environment}-lambdas"

  default_tags = {
    Environment = var.environment
    ManagedBy   = "terraform"
    Module      = "ecr"
  }

  tags = merge(local.default_tags, var.tags)
}

resource "aws_ecr_repository" "this" {
  name                 = local.repository_name
  image_tag_mutability = var.image_tag_mutability

  image_scanning_configuration {
    scan_on_push = var.scan_on_push
  }

  tags = local.tags
}

resource "aws_ecr_lifecycle_policy" "this" {
  repository = aws_ecr_repository.this.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last ${var.max_image_count} images"
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = var.max_image_count
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}
