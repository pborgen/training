resource "aws_secretsmanager_secret" "postgres_url" {
  name_prefix = "${var.app_name}/postgres-url-"
  description = "POSTGRES_URL for the training app"
}

resource "aws_secretsmanager_secret_version" "postgres_url" {
  secret_id     = aws_secretsmanager_secret.postgres_url.id
  secret_string = local.postgres_url
}

# Note: the RAG coach calls Claude via AWS Bedrock (IAM-authenticated through the
# instance role), so no Anthropic API key secret is needed.
