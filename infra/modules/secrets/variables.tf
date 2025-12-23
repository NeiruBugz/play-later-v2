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

  validation {
    condition = length(var.secret_values) == 0 || alltrue([
      for name in var.secret_names : contains(keys(var.secret_values), name)
    ])
    error_message = "Each secret name in secret_names must have a corresponding key in secret_values. Missing keys: ${join(", ", setsubtract(var.secret_names, keys(var.secret_values)))}"
  }
}

variable "secret_values" {
  description = "Map of secret names to their values (sensitive)"
  type        = map(string)
  sensitive   = true
  default     = {}
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
