# infra — AWS deployment (App Runner + RDS)

Deploys the Python `apps/api` backend (FastAPI + the built React client) to AWS:

```
ECR  ──image──▶  App Runner  ──VPC connector──▶  RDS Postgres (private)
                     │
                     └── instance role ──▶  Bedrock (Claude Sonnet 4, RAG coach)
                     └── instance role ──▶  Secrets Manager (POSTGRES_URL)
```

- **Compute:** App Runner pulls the image from ECR and auto-redeploys on each push.
- **DB:** RDS Postgres 16 (`db.t4g.micro`), private — only the App Runner VPC
  connector can reach it. Tables auto-create + seed on first boot.
- **RAG coach:** Claude on Bedrock, authenticated by the App Runner **instance role**
  (no API key). The image serves both the API and the SPA on port 8080.

## Prerequisites (one-time)

1. AWS credentials with admin-ish rights (`aws sts get-caller-identity` works).
2. **Enable Bedrock model access** for the Anthropic models in your region:
   Bedrock console → *Model access* → enable Claude 3.5 Haiku (the default RAG
   model; enable Sonnet too if you override `rag_model_id`). Without this the RAG
   coach gets `AccessDenied` even though the IAM policy is correct.
3. Docker running locally (the image builds `linux/amd64`).

## Deploy

```bash
cd infra
cp terraform.tfvars.example terraform.tfvars   # edit: google_client_id (optional)
./deploy.sh
```

`deploy.sh` will:
1. `terraform init` + create the ECR repo,
2. build `apps/api/Dockerfile` (`linux/amd64`) and push it,
3. `terraform apply` the full stack (RDS, secrets, IAM, App Runner),
4. print the public `app_url`.

Subsequent deploys: just re-run `./deploy.sh` — it rebuilds/pushes and App Runner
auto-redeploys. To redeploy without infra changes you can also just push a new
`:latest` image.

## Config

Set in `terraform.tfvars`:

- `google_client_id` — enable Google OAuth (blank disables it).
- `allow_dev_auth_headers` — keep `"false"` in prod (the `x-user-email` bypass).
- `db_password` — leave blank to auto-generate.
- sizing: `apprunner_cpu` / `apprunner_memory`, `db_instance_class`.

## Outputs

- `app_url` — public HTTPS URL of the service.
- `rds_endpoint` — private DB host.
- `db_password` — generated master password (`terraform output -raw db_password`).

## Notes

- The RAG knowledge base seeds via the admin endpoint `POST /api/rag/seed` (run it
  once after first deploy, signed in as an admin), or it stays empty until then.
- The old Node/Express path (root `Dockerfile`, `apps/web/vercel.json`) is unused
  by this stack and can be removed once you're happy with App Runner.
