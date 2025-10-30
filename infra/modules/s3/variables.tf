variable "name_prefix" {
  type        = string
  description = "Project/service name prefix"
}

variable "environment" {
  type        = string
  description = "Environment name (e.g., dev, prod)"
}

variable "bucket_name" {
  type        = string
  description = "Optional explicit S3 bucket name; defaults to <name_prefix>-<environment>"
  default     = ""
}

variable "cors_allowed_origins" {
  type        = list(string)
  description = "Allowed origins for CORS"
  default     = []
}

variable "ecs_task_role_name" {
  type        = string
  description = "Optional ECS task role name to attach S3 access policy to"
  default     = ""
}

