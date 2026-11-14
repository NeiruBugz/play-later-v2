# Storefront sync: owner runbook

Owner-only steps for the background Steam sync (spec 030): AWS stack, Vercel and GitHub wiring, smoke tests, rollback. Nothing here is run by an agent. Every step ends with a check; do not continue until the check passes.

Stack code: `infra/stacks/storefront-sync/` (`shared/`, `prod/`, `modules/pipeline/`). Spec: `context/spec/030-background-storefront-import/`.

## Contents

- [TL;DR (RU)](#tldr-ru)
- [What gets built](#what-gets-built)
- [How GitHub and AWS get linked (OIDC)](#how-github-and-aws-get-linked-oidc)
- [Before you start](#before-you-start)
- [Step 1: bootstrap the S3 state bucket](#step-1-bootstrap-the-s3-state-bucket)
- [Step 2: check for an existing GitHub OIDC provider](#step-2-check-for-an-existing-github-oidc-provider)
- [Step 3: apply shared/, then prod/](#step-3-apply-shared-then-prod)
- [Step 4: put the SSM secret values](#step-4-put-the-ssm-secret-values)
- [Step 5: switch Vercel OIDC to Team issuer mode](#step-5-switch-vercel-oidc-to-team-issuer-mode)
- [Step 6: set the Vercel env vars](#step-6-set-the-vercel-env-vars)
- [Step 7: link GitHub to AWS (environment and variables)](#step-7-link-github-to-aws-environment-and-variables)
- [Step 8: smoke-test OIDC](#step-8-smoke-test-oidc)
- [Step 9: roll back](#step-9-roll-back)
- [Secret rotation checklist](#secret-rotation-checklist)
- [Troubleshooting](#troubleshooting)

## TL;DR (RU)

- Порядок: 1) бакет под state руками (один раз), 2) проверить, нет ли уже GitHub OIDC provider в аккаунте (если есть, `terraform import`), 3) `apply` в `shared/`, потом в `prod/`, 4) положить 4 секрета в SSM, 5) в Vercel переключить OIDC issuer в Team mode, 6) выставить 4 env-переменные в Vercel, 7) создать/проверить environment `production` в GitHub и 4 repo variables, 8) smoke-тест OIDC, 9) знать, как откатиться.
- Связка GitHub и AWS без ключей: в AWS создаётся OIDC provider `token.actions.githubusercontent.com` и роль `savepoint-prod-github-lambda-deploy`, которая доверяет только `repo:NeiruBugz/play-later-v2:environment:production`. Workflow получает короткоживущий токен от GitHub и меняет его на временные AWS-креды. Долгоживущих AWS-ключей в GitHub нет. Подробно: [раздел про OIDC](#how-github-and-aws-get-linked-oidc) и [шаг 7](#step-7-link-github-to-aws-environment-and-variables).
- Переменные GitHub (контракт для `deploy.yml`, Slice 9): `AWS_LAMBDA_DEPLOY_ROLE_ARN`, `AWS_REGION`, `STEAM_SYNC_GATHER_FUNCTION`, `STEAM_SYNC_ENRICH_FUNCTION`. Ставь их как repo variables (не только в environment), иначе job-level `if:` их не увидит.
- Переменные Vercel (только Production): `STOREFRONT_SYNC_QUEUE=sqs`, `STEAM_SYNC_GATHER_QUEUE_URL`, `AWS_SYNC_ROLE_ARN`, `AWS_REGION`.
- Ничего из `terraform apply`, `put-parameter`, переменных Vercel/GitHub агент не делает, это твои шаги. Старые `infra/envs/*` не трогаем: у них локальный state (и в этом чекауте его нет), стек sync живёт отдельно, state в S3.
- Откат: [шаг 9](#step-9-roll-back). Быстрый откат без удаления инфры: `STOREFRONT_SYNC_QUEUE` убрать в Vercel, выключить event source mappings, очистить очереди.

## What gets built

| Piece | Where | Name |
|---|---|---|
| State bucket (by hand, step 1) | S3 | `savepoint-tfstate-<account-id>` (suggested) |
| Vercel OIDC provider | IAM, `shared/` | `https://oidc.vercel.com/<team-slug>` |
| GitHub OIDC provider | IAM, `shared/` | `https://token.actions.githubusercontent.com` |
| Gather and enrich queues plus DLQs | SQS, `prod/` | `savepoint-prod-storefront-gather`, `savepoint-prod-storefront-enrich` (+ `-dlq`) |
| Gather and enrich Lambdas | Lambda, `prod/` | `savepoint-prod-storefront-gather`, `savepoint-prod-storefront-enrich` (stub code until `deploy-lambdas` ships real code) |
| Lambda secrets | SSM SecureString, `prod/` | `/savepoint/prod/storefront-sync/{POSTGRES_PRISMA_URL,IGDB_CLIENT_ID,IGDB_CLIENT_SECRET,STEAM_API_KEY}` |
| Vercel runtime role | IAM, `prod/` | `savepoint-prod-vercel-sqs-send` (`sqs:SendMessage` on the gather queue only) |
| GitHub deploy role | IAM, `prod/` | `savepoint-prod-github-lambda-deploy` (`lambda:UpdateFunctionCode`, `GetFunction`, `GetFunctionConfiguration` on the two functions only) |

Terraform is pinned: Terraform `= 1.14.6`, AWS provider `= 6.73.0`, archive `= 2.8.1`. State is in S3 with `use_lockfile = true` (no DynamoDB table).

The legacy roots `infra/envs/dev` and `infra/envs/prod` (Cognito + S3) are not part of this stack and are never touched here. They have local state, and no `terraform.tfstate` exists in this checkout (see `infra/CLAUDE.md`), so a `plan` there would propose creating a duplicate pool and bucket. Do not run Terraform in them as part of this runbook.

## How GitHub and AWS get linked (OIDC)

OIDC means GitHub proves "this job runs in repo X, environment Y" with a short-lived signed token, and AWS exchanges that token for temporary credentials of a role whose trust policy accepts exactly that claim. No AWS access keys are stored in GitHub, so there is nothing to leak or rotate.

The link has three parts, all created by this stack, plus two settings you make in GitHub:

1. AWS knows GitHub as a trusted token issuer: the IAM OIDC provider `token.actions.githubusercontent.com` (`shared/oidc.tf`).
2. AWS has a role that trusts only this repo's `production` environment: `savepoint-prod-github-lambda-deploy`, trust condition `sub = repo:NeiruBugz/play-later-v2:environment:production`, `aud = sts.amazonaws.com` (`prod/iam.tf`). Its permissions are limited to updating the two Lambda functions.
3. GitHub knows which role to assume: the repo variable `AWS_LAMBDA_DEPLOY_ROLE_ARN` (step 7), used by `aws-actions/configure-aws-credentials` in a job that has `permissions: id-token: write` and `environment: production`.

The same shape links Vercel and AWS: provider `https://oidc.vercel.com/<team-slug>` and role `savepoint-prod-vercel-sqs-send`, trust `sub = owner:<team-slug>:project:<project-name>:environment:production` (steps 5 and 6). Vercel reference: <https://vercel.com/docs/oidc/aws>.

Consequences worth knowing:

- Only jobs that declare `environment: production` can assume the deploy role. A PR workflow or a job without that environment is denied. That is intended.
- Only the Vercel Production environment can assume the SQS role. Preview deployments cannot send sync messages. That is intended (spec 030, owner decision).
- Renaming the GitHub repo, the `production` environment, the Vercel project or the Vercel team breaks the trust policies. Update `variables.tf` values and re-apply `prod/` in the same change.

## Before you start

Tools: AWS CLI v2, Terraform `1.14.6` exactly (`tfenv install 1.14.6 && tfenv use 1.14.6`, or any installer that gives that version), `gh` (authenticated with admin rights on the repo), Vercel CLI (`npm i -g vercel`, then `vercel login`), `jq`.

Decide the region first. It must equal the `AWS_REGION` Vercel already uses for the S3 avatar bucket, because the app uses one `AWS_REGION` for every AWS client (`savepoint-tanstack/env.ts`). The default in this repo is `eu-central-1`.

```bash
export AWS_PROFILE=your-admin-profile            # an admin profile for the account
export AWS_REGION=eu-central-1                   # same value as Vercel AWS_REGION today
export ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export STATE_BUCKET="savepoint-tfstate-${ACCOUNT_ID}"
export GH_REPO=NeiruBugz/play-later-v2
echo "account=$ACCOUNT_ID region=$AWS_REGION bucket=$STATE_BUCKET"
```

Check: the account ID printed is the account you intend to deploy to. Terraform version check:

```bash
terraform version | head -1   # expect: Terraform v1.14.6
```

You also need two Vercel facts. Collect them now, they go into `terraform.tfvars` in step 3:

- Team slug. Dashboard: Team Settings, General, "Team URL" (the part after `vercel.com/`); it is also the first path segment in any dashboard URL. CLI: `vercel teams ls` (column "Slug"/ID).
- Project name. Dashboard: Project Settings, General, "Project Name". CLI: `vercel project ls`. The name, not the project ID, goes into the trust policy.

```bash
export VERCEL_TEAM_SLUG=your-vercel-team-slug
export VERCEL_PROJECT_NAME=your-vercel-project-name
```

## Step 1: bootstrap the S3 state bucket

Terraform cannot create the bucket that stores its own state, so this is done once with the CLI. The bucket is versioned (state history), encrypted, private and TLS-only. The stack's locking uses a `.tflock` object in the same bucket, so no DynamoDB table is needed.

```bash
aws s3api create-bucket --bucket "$STATE_BUCKET" --region "$AWS_REGION" \
  --create-bucket-configuration LocationConstraint="$AWS_REGION"
# us-east-1 only: drop the --create-bucket-configuration line

aws s3api put-bucket-versioning --bucket "$STATE_BUCKET" \
  --versioning-configuration Status=Enabled

aws s3api put-bucket-encryption --bucket "$STATE_BUCKET" \
  --server-side-encryption-configuration \
  '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"},"BucketKeyEnabled":true}]}'

aws s3api put-public-access-block --bucket "$STATE_BUCKET" \
  --public-access-block-configuration \
  BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

aws s3api put-bucket-policy --bucket "$STATE_BUCKET" --policy "{
  \"Version\": \"2012-10-17\",
  \"Statement\": [{
    \"Sid\": \"DenyInsecureTransport\",
    \"Effect\": \"Deny\",
    \"Principal\": \"*\",
    \"Action\": \"s3:*\",
    \"Resource\": [\"arn:aws:s3:::${STATE_BUCKET}\", \"arn:aws:s3:::${STATE_BUCKET}/*\"],
    \"Condition\": {\"Bool\": {\"aws:SecureTransport\": \"false\"}}
  }]
}"
```

Check:

```bash
aws s3api get-bucket-versioning --bucket "$STATE_BUCKET" --query Status --output text        # Enabled
aws s3api get-bucket-encryption --bucket "$STATE_BUCKET" \
  --query 'ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm' --output text   # AES256
aws s3api get-public-access-block --bucket "$STATE_BUCKET" \
  --query 'PublicAccessBlockConfiguration' --output json                                     # all four true
```

Create the (gitignored) backend config for both roots:

```bash
cd infra/stacks/storefront-sync
for root in shared prod; do
  printf 'bucket = "%s"\nregion = "%s"\n' "$STATE_BUCKET" "$AWS_REGION" > "$root/backend.hcl"
done
cat prod/backend.hcl
```

Check: `prod/backend.hcl` shows your real bucket and region. `backend.hcl` is in the stack's `.gitignore`; never commit it. Keep the bucket: deleting it loses the state of this stack.

## Step 2: check for an existing GitHub OIDC provider

An AWS account can hold only one IAM OIDC provider per URL. If any other project in this account already uses GitHub Actions OIDC, creating it again fails with `EntityAlreadyExists`.

```bash
aws iam list-open-id-connect-providers --query 'OpenIDConnectProviderList[].Arn' --output text \
  | tr '\t' '\n' | rg 'token.actions.githubusercontent.com|oidc.vercel.com' || echo "none found"
```

Check, then branch:

- Output is `none found`: nothing to do, continue to step 3.
- `.../oidc-provider/token.actions.githubusercontent.com` is listed: import it after `terraform init` in step 3 (see "Import branch" there).
- `.../oidc-provider/oidc.vercel.com/<your-team-slug>` is listed (unlikely, a previous attempt): import it the same way into `aws_iam_openid_connect_provider.vercel`. A plain `.../oidc-provider/oidc.vercel.com` (Global issuer) is a different provider and does not conflict.

## Step 3: apply shared/, then prod/

Order matters: `prod/` looks both OIDC providers up by URL, so `shared/` must exist first. Follow the repo's apply workflow: `plan -out`, read the plan, then apply the saved plan. Expect these counts as a sanity check.

```bash
cd infra/stacks/storefront-sync/shared
printf 'aws_region       = "%s"\nvercel_team_slug = "%s"\n' "$AWS_REGION" "$VERCEL_TEAM_SLUG" > terraform.tfvars
terraform init -backend-config=backend.hcl
```

Import branch, only if step 2 found an existing GitHub provider:

```bash
terraform import aws_iam_openid_connect_provider.github \
  "arn:aws:iam::${ACCOUNT_ID}:oidc-provider/token.actions.githubusercontent.com"
```

Then:

```bash
terraform plan -out=plan.tfplan
terraform show plan.tfplan | less
```

Check the plan before applying:

- Fresh account: `Plan: 2 to add, 0 to change, 0 to destroy` (Vercel and GitHub providers).
- After the import: 1 to add (Vercel provider) and at most an in-place update of the GitHub provider. If the plan would remove a `client_id_list` entry another project relies on, stop: that project would lose access. Keep the existing entries in `shared/oidc.tf` before applying.

```bash
terraform apply plan.tfplan
terraform output
```

Check: both outputs `vercel_oidc_provider_arn` and `github_oidc_provider_arn` print ARNs.

Now `prod/`:

```bash
cd ../prod
printf 'aws_region          = "%s"\nvercel_team_slug    = "%s"\nvercel_project_name = "%s"\n' \
  "$AWS_REGION" "$VERCEL_TEAM_SLUG" "$VERCEL_PROJECT_NAME" > terraform.tfvars
terraform init -backend-config=backend.hcl
terraform plan -out=plan.tfplan
terraform show plan.tfplan | less
```

Check the plan: only creates, no destroys (2 queues plus 2 DLQs, 2 Lambdas with roles, policies, log groups and event source mappings, 4 SSM parameters, 2 IAM roles with policies). Names must be the `savepoint-prod-*` names from the table above. Defaults you can leave alone: `github_repository = "NeiruBugz/play-later-v2"`, `max_receive_count = 3`.

```bash
terraform apply plan.tfplan
terraform output
```

Check:

```bash
terraform output -raw gather_queue_url
terraform output -raw vercel_sqs_role_arn
terraform output -raw github_lambda_deploy_role_arn
terraform output -raw gather_function_name   # savepoint-prod-storefront-gather
terraform output -raw enrich_function_name   # savepoint-prod-storefront-enrich
aws lambda get-function --function-name "$(terraform output -raw gather_function_name)" \
  --query 'Configuration.[FunctionName,Runtime,Architectures[0],State]' --output text
```

Expect `... nodejs22.x arm64 Active`. The functions run the committed stub until the first `deploy-lambdas` run (spec 030, Slice 9) ships real code. The SSM parameters hold a placeholder value until step 4.

## Step 4: put the SSM secret values

Terraform created the four parameters with a placeholder and `ignore_changes = [value]`, so real values are set out of band and never enter Terraform state or the repo. Read each value with a silent prompt so it stays out of shell history.

| Parameter (under `/savepoint/prod/storefront-sync/`) | Where the value comes from |
|---|---|
| `POSTGRES_PRISMA_URL` | Neon pooled connection string, same one Vercel uses as `POSTGRES_PRISMA_URL` |
| `IGDB_CLIENT_ID` | Twitch developer console application |
| `IGDB_CLIENT_SECRET` | Same Twitch application |
| `STEAM_API_KEY` | <https://steamcommunity.com/dev/apikey> |

```bash
cd infra/stacks/storefront-sync/prod
export SSM_PREFIX=$(terraform output -raw ssm_parameter_prefix)   # /savepoint/prod/storefront-sync

for name in POSTGRES_PRISMA_URL IGDB_CLIENT_ID IGDB_CLIENT_SECRET STEAM_API_KEY; do
  printf '%s: ' "$name"; read -rs value; echo
  aws ssm put-parameter --name "${SSM_PREFIX}/${name}" --type SecureString \
    --value "$value" --overwrite --query Version --output text
  unset value
done
```

`--overwrite` is required because Terraform already created each parameter. Each call prints the new version (2 on the first run).

Check: a version above 1 means the placeholder was replaced. The value is not printed.

```bash
for name in POSTGRES_PRISMA_URL IGDB_CLIENT_ID IGDB_CLIENT_SECRET STEAM_API_KEY; do
  printf '%s version=' "$name"
  aws ssm get-parameter --name "${SSM_PREFIX}/${name}" --with-decryption --query Parameter.Version --output text
done
```

Any `version=1` means that parameter still holds the placeholder.

## Step 5: switch Vercel OIDC to Team issuer mode

The IAM provider in `shared/` trusts `https://oidc.vercel.com/<team-slug>` (Team issuer). Vercel signs tokens with that issuer only when the project is in Team mode; in Global mode the issuer is plain `https://oidc.vercel.com` and AWS rejects the token with "No OpenIDConnect provider found".

Dashboard (the only supported place for the toggle):

1. Open `https://vercel.com/<team-slug>/<project-name>/settings/security`.
2. Find "Secure Backend Access with OIDC Federation" and enable it if it is off.
3. Set "Issuer mode" to Team (`https://oidc.vercel.com/<team-slug>`), not Global.
4. Save, then redeploy Production so new tokens use the Team issuer.

Docs: <https://vercel.com/docs/oidc/aws> (if the labels differ, the docs page is authoritative).

Switching the mode changes the issuer for this project everywhere. This repo has no other Vercel-to-AWS OIDC role (S3 uses static keys), so nothing else breaks. If you add one later, point it at the Team issuer too.

Check (after the redeploy, from your machine):

```bash
vercel link --yes                                          # once; run from the repo root, Root Directory = savepoint-tanstack/
vercel env pull .env.oidc-check --environment=development --yes
TOKEN=$(rg -r '$1' '^VERCEL_OIDC_TOKEN="?([^"]+)"?$' .env.oidc-check)
echo "$TOKEN" | cut -d. -f2 | tr '_-' '/+' | base64 -d 2>/dev/null | jq '{iss, aud, sub}'
rm -f .env.oidc-check
```

Expect `iss = https://oidc.vercel.com/<team-slug>` and `aud = https://vercel.com/<team-slug>`. `iss = https://oidc.vercel.com` means Global mode is still on. (The decode may print a trailing base64 padding warning; the JSON is still valid.)

## Step 6: set the Vercel env vars

Production environment only. Preview and Development must not get `STOREFRONT_SYNC_QUEUE=sqs`, so Preview shows sync as unavailable instead of failing against AWS.

| Variable | Value | Source |
|---|---|---|
| `STOREFRONT_SYNC_QUEUE` | `sqs` | literal |
| `STEAM_SYNC_GATHER_QUEUE_URL` | gather queue URL | `terraform output -raw gather_queue_url` |
| `AWS_SYNC_ROLE_ARN` | Vercel SQS role ARN | `terraform output -raw vercel_sqs_role_arn` |
| `AWS_REGION` | the stack region | `terraform output -raw aws_region` (must equal the existing value) |

```bash
cd infra/stacks/storefront-sync/prod
vercel env ls production | rg 'AWS_REGION|STOREFRONT_SYNC|STEAM_SYNC|AWS_SYNC'
```

If `AWS_REGION` already exists on Production, leave it as is and compare it to `terraform output -raw aws_region`; they must match. `vercel env add` fails on an existing name; replace it with `vercel env rm NAME production --yes` first.

```bash
cd ../../../..                                    # repo root, where `vercel link` ran
STACK=infra/stacks/storefront-sync/prod
printf '%s' sqs | vercel env add STOREFRONT_SYNC_QUEUE production
terraform -chdir="$STACK" output -raw gather_queue_url     | vercel env add STEAM_SYNC_GATHER_QUEUE_URL production
terraform -chdir="$STACK" output -raw vercel_sqs_role_arn  | vercel env add AWS_SYNC_ROLE_ARN production
# only if AWS_REGION is not set on Production yet:
terraform -chdir="$STACK" output -raw aws_region           | vercel env add AWS_REGION production
```

Then redeploy Production (dashboard: Deployments, latest, Redeploy; or `vercel deploy --prod`). Environment variables apply only to new deployments.

Check: `vercel env ls production` lists all four names. Do not paste values into chat or PRs; the queue URL and role ARN are not secret but there is no reason to spread them.

The app reads these through `savepoint-tanstack/env.ts` (added by spec 030, Slices 3 and 6). If a variable named here is missing from `env.ts`, the app is out of date with this runbook; do not deploy until it matches.

## Step 7: link GitHub to AWS (environment and variables)

Goal: the `deploy-lambdas` job in `.github/workflows/deploy.yml` can assume `savepoint-prod-github-lambda-deploy` with no stored keys.

Part A, the environment. The `production` environment must exist, with exactly that name (the AWS trust policy matches `environment:production`). The existing `migrate` job already uses it, so it most likely exists:

```bash
gh api "repos/${GH_REPO}/environments/production" --jq '.name' || echo "missing"
```

If it prints `missing`, create it (do not run this when it exists; an empty PUT can overwrite protection rules):

```bash
gh api -X PUT "repos/${GH_REPO}/environments/production"
```

Console equivalent: GitHub repo, Settings, Environments, New environment, name `production`. Optional hardening in the same screen: "Deployment branches and tags" limited to `main`, so only `main` can assume the AWS role.

Part B, the variables. Set the four variables. They are repository variables, not environment variables, on purpose: a job-level `if:` cannot read environment-scoped variables, and `deploy-lambdas` skips cleanly when `vars.AWS_LAMBDA_DEPLOY_ROLE_ARN` is unset. They are not secret (an ARN and names). This is the contract the `deploy-lambdas` job (Slice 9) uses:

| Variable | Value | Source |
|---|---|---|
| `AWS_LAMBDA_DEPLOY_ROLE_ARN` | deploy role ARN | `terraform output -raw github_lambda_deploy_role_arn` |
| `AWS_REGION` | stack region | `terraform output -raw aws_region` |
| `STEAM_SYNC_GATHER_FUNCTION` | `savepoint-prod-storefront-gather` | `terraform output -raw gather_function_name` |
| `STEAM_SYNC_ENRICH_FUNCTION` | `savepoint-prod-storefront-enrich` | `terraform output -raw enrich_function_name` |

```bash
STACK=infra/stacks/storefront-sync/prod
gh variable set AWS_LAMBDA_DEPLOY_ROLE_ARN --repo "$GH_REPO" --body "$(terraform -chdir=$STACK output -raw github_lambda_deploy_role_arn)"
gh variable set AWS_REGION                 --repo "$GH_REPO" --body "$(terraform -chdir=$STACK output -raw aws_region)"
gh variable set STEAM_SYNC_GATHER_FUNCTION --repo "$GH_REPO" --body "$(terraform -chdir=$STACK output -raw gather_function_name)"
gh variable set STEAM_SYNC_ENRICH_FUNCTION --repo "$GH_REPO" --body "$(terraform -chdir=$STACK output -raw enrich_function_name)"
```

Check:

```bash
gh variable list --repo "$GH_REPO"
```

Expect the four names with the values from the table. No AWS secret (`AWS_ACCESS_KEY_ID` and the like) is needed or should be added: the role is assumed through OIDC.

How the workflow uses it (for reference): the `deploy-lambdas` job (runs on `main` only, after `migrate`) declares `environment: production` and `permissions: { id-token: write, contents: read }`, then `aws-actions/configure-aws-credentials` with `role-to-assume: ${{ vars.AWS_LAMBDA_DEPLOY_ROLE_ARN }}` and `aws-region: ${{ vars.AWS_REGION }}`, then `aws lambda update-function-code` on `vars.STEAM_SYNC_GATHER_FUNCTION` and `vars.STEAM_SYNC_ENRICH_FUNCTION`. If you only set the variables as environment-scoped (`--env production`), the steps still work but the job-level skip condition does not.

## Step 8: smoke-test OIDC

Two links, two tests. Both are cheap and change nothing.

### Vercel to AWS

The trust policy accepts only `sub = owner:<team>:project:<project>:environment:production`. A token pulled to your machine (or issued to a Preview deployment) carries `environment:development` or `environment:preview`, so it must be denied. The error type tells you which part of the setup is right:

```bash
cd infra/stacks/storefront-sync/prod
ROLE_ARN=$(terraform output -raw vercel_sqs_role_arn)
cd ../../../..
vercel env pull .env.oidc-check --environment=development --yes
TOKEN=$(rg -r '$1' '^VERCEL_OIDC_TOKEN="?([^"]+)"?$' .env.oidc-check); rm -f .env.oidc-check
aws sts assume-role-with-web-identity --role-arn "$ROLE_ARN" --role-session-name oidc-smoke \
  --web-identity-token "$TOKEN" --query 'Credentials.AccessKeyId' --output text
```

| Result | Meaning |
|---|---|
| `AccessDenied ... Not authorized to perform sts:AssumeRoleWithWebIdentity` | Expected for a non-production token. Provider, issuer and audience are correct; only the `sub` is rejected, which proves the production-only scoping. |
| `InvalidIdentityToken: No OpenIDConnect provider found in your account for https://oidc.vercel.com...` | Issuer mode still Global (step 5) or the provider in `shared/` was not applied. |
| `InvalidIdentityToken: Incorrect token audience` | `vercel_team_slug` in `shared/` or `prod/` does not match the real team slug. |
| Credentials returned | The trust policy is too broad. Stop and review `prod/iam.tf`. |

The positive test needs a Production runtime. After the Production redeploy of step 6, trigger one sync in the app (spec 030 owner rollout) and confirm the assume succeeded in CloudTrail and the message reached the queue:

```bash
aws cloudtrail lookup-events --region "$AWS_REGION" \
  --lookup-attributes AttributeKey=EventName,AttributeValue=AssumeRoleWithWebIdentity \
  --max-results 5 \
  --query 'Events[].{time:EventTime,user:Username,event:CloudTrailEvent}' --output json \
  | jq -r '.[] | [.time, (.event | fromjson | .requestParameters.roleArn, (.errorCode // "ok"))] | @tsv'
```

Expect a recent row for `savepoint-prod-vercel-sqs-send` with `ok`. CloudTrail can lag a few minutes. In the app, the sync moves out of "Queued"; in AWS, the gather Lambda log group `/aws/lambda/savepoint-prod-storefront-gather` shows an invocation (the stub logs until real code ships).

### GitHub to AWS

Use a throwaway workflow on a throwaway branch (the real `deploy-lambdas` job is the permanent version of this check; use this to verify the link before relying on it). Do not merge this file.

```bash
git switch -c chore/oidc-smoke
mkdir -p .github/workflows
cat > .github/workflows/oidc-smoke.yml <<'YAML'
name: OIDC smoke
on:
  push:
    branches: [chore/oidc-smoke]
jobs:
  with-environment:
    runs-on: ubuntu-latest
    environment: production
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ vars.AWS_LAMBDA_DEPLOY_ROLE_ARN }}
          aws-region: ${{ vars.AWS_REGION }}
      - run: aws sts get-caller-identity
      - run: aws lambda get-function --function-name "${{ vars.STEAM_SYNC_GATHER_FUNCTION }}" --query 'Configuration.FunctionName'
  without-environment:
    runs-on: ubuntu-latest
    continue-on-error: true
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ vars.AWS_LAMBDA_DEPLOY_ROLE_ARN }}
          aws-region: ${{ vars.AWS_REGION }}
YAML
git add .github/workflows/oidc-smoke.yml && git commit -m "chore: temporary oidc smoke workflow" && git push -u origin chore/oidc-smoke
gh run watch --repo "$GH_REPO" $(gh run list --repo "$GH_REPO" --workflow oidc-smoke.yml --limit 1 --json databaseId --jq '.[0].databaseId')
```

(The `@v4` tag is acceptable for this throwaway file only; the real workflow pins the action.)

Check:

- `with-environment` succeeds and `aws sts get-caller-identity` prints `"Arn": "arn:aws:sts::<account-id>:assumed-role/savepoint-prod-github-lambda-deploy/GitHubActions"`, and the `get-function` call prints the gather function name.
- `without-environment` fails with `Not authorized to perform sts:AssumeRoleWithWebIdentity`. That is the proof that only the `production` environment can deploy.
- If `with-environment` waits on approval, or is rejected by the environment's branch rule, adjust the environment's protection for `chore/oidc-smoke` for the test (or approve it).

Clean up:

```bash
git switch -
git push origin --delete chore/oidc-smoke && git branch -D chore/oidc-smoke
```

## Step 9: roll back

Pick the smallest rollback that fixes the problem. Each level leaves the previous ones intact.

### Level 1: stop new syncs, keep infra

Remove the Production queue switch so the app stops sending messages, then redeploy Production:

```bash
vercel env rm STOREFRONT_SYNC_QUEUE production --yes
vercel env rm STEAM_SYNC_GATHER_QUEUE_URL production --yes
vercel deploy --prod
```

The app then behaves like Preview: sync is shown as unavailable. If the Vercel deployment itself is bad, use the Root-Directory/promote rollback in `docs/cutover-rollback.md`.

### Level 2: stop the Lambdas and drain the queues

```bash
cd infra/stacks/storefront-sync/prod
for stage in gather enrich; do
  FUNCTION="savepoint-prod-storefront-${stage}"
  UUID=$(aws lambda list-event-source-mappings --function-name "$FUNCTION" --query 'EventSourceMappings[0].UUID' --output text)
  aws lambda update-event-source-mapping --uuid "$UUID" --no-enabled --query State --output text
done
aws sqs purge-queue --queue-url "$(terraform output -raw gather_queue_url)"
aws sqs purge-queue --queue-url "$(terraform output -raw enrich_queue_url)"
```

Check: each mapping reports `Disabling`/`Disabled`. Purge is rate-limited to once per minute per queue. Running `ImportJob` rows stay in a non-terminal status until the app's own recovery handles them; mark them failed by hand if needed. To resume, re-enable with `--enabled`, or run `terraform apply` in `prod/` (which restores `enabled = true` and shows the disable as drift).

### Level 3: stop shipping Lambda code

Delete the four repo variables; `deploy-lambdas` then skips cleanly:

```bash
for name in AWS_LAMBDA_DEPLOY_ROLE_ARN AWS_REGION STEAM_SYNC_GATHER_FUNCTION STEAM_SYNC_ENRICH_FUNCTION; do
  gh variable delete "$name" --repo "$GH_REPO"
done
```

### Level 4: remove the stack

Order: `prod/` first, then `shared/`, bucket last. Destroying `prod/` deletes the SSM parameters, so their values are gone (re-enter them from the original sources on a rebuild).

```bash
cd infra/stacks/storefront-sync/prod && terraform destroy
cd ../shared
# If you imported a GitHub provider that other projects use, take it out of state first so destroy keeps it:
terraform state rm aws_iam_openid_connect_provider.github
terraform destroy
```

The state bucket is versioned; deleting it requires removing all object versions first, so only do that when you are sure the stack is gone for good.

## Secret rotation checklist

Nothing in this stack stores a long-lived AWS key: GitHub and Vercel reach AWS through OIDC, so there is no AWS credential to rotate. What rotates is the four Lambda secrets and the database password, and each lives in more than one place.

Lambdas may keep a warm environment for a while after SSM changes. After any SSM rotation, force new execution environments by running the "Deploy to Production" workflow manually on `main` (`gh workflow run deploy.yml --repo "$GH_REPO" --ref main`, or Actions, Deploy to Production, Run workflow). The `deploy-lambdas` job calls `update-function-code`, which recycles the Lambda environments; the `migrate` job in the same run is a no-op when no migration is pending. Then run one sync. The workflow only runs on `main`; a dispatch from another branch skips both jobs.

| Secret | Update in (all of them) | Then |
|---|---|---|
| `STEAM_API_KEY` | SSM `/savepoint/prod/storefront-sync/STEAM_API_KEY`; Vercel `STEAM_API_KEY` (Production, and Development/Preview if set); local `savepoint-tanstack/.env` | Recycle Lambdas, run one sync |
| `IGDB_CLIENT_ID`, `IGDB_CLIENT_SECRET` (rotate together) | SSM both parameters; Vercel `IGDB_CLIENT_ID` and `IGDB_CLIENT_SECRET`; local `.env` | Recycle Lambdas, run one sync |
| Neon password (`POSTGRES_PRISMA_URL`) | Neon console first; then SSM `POSTGRES_PRISMA_URL`; Vercel `POSTGRES_PRISMA_URL` and `POSTGRES_URL_NON_POOLING`; GitHub environment secrets `POSTGRES_PRISMA_URL` and `POSTGRES_URL_NON_POOLING` (used by `deploy.yml` migrations); local `.env` | Redeploy Vercel Production, recycle Lambdas, run one sync, check DLQs |
| OIDC trust (nothing to rotate) | Only on renames: repo, `production` environment, Vercel team slug or project name | Update `prod/` and `shared/` vars, re-apply, rerun step 8 |

Put new values with the loop in step 4 (`--overwrite`), and check each with the version query there; the version must increase. After rotating, confirm both DLQs are empty:

```bash
cd infra/stacks/storefront-sync/prod
for url in $(terraform output -json dead_letter_queue_urls | jq -r '.[]'); do
  aws sqs get-queue-attributes --queue-url "$url" \
    --attribute-names ApproximateNumberOfMessages --query 'Attributes.ApproximateNumberOfMessages' --output text
done
```

Expect `0` for both.

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| `terraform init`: `Error: Unsupported Terraform Core version` | Not `1.14.6`; install exactly that version. |
| `terraform init`: access denied or `NoSuchBucket` | Wrong `backend.hcl` bucket/region, or the profile lacks `s3:GetObject`, `PutObject`, `DeleteObject`, `ListBucket` on the state bucket (locking writes `<key>.tflock`). |
| `Error acquiring the state lock` | A previous run died. Check nobody else is running Terraform, then `terraform force-unlock <lock-id>`. |
| `shared/` apply: `EntityAlreadyExists` for the GitHub provider | Skipped step 2; import it, then re-plan. |
| `prod/` plan: `no matching IAM OIDC Provider found` | `shared/` not applied, or `vercel_team_slug` differs between `shared/` and `prod/`. |
| Lambda invocation shows stub output after deploy | `deploy-lambdas` has not run yet (needs the merge to `main`), or its variables from step 7 are unset so it skipped. |
| `deploy-lambdas`: `Not authorized to perform sts:AssumeRoleWithWebIdentity` | The job lacks `environment: production` or `id-token: write`, or the repo or environment was renamed. |
| Vercel: `AccessDenied` on assume | Project not in Team issuer mode, project name in `prod/terraform.tfvars` differs from the real one, or the call came from Preview/Development. |
| Lambda: `ParameterNotFound` or `AccessDeniedException` on SSM | Step 4 not done, or `SSM_PARAM_PREFIX` differs from `terraform output ssm_parameter_prefix`. |
| A Lambda fails and the message lands in a DLQ after 3 receives | Read the DLQ message and the function's CloudWatch log group (`/aws/lambda/savepoint-prod-storefront-<stage>`, 7-day retention); fix, then redrive from the SQS console. |
