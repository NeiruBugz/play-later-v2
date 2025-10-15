Infrastructure (Terraform)

Overview

- Location: `infra/`
- Structure:
  - `modules/cognito/`: Reusable Cognito module
  - `envs/dev/`: Dev environment stack
  - `envs/prod/`: Prod environment stack

What this provisions

- AWS Cognito User Pool
- Cognito User Pool App Client (OIDC code flow)
- Cognito Hosted UI domain
- Optional: Google IdP federation into Cognito (supply Google client ID/secret)

Outputs → App env mapping

- `cognito_user_pool_client_id` → `AUTH_COGNITO_ID`
- `cognito_issuer` → `AUTH_COGNITO_ISSUER`
- `cognito_user_pool_client_secret` → `AUTH_COGNITO_SECRET`

Dev quickstart

1. cd infra/envs/dev
2. Copy and fill variables: `cp terraform.tfvars.example terraform.tfvars`
3. Export AWS creds (profile/role) with permission for Cognito
4. terraform init && terraform apply
5. Take outputs and set in app `.env.local`:
   - `AUTH_URL=http://localhost:6060`
   - `AUTH_SECRET=...` (use `openssl rand -base64 32`)
   - `AUTH_COGNITO_ID=...`
   - `AUTH_COGNITO_SECRET=...`
   - `AUTH_COGNITO_ISSUER=...`

Notes

- Callback URL is `${AUTH_URL}/api/auth/callback/cognito` and is pre-wired in the module.
- Logout URL is `${AUTH_URL}`.
- You can keep Google temporarily by leaving `AUTH_GOOGLE_*` set; the app no longer uses it by default.
- For production, set a stable `domain_prefix` to avoid churn (Cognito domain must be globally unique per region).

Optional: Configure Google as Cognito IdP

- Add to your `terraform.tfvars`:
  - `google_client_id = "..."`
  - `google_client_secret = "..."`
- Re-apply. The Cognito Hosted UI will show Google, and the app continues to use NextAuth `cognito` provider only.

Bypassing Hosted UI page

- The app’s Cognito provider passes `identity_provider=Google` in the authorization request, so Cognito immediately redirects to Google without rendering its login page (there is still an invisible redirect hop through Cognito’s `/oauth2/authorize`).
- Keep `enable_cognito_native = false` to ensure only Google is available.
