output "queue_url" {
  description = "URL of the Steam library sync queue"
  value       = aws_sqs_queue.steam_library_sync.url
}

output "queue_arn" {
  description = "ARN of the Steam library sync queue"
  value       = aws_sqs_queue.steam_library_sync.arn
}

output "queue_name" {
  description = "Name of the Steam library sync queue"
  value       = aws_sqs_queue.steam_library_sync.name
}

output "dlq_url" {
  description = "URL of the dead letter queue"
  value       = aws_sqs_queue.steam_library_sync_dlq.url
}

output "dlq_arn" {
  description = "ARN of the dead letter queue"
  value       = aws_sqs_queue.steam_library_sync_dlq.arn
}

output "dlq_name" {
  description = "Name of the dead letter queue"
  value       = aws_sqs_queue.steam_library_sync_dlq.name
}
