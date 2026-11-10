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

**No state in this checkout (found 2026-11-06).** Neither `envs/dev` nor `envs/prod` has a `terraform.tfstate`, and the owner changes the live Cognito client URLs, S3 CORS and Google OAuth client by hand in the consoles. A `plan` here would propose creating a new pool and bucket. Do not `plan`/`apply` against the live account until the state is found or the resources are imported (`terraform import`); make address/origin changes in the consoles (see `docs/cutover-rollback.md` § Spec 027 phase 2).

## App Env Mapping (Outputs → .env.local)
```
cognito_user_pool_client_id     → AUTH_COGNITO_ID
cognito_user_pool_client_secret → AUTH_COGNITO_SECRET
cognito_issuer                  → AUTH_COGNITO_ISSUER
s3_bucket_name                  → S3_BUCKET_NAME
```

## Gotchas & Conventions

**S3 bucket naming** defaults to `{project}-{env}-{account_id}-{region}` to avoid global collisions. Override with `s3_bucket_name` in tfvars. Pin it to the existing bucket name (`terraform output s3_bucket_name`) so a `project_name` change can never replace the bucket; empty keeps the derived name, so pinning the current value is a no-op in plan.

**`domain_prefix` must be globally unique per AWS region** for Cognito Hosted UI. Once set in prod, do not change it — Cognito domain reassignment causes client downtime.

**Never change `project_name` or `domain_prefix`.** Both are ForceNew: the user pool/bucket/pool domain would be replaced (avatars orphaned, auth outage). The product rename does not touch them.

**`prevent_destroy = true`** is set on the Cognito user pool, the user pool domain and the S3 bucket (in `envs/modules/`), for dev and prod alike. Any plan that would destroy or replace them fails instead of proceeding. A deliberate `terraform destroy` of an env requires removing the flag first.

**Address cutover** (spec 027 §2.9): set `app_url` to the new origin and list the old one in `additional_callback_urls` (applied to Cognito callback `<origin>/api/auth/callback/cognito` and logout `<origin>`; same variable in dev and prod) and in `s3_additional_allowed_origins`. All in-place updates; client ID and secret are unchanged. Apply dev first, then prod. Drop the old origin from S3 CORS after the transition window.

**`enable_cognito_native = false`** means only federated IdPs (Google) are shown on the Hosted UI. Setting to `true` adds email/password login.

**No `provider default_tags`** — each module manages its own tag merging via a `local.default_tags` + `local.tags` pattern. New modules must follow this same pattern.
