variable "project" {
  description = "Project name used as the resource name prefix and the SSM path root"
  type        = string
  nullable    = false
}

variable "environment" {
  description = "Environment name used in resource names and the SSM path"
  type        = string
  nullable    = false
}

variable "required_tags" {
  description = "Required tags (Environment, Project, Owner, ManagedBy) merged into every taggable resource"
  type        = map(string)
  nullable    = false

  validation {
    condition     = alltrue([for key in ["Environment", "Project", "Owner", "ManagedBy"] : contains(keys(var.required_tags), key)])
    error_message = "required_tags must contain Environment, Project, Owner and ManagedBy."
  }
}

variable "max_receive_count" {
  description = "Receives before a message moves to the DLQ; also passed to the Lambdas as SYNC_MAX_RECEIVE_COUNT so the final-attempt logic matches the redrive policy"
  type        = number
  default     = 3
  nullable    = false

  validation {
    condition     = var.max_receive_count >= 1 && floor(var.max_receive_count) == var.max_receive_count
    error_message = "max_receive_count must be a positive integer."
  }
}
