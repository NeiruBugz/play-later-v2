locals {
  project     = "savepoint"
  environment = "shared"

  required_tags = {
    Environment = local.environment
    Project     = local.project
    Owner       = var.owner
    ManagedBy   = "terraform"
  }
}
