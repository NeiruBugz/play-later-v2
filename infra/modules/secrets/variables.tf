variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, prod)"
  type        = string
}

variable "secret_names" {
  description = "List of secret names to create (non-sensitive, used as resource keys)"
  type        = list(string)
}

variable "secret_values" {
  description = "Map of secret names to their values (sensitive)"
  type        = map(string)
  sensitive   = true
}

variable "recovery_window_in_days" {
  description = "Number of days AWS Secrets Manager waits before deleting a secret (0 for immediate deletion in dev)"
  type        = number
  default     = 7
}

variable "tags" {
  description = "Additional tags for resources"
  type        = map(string)
  default     = {}
}
