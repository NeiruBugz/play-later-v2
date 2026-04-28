# SavePoint Infrastructure

Terraform IaC for SavePoint (AWS). Manages auth (Cognito) and storage (S3). No remote backend configured — state is local per env.

## Versions
- Terraform: `>= 1.5.0`
- AWS provider: `~> 5.0`
- Default region: `eu-central-1`

## Key Commands
All commands run from an env directory, not repo root.

```bash
cd infra/envs/dev          # or prod
cp terraform.tfvars.example terraform.tfvars   # first-time only
terraform init
terraform plan
terraform apply
terraform output -json     # get values to copy into app .env.local
terraform destroy
```

## Environment Structure
```
envs/
  dev/    # development environment
  prod/   # production environment
```
Both envs use identical module composition. Differences are only in variable values.

## Module Inventory
| Module | Manages |
|---|---|
| `cognito` | User Pool, App Client, Hosted UI domain, optional Google IdP federation |
| `s3` | App-assets bucket (versioned, public-access-blocked, CORS, IAM RW policy) |

## State Backend
No remote backend. State files are local (`.terraform/` + `terraform.tfstate`) inside each env directory. Do not run `terraform apply` from two machines simultaneously.

## App Env Mapping (Outputs → .env.local)
```
cognito_user_pool_client_id     → AUTH_COGNITO_ID
cognito_user_pool_client_secret → AUTH_COGNITO_SECRET
cognito_issuer                  → AUTH_COGNITO_ISSUER
s3_bucket_name                  → S3_BUCKET_NAME
```

## Gotchas & Conventions

**S3 bucket naming** defaults to `{project}-{env}-{account_id}-{region}` to avoid global collisions. Override with `s3_bucket_name` in tfvars.

**`domain_prefix` must be globally unique per AWS region** for Cognito Hosted UI. Once set in prod, do not change it — Cognito domain reassignment causes client downtime.

**`enable_cognito_native = false`** means only federated IdPs (Google) are shown on the Hosted UI. Setting to `true` adds email/password login.

**No `provider default_tags`** — each module manages its own tag merging via a `local.default_tags` + `local.tags` pattern. New modules must follow this same pattern.
