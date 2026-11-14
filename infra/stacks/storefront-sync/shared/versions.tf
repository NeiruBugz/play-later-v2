terraform {
  required_version = "= 1.14.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "= 6.73.0"
    }
  }

  backend "s3" {
    key          = "storefront-sync/shared/terraform.tfstate"
    encrypt      = true
    use_lockfile = true
  }
}
