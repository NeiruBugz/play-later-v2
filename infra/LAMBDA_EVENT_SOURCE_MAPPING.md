# Lambda Event Source Mapping for SQS

## Overview

This document describes the implementation of SQS event source mapping for the Steam Import Lambda function, enabling automatic message processing from the Steam library sync queue.

## Implementation Summary

### 1. Lambda Container Module Enhancement

**Location**: `/infra/modules/lambda-container/`

**Changes**:
- Added support for optional SQS event source mapping configuration
- Automatically creates IAM policies for SQS access (ReceiveMessage, DeleteMessage, GetQueueAttributes)
- Configurable batch processing and concurrency settings

**New Variable** (`variables.tf`):

```hcl
variable "sqs_event_source" {
  description = "SQS event source configuration for the Lambda function"
  type = object({
    queue_arn                    = string
    batch_size                   = optional(number, 10)
    maximum_batching_window      = optional(number, 0)
    enabled                      = optional(bool, true)
    function_response_types      = optional(list(string), [])
    scaling_config = optional(object({
      maximum_concurrency = optional(number, 10)
    }), null)
  })
  default = null
}
```

**Key Features**:
- **Batch Size**: Controls how many messages Lambda receives per invocation (default: 10, configurable)
- **Maximum Batching Window**: Time to wait for full batch (0 = immediate processing)
- **Enabled Flag**: Allows disabling event source without destroying configuration
- **Partial Batch Failures**: Supports `ReportBatchItemFailures` for better error handling
- **Scaling Config**: Limits concurrent Lambda executions to prevent resource exhaustion

**IAM Permissions** (`main.tf`):

Automatically grants Lambda execution role:
```json
{
  "Effect": "Allow",
  "Action": [
    "sqs:ReceiveMessage",
    "sqs:DeleteMessage",
    "sqs:GetQueueAttributes"
  ],
  "Resource": "<queue-arn>"
}
```

**New Outputs** (`outputs.tf`):
- `event_source_mapping_uuid`: UUID of the event source mapping
- `event_source_mapping_state`: Current state (Enabled/Disabled/etc.)

### 2. Environment Configuration

**Dev Environment** (`/infra/envs/dev/`):

Added:
1. `steam_import_queue` module instantiation
2. Event source mapping in `steam_import_lambda` module
3. New variable `enable_steam_import_event_source` (default: `true`)
4. Queue outputs (queue_url, queue_arn, dlq_url)

Configuration:
```hcl
sqs_event_source = {
  queue_arn                    = module.steam_import_queue.queue_arn
  batch_size                   = 1  # Process one sync request at a time
  maximum_batching_window      = 0  # Process immediately
  enabled                      = var.enable_steam_import_event_source
  function_response_types      = ["ReportBatchItemFailures"]
  scaling_config = {
    maximum_concurrency = 5  # Dev: Lower concurrency
  }
}
```

**Prod Environment** (`/infra/envs/prod/`):

Same as dev, but with higher concurrency:
```hcl
scaling_config = {
  maximum_concurrency = 10  # Prod: Higher concurrency
}
```

### 3. New Variable for Feature Toggle

**Variable**: `enable_steam_import_event_source`
- Type: `bool`
- Default: `true`
- Purpose: Enable/disable event source mapping without destroying configuration
- Use Case: Debugging, maintenance, or gradual rollout

**Usage in `terraform.tfvars`**:
```hcl
# Disable event source for testing/debugging
enable_steam_import_event_source = false
```

## Architecture

### Message Flow

```
NextAuth API Route
      ↓
   SendMessage to SQS
      ↓
Steam Import Queue (savepoint-{env}-steam-library-sync)
      ↓
Event Source Mapping (automatic polling)
      ↓
Steam Import Lambda (triggered with 1 message)
      ↓
Process Steam Library Sync
      ↓
Success → Delete message
Failure → Message returns to queue
      ↓
Max retries (3x) → Dead Letter Queue
```

### Key Benefits

1. **Automatic Polling**: Lambda is invoked automatically when messages arrive
2. **Scalability**: Lambda scales based on queue depth and concurrency limits
3. **Error Handling**: Failed messages automatically retry, then move to DLQ
4. **Cost Optimization**: No need for constant polling or separate consumer infrastructure
5. **Partial Batch Failures**: Failed messages can be retried while successful ones are deleted

