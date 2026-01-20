locals {
  queue_name = "${var.project_name}-${var.environment}-steam-library-sync"
  dlq_name   = "${var.project_name}-${var.environment}-steam-library-sync-dlq"
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
    Module      = "steam-import"
  }
}

resource "aws_sqs_queue" "steam_library_sync_dlq" {
  name                      = local.dlq_name
  message_retention_seconds = var.dlq_message_retention_seconds

  tags = merge(
    local.common_tags,
    {
      Name = local.dlq_name
      Type = "dead-letter-queue"
    }
  )
}

resource "aws_sqs_queue" "steam_library_sync" {
  name                       = local.queue_name
  visibility_timeout_seconds = var.visibility_timeout_seconds
  message_retention_seconds  = var.message_retention_seconds
  receive_wait_time_seconds  = var.receive_wait_time_seconds
  max_message_size           = 262144 # 256 KB max

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.steam_library_sync_dlq.arn
    maxReceiveCount     = var.max_receive_count
  })

  tags = merge(
    local.common_tags,
    {
      Name = local.queue_name
      Type = "main-queue"
    }
  )
}

resource "aws_sqs_queue_policy" "steam_library_sync" {
  queue_url = aws_sqs_queue.steam_library_sync.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowSendMessage"
        Effect = "Allow"
        Principal = {
          AWS = var.sender_principals
        }
        Action   = "sqs:SendMessage"
        Resource = aws_sqs_queue.steam_library_sync.arn
      }
    ]
  })
}
