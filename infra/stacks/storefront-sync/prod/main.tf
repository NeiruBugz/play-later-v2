module "pipeline" {
  source = "../modules/pipeline"

  project           = local.project
  environment       = local.environment
  required_tags     = local.required_tags
  max_receive_count = var.max_receive_count
}