## Configuration Details

### Batch Processing

- **Batch Size**: `1` message per Lambda invocation
  - Ensures each user's library sync is processed independently
  - Prevents one user's failure from blocking others
  - Allows for better error tracking and retry logic

### Concurrency Control

- **Dev**: 5 concurrent executions
- **Prod**: 10 concurrent executions
- **Purpose**: Prevents overwhelming downstream services (Steam API, IGDB, database)

### Batching Window

- **Value**: `0` seconds (immediate processing)
- **Rationale**: User experience - sync requests should start immediately

### Function Response Types

- **Value**: `["ReportBatchItemFailures"]`
- **Benefit**: If batch size increases in the future, failed messages can be retried while successful ones are deleted

## IAM Permissions Summary

### Automatically Granted by Module

The `lambda-container` module automatically creates and attaches the following policy to the Lambda execution role:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "SQSEventSourceAccess",
      "Effect": "Allow",
      "Action": [
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage",
        "sqs:GetQueueAttributes"
      ],
      "Resource": "<steam-import-queue-arn>"
    }
  ]
}
```

### Sender Permissions (Future Work)

Currently `sender_principals = ["*"]` allows any AWS principal to send messages. In production, this should be restricted to:

```hcl
sender_principals = [
  module.nextauth_api_role.arn  # Or similar authenticated service
]
```

## Deployment

### First-Time Setup

1. Navigate to environment directory:
   ```bash
   cd infra/envs/dev  # or prod
   ```

2. Initialize Terraform (if not already done):
   ```bash
   terraform init
   ```

3. Review changes:
   ```bash
   terraform plan
   ```

4. Apply changes:
   ```bash
   terraform apply
   ```

### Resources Created

- SQS Queue: `savepoint-{env}-steam-library-sync`
- SQS DLQ: `savepoint-{env}-steam-library-sync-dlq`
- Lambda Event Source Mapping: UUID displayed in outputs
- IAM Policy: `{function-name}-sqs-access` (attached to Lambda role)

### Verification

1. Check event source mapping status:
   ```bash
   aws lambda list-event-source-mappings \
     --function-name savepoint-dev-steam-import
   ```

2. Monitor CloudWatch Logs for Lambda:
   ```bash
   aws logs tail /aws/lambda/savepoint-dev-steam-import --follow
   ```

3. Send test message to queue:
   ```bash
   aws sqs send-message \
     --queue-url $(terraform output -raw steam_import_queue_url) \
     --message-body '{"userId":"test-user","steamId":"76561198012345678"}'
   ```

## Monitoring

### CloudWatch Metrics

**Queue Metrics** (Namespace: AWS/SQS):
- `ApproximateNumberOfMessagesVisible` - Messages waiting to be processed
- `ApproximateNumberOfMessagesNotVisible` - Messages being processed
- `ApproximateAgeOfOldestMessage` - Queue backlog age

**Lambda Metrics** (Namespace: AWS/Lambda):
- `ConcurrentExecutions` - Current concurrent invocations
- `Invocations` - Total invocations from SQS
- `Errors` - Failed invocations
- `Duration` - Execution time

**Event Source Mapping Metrics**:
- `IteratorAge` - Age of last processed record (should be low)

### Recommended Alarms

1. **DLQ Messages**:
   ```hcl
   alarm_name          = "steam-import-dlq-messages"
   comparison_operator = "GreaterThanThreshold"
   threshold           = 0
   metric_name         = "ApproximateNumberOfMessagesVisible"
   namespace           = "AWS/SQS"
   dimensions = {
     QueueName = "${module.steam_import_queue.dlq_name}"
   }
   ```

2. **Lambda Errors**:
   ```hcl
   alarm_name          = "steam-import-lambda-errors"
   comparison_operator = "GreaterThanThreshold"
   threshold           = 5
   metric_name         = "Errors"
   namespace           = "AWS/Lambda"
   statistic           = "Sum"
   period              = 300  # 5 minutes
   ```

3. **Queue Age**:
   ```hcl
   alarm_name          = "steam-import-queue-age"
   comparison_operator = "GreaterThanThreshold"
   threshold           = 600  # 10 minutes
   metric_name         = "ApproximateAgeOfOldestMessage"
   ```

## Troubleshooting

### Event Source Mapping Not Triggering

1. **Check Mapping State**:
   ```bash
   aws lambda get-event-source-mapping --uuid <uuid-from-output>
   ```

2. **Verify IAM Permissions**: Ensure Lambda role has SQS permissions
3. **Check Lambda Concurrency**: May be throttled if at account limit
4. **Review CloudWatch Logs**: Look for errors in Lambda execution logs

### Messages Going to DLQ

1. **Inspect DLQ Messages**:
   ```bash
   aws sqs receive-message \
     --queue-url $(terraform output -raw steam_import_dlq_url) \
     --max-number-of-messages 10
   ```

2. **Common Causes**:
   - Lambda timeout (300s)
   - Unhandled exceptions in Lambda code
   - Steam API rate limiting
   - Invalid message format

3. **Reprocessing Failed Messages**:
   - Fix root cause
   - Redrive messages from DLQ to main queue (AWS Console or CLI)

### Disabling Event Source for Debugging

```hcl
# In terraform.tfvars
enable_steam_import_event_source = false
```

Then run `terraform apply`. This keeps the configuration but stops automatic processing.

## Cost Considerations

### SQS Costs

- **Free Tier**: 1 million requests/month
- **Standard Queue Pricing**: $0.40 per million requests (after free tier)
- **Long Polling**: Reduces requests compared to short polling

**Estimated Costs** (assuming 1000 sync requests/day):
- Monthly requests: ~30,000 (well within free tier)
- Cost: $0 (free tier covers this volume)

### Lambda Costs

- **Free Tier**: 1 million requests/month, 400,000 GB-seconds compute
- **Pricing**: $0.20 per 1 million requests, $0.0000166667 per GB-second

**Estimated Costs** (1000 syncs/day, 30s avg duration, 512MB):
- Monthly invocations: ~30,000
- Compute: 30,000 × 30s × 0.5GB = 450,000 GB-seconds
- Cost: ~$0 (within free tier) to $7.50/month

### Total Estimated Cost

- **Dev Environment**: $0 (within free tier)
- **Production** (10x volume): $0.40 SQS + $75 Lambda = ~$75/month

## Future Enhancements

1. **Security**:
   - Restrict `sender_principals` to authenticated API role
   - Enable SQS encryption at rest (KMS)
   - Implement VPC endpoints for Lambda-to-SQS communication

2. **Monitoring**:
   - Add CloudWatch alarms (DLQ, errors, queue age)
   - Set up SNS notifications for failures
   - Create CloudWatch dashboard for queue metrics

3. **Performance**:
   - Consider FIFO queue if order matters
   - Implement message deduplication
   - Add dead letter queue redrive automation

4. **Integration**:
   - Add API Gateway endpoint to enqueue sync requests
   - Implement webhook for sync completion notifications
   - Add SQS batch processing for bulk imports

## References

- [AWS Lambda Event Source Mapping](https://docs.aws.amazon.com/lambda/latest/dg/with-sqs.html)
- [SQS Best Practices](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-best-practices.html)
- [Lambda Concurrency](https://docs.aws.amazon.com/lambda/latest/dg/configuration-concurrency.html)
- [Partial Batch Failures](https://docs.aws.amazon.com/lambda/latest/dg/with-sqs.html#services-sqs-batchfailurereporting)

## Files Modified

### Module Files
- `/infra/modules/lambda-container/main.tf` - Added SQS event source mapping and IAM policy
- `/infra/modules/lambda-container/variables.tf` - Added `sqs_event_source` variable
- `/infra/modules/lambda-container/outputs.tf` - Added event source mapping outputs
- `/infra/modules/steam-import/README.md` - Updated with event source mapping examples

### Dev Environment
- `/infra/envs/dev/main.tf` - Added queue module and event source configuration
- `/infra/envs/dev/variables.tf` - Added `enable_steam_import_event_source` variable
- `/infra/envs/dev/terraform.tfvars.example` - Documented new variable

### Prod Environment
- `/infra/envs/prod/main.tf` - Added queue module and event source configuration
- `/infra/envs/prod/variables.tf` - Added `enable_steam_import_event_source` variable
- `/infra/envs/prod/terraform.tfvars.example` - Documented new variable

### Documentation
- `/infra/LAMBDA_EVENT_SOURCE_MAPPING.md` - This comprehensive guide
