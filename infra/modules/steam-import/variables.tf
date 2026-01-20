variable "project_name" {
  type        = string
  description = "Project name prefix for resource naming"
  default     = "savepoint"
}

variable "environment" {
  type        = string
  description = "Environment name (e.g., dev, prod)"
  validation {
    condition     = contains(["dev", "prod", "staging"], var.environment)
    error_message = "Environment must be dev, prod, or staging"
  }
}

variable "visibility_timeout_seconds" {
  type        = number
  description = "Visibility timeout in seconds (time allowed for message processing)"
  default     = 300 # 5 minutes - sufficient for Steam API calls
}

variable "message_retention_seconds" {
  type        = number
  description = "Message retention period in seconds for the main queue"
  default     = 604800 # 7 days
  validation {
    condition     = var.message_retention_seconds >= 60 && var.message_retention_seconds <= 1209600
    error_message = "Message retention must be between 60 seconds and 14 days"
  }
}

variable "dlq_message_retention_seconds" {
  type        = number
  description = "Message retention period in seconds for the dead letter queue"
  default     = 1209600 # 14 days
  validation {
    condition     = var.dlq_message_retention_seconds >= 60 && var.dlq_message_retention_seconds <= 1209600
    error_message = "DLQ message retention must be between 60 seconds and 14 days"
  }
}

variable "receive_wait_time_seconds" {
  type        = number
  description = "Long polling wait time in seconds"
  default     = 20 # Maximum long polling duration
  validation {
    condition     = var.receive_wait_time_seconds >= 0 && var.receive_wait_time_seconds <= 20
    error_message = "Receive wait time must be between 0 and 20 seconds"
  }
}

variable "max_receive_count" {
  type        = number
  description = "Maximum number of times a message can be received before moving to DLQ"
  default     = 3
  validation {
    condition     = var.max_receive_count >= 1 && var.max_receive_count <= 1000
    error_message = "Max receive count must be between 1 and 1000"
  }
}

variable "sender_principals" {
  type        = list(string)
  description = "List of AWS principal ARNs allowed to send messages to the queue"
  default     = ["*"]
}
