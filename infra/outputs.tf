output "app_url" {
  description = "Public HTTPS URL of the App Runner service"
  value       = "https://${aws_apprunner_service.main.service_url}"
}

output "ecr_repository_url" {
  description = "ECR repository to push the Docker image to"
  value       = aws_ecr_repository.web.repository_url
}

output "rds_endpoint" {
  description = "RDS Postgres endpoint (private)"
  value       = aws_db_instance.main.address
}

output "db_password" {
  description = "Generated DB master password (empty if you supplied one)"
  value       = var.db_password == "" ? random_password.db[0].result : "(provided via tfvars)"
  sensitive   = true
}
