variable "function_name" {
  description = "Name of the Lambda function"
  type        = string
}

variable "description" {
  description = "Description of the Lambda function"
  type        = string
  default     = ""
}

variable "image_uri" {
  description = "ECR image URI with tag (e.g., 123456789012.dkr.ecr.us-east-1.amazonaws.com/my-repo:latest)"
  type        = string
}

variable "memory_size" {
  description = "Amount of memory in MB for the Lambda function"
  type        = number
  default     = 512
}

variable "timeout" {
  description = "Timeout in seconds for the Lambda function"
  type        = number
  default     = 300
}

variable "environment_variables" {
  description = "Environment variables for the Lambda function"
  type        = map(string)
  default     = {}
}

variable "s3_bucket_arns" {
  description = "List of S3 bucket ARNs the Lambda needs access to"
  type        = list(string)
  default     = []
}

variable "secrets_arns" {
  description = "List of Secrets Manager secret ARNs the Lambda needs access to"
  type        = list(string)
  default     = []
}

variable "vpc_config" {
  description = "VPC configuration for the Lambda function"
  type = object({
    subnet_ids         = list(string)
    security_group_ids = list(string)
  })
  default = null
}

variable "reserved_concurrent_executions" {
  description = "Reserved concurrent executions for the Lambda function (-1 for unreserved)"
  type        = number
  default     = -1
}

variable "log_retention_days" {
  description = "Number of days to retain CloudWatch logs"
  type        = number
  default     = 14
}

variable "architectures" {
  description = "Instruction set architecture for the Lambda function (x86_64 or arm64)"
  type        = list(string)
  default     = ["x86_64"]
}

variable "tags" {
  description = "Additional tags for resources"
  type        = map(string)
  default     = {}
}
