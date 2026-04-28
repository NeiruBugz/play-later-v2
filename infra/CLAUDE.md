# SavePoint Infrastructure

Terraform IaC for SavePoint (AWS). Manages auth (Cognito), storage (S3), container registry (ECR), Lambda functions, SQS queues, and Secrets Manager. No remote backend configured — state is local per env.

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
  dev/    # recovery_window_in_days=0, steam concurrency=5, sender_principals=["*"]
  prod/   # recovery_window_in_days=7, steam concurrency=10, sender_principals=restrict!
```
Both envs use identical module composition. Differences are only in variable values (see above).

## Module Inventory
| Module | Manages |
|---|---|
| `cognito` | User Pool, App Client, Hosted UI domain, optional Google IdP federation |
| `s3` | App-assets bucket (versioned, public-access-blocked, CORS, IAM RW policy) |
| `ecr` | Single ECR repo `{project}-{env}-lambdas`; lifecycle keeps last N images |
| `lambda-container` | Lambda function (Image package), IAM role, CloudWatch log group, optional SQS event source mapping |
| `lambda-imports-bucket` | Dedicated S3 bucket for Steam CSV imports; lifecycle expiration (30d dev / 90d prod) |
| `secrets` | Secrets Manager secrets (shell placeholders only — values populated out-of-band) |
| `steam-import` | SQS main queue + DLQ for Steam library sync |

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

**Secret values are never in state.** `modules/secrets` creates Secrets Manager entries as empty placeholders. Values must be set out-of-band via AWS CLI after `apply`. See `lambdas-py/README.md`.

**Secret name path:** `{project_name}/{environment}/{secret-key}` (e.g. `savepoint/dev/steam-api-key`).

**S3 bucket naming** defaults to `{project}-{env}-{account_id}-{region}` to avoid global collisions. Override with `s3_bucket_name` in tfvars.

**`domain_prefix` must be globally unique per AWS region** for Cognito Hosted UI. Once set in prod, do not change it — Cognito domain reassignment causes client downtime.

**`sender_principals = ["*"]`** on the SQS queue is intentional in dev but must be replaced with an actual IAM role ARN in prod before going live. This is a known open TODO in both `main.tf` files.

**Lambda images** are referenced as `{ecr_repo_url}:{function}-latest`. ECR repo must exist and images must be pushed before `terraform apply` on Lambda modules, otherwise the apply will fail. Push images before applying Lambda changes.

**`enable_steam_import_event_source = false`** disables SQS polling without destroying the event source mapping resource. Use this to pause processing during debugging.

**`enable_cognito_native = false`** means only federated IdPs (Google) are shown on the Hosted UI. Setting to `true` adds email/password login.

**`steam_import_lambda` SQS event source** caps concurrency at `maximum_concurrency = 5` (defined in `envs/dev/main.tf` ~line 122). Bump deliberately — this is the per-queue cap, not a Lambda reserved-concurrency setting.

**VPC config for `database_import_lambda`** is commented out pending RDS setup (`envs/dev/main.tf` ~lines 164-168). Add subnet/SG IDs when RDS is provisioned.

**No `provider default_tags`** — each module manages its own tag merging via a `local.default_tags` + `local.tags` pattern. New modules must follow this same pattern.
