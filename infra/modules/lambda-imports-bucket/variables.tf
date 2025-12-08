variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, prod)"
  type        = string
}

variable "lifecycle_expiration_days" {
  description = "Number of days after which to expire objects in the bucket"
  type        = number
  default     = 30
}

variable "enable_versioning" {
  description = "Enable versioning for the bucket"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Additional tags for resources"
  type        = map(string)
  default     = {}
}
