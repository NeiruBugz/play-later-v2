# Steam Import SQS Module

Terraform module for AWS SQS infrastructure supporting background Steam library synchronization.

## Overview

This module creates two SQS queues:
- **Main Queue** (`steam-library-sync`): Handles Steam library sync requests
- **Dead Letter Queue** (`steam-library-sync-dlq`): Stores failed messages for debugging

## Architecture

```
Steam Import Request
        ↓
   Main SQS Queue (steam-library-sync)
        ↓
   Lambda Consumer (processes message)
        ↓
   Success → Message deleted
   Failure → Retry (up to maxReceiveCount)
        ↓
   Max retries exceeded → DLQ
```

## Features

- **Long Polling**: 20-second receive wait time reduces empty responses
- **Visibility Timeout**: 5 minutes (300s) allows time for Steam API calls
- **Dead Letter Queue**: Failed messages retained for 14 days for debugging
- **Message Retention**: 7 days for main queue, 14 days for DLQ
- **Max Receive Count**: Messages moved to DLQ after 3 failed attempts

## Usage

### Basic Example

```hcl
module "steam_import" {
  source      = "../../modules/steam-import"
  project_name = "savepoint"
  environment  = "dev"
}
```

### Custom Configuration

```hcl
module "steam_import" {
  source      = "../../modules/steam-import"
  project_name = "savepoint"
  environment  = "prod"

  visibility_timeout_seconds    = 600  # 10 minutes for slower processing
  message_retention_seconds     = 1209600  # 14 days
  max_receive_count             = 5    # More retries before DLQ

  sender_principals = [
    "arn:aws:iam::123456789012:role/steam-import-producer"
  ]
}
```

## Requirements

| Name | Version |
|------|---------|
| terraform | >= 1.0 |
| aws | >= 4.0 |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| project_name | Project name prefix for resource naming | `string` | `"savepoint"` | no |
| environment | Environment name (dev, prod, staging) | `string` | n/a | yes |
| visibility_timeout_seconds | Visibility timeout in seconds | `number` | `300` | no |
| message_retention_seconds | Message retention period for main queue (seconds) | `number` | `604800` | no |
| dlq_message_retention_seconds | Message retention period for DLQ (seconds) | `number` | `1209600` | no |
| receive_wait_time_seconds | Long polling wait time in seconds | `number` | `20` | no |
| max_receive_count | Max times a message can be received before DLQ | `number` | `3` | no |
| sender_principals | AWS principal ARNs allowed to send messages | `list(string)` | `["*"]` | no |

## Outputs

| Name | Description |
|------|-------------|
| queue_url | URL of the Steam library sync queue |
| queue_arn | ARN of the Steam library sync queue |
| queue_name | Name of the Steam library sync queue |
| dlq_url | URL of the dead letter queue |
| dlq_arn | ARN of the dead letter queue |
| dlq_name | Name of the dead letter queue |

## Queue Configuration Details

### Main Queue

- **Name Format**: `{project_name}-{environment}-steam-library-sync`
- **Type**: Standard (not FIFO)
- **Visibility Timeout**: 300 seconds (5 minutes)
  - Prevents other consumers from receiving the message while it's being processed
  - Must be longer than the expected Lambda execution time
- **Message Retention**: 7 days
  - Unprocessed messages are kept for this duration
- **Receive Wait Time**: 20 seconds
  - Enables long polling to reduce API costs and latency
- **Max Message Size**: 256 KB

### Dead Letter Queue

- **Name Format**: `{project_name}-{environment}-steam-library-sync-dlq`
- **Message Retention**: 14 days
  - Longer retention for debugging failed sync attempts
- **Purpose**: Captures messages that fail after 3 processing attempts

## IAM Permissions

### Lambda Consumer Permissions

Grant your Lambda function these permissions:

```hcl
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage",
        "sqs:GetQueueAttributes"
      ],
      "Resource": "${module.steam_import.queue_arn}"
    }
  ]
}
```

### Message Producer Permissions

Grant your API/service these permissions:

```hcl
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "sqs:SendMessage",
      "Resource": "${module.steam_import.queue_arn}"
    }
  ]
}
```

## Message Format

Expected message structure for Steam library sync:

```json
{
  "userId": "user-uuid-here",
  "steamId": "76561198012345678",
  "requestedAt": "2024-01-20T10:30:00Z",
  "priority": "normal"
}
```

## Monitoring

### CloudWatch Metrics

Monitor these key metrics:
- `ApproximateNumberOfMessagesVisible` - Messages in queue
- `ApproximateNumberOfMessagesNotVisible` - Messages being processed
- `ApproximateAgeOfOldestMessage` - Age of oldest message
- `NumberOfMessagesSent` - Messages added to queue
- `NumberOfMessagesDeleted` - Successfully processed messages

### DLQ Monitoring

Set up CloudWatch alarms for:
- `ApproximateNumberOfMessagesVisible` on DLQ > 0
  - Alert when messages fail and enter DLQ
  - Investigate and reprocess failed messages

## Cost Optimization

- **Long Polling**: Reduces API requests compared to short polling
- **Standard Queue**: More cost-effective than FIFO for this use case
- **Message Retention**: 7 days balances reliability with storage costs

## Security Best Practices

1. **Queue Policy**: Restrict `sender_principals` in production
2. **Encryption**: Consider enabling SQS encryption at rest (KMS)
3. **IAM Roles**: Use least-privilege permissions for consumers
4. **VPC Endpoints**: Use VPC endpoints for Lambda-to-SQS communication

## Example Integration

### Complete Integration with Lambda Event Source Mapping

```hcl
# In envs/dev/main.tf or envs/prod/main.tf

# Create the SQS queue
module "steam_import_queue" {
  source       = "../../modules/steam-import"
  project_name = var.project_name
  environment  = var.environment

  sender_principals = ["*"]  # Update with specific principals in production
}

# Create Lambda with event source mapping
module "steam_import_lambda" {
  source        = "../../modules/lambda-container"
  function_name = "${var.project_name}-${var.environment}-steam-import"
  description   = "Fetch Steam library and upload raw CSV to S3"
  image_uri     = "${module.ecr.repository_url}:steam-import-latest"
  timeout       = 300
  memory_size   = 512

  s3_bucket_arns = [module.lambda_imports_bucket.bucket_arn]
  secrets_arns   = [module.lambda_secrets.secret_arns["steam-api-key"]]

  environment_variables = {
    S3_BUCKET                = module.lambda_imports_bucket.bucket_name
    AWS_DEFAULT_REGION       = var.region
    STEAM_API_KEY_SECRET_ARN = module.lambda_secrets.secret_arns["steam-api-key"]
  }

  # SQS Event Source Mapping (automatically grants permissions)
  sqs_event_source = {
    queue_arn                    = module.steam_import_queue.queue_arn
    batch_size                   = 1  # Process one sync request at a time
    maximum_batching_window      = 0  # Process immediately
    enabled                      = true
    function_response_types      = ["ReportBatchItemFailures"]  # Partial batch failures
    scaling_config = {
      maximum_concurrency = 5  # Max concurrent executions
    }
  }
}
```

### Legacy Integration (Manual Polling)

If not using event source mapping, configure environment variables:

```hcl
environment_variables = {
  STEAM_SYNC_QUEUE_URL = module.steam_import_queue.queue_url
}
```

## References

- [AWS SQS Documentation](https://docs.aws.amazon.com/sqs/)
- [SQS Best Practices](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-best-practices.html)
- [Dead Letter Queues](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html)
