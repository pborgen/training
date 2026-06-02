# Use the account's default VPC + subnets to keep the footprint small.
data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# Security group for the App Runner VPC connector (egress side).
resource "aws_security_group" "apprunner" {
  name_prefix = "${var.app_name}-apprunner-"
  description = "App Runner VPC connector egress"
  vpc_id      = data.aws_vpc.default.id

  egress {
    description = "All egress"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Security group for RDS: only the App Runner connector may reach Postgres.
resource "aws_security_group" "rds" {
  name_prefix = "${var.app_name}-rds-"
  description = "Postgres access from App Runner only"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description     = "Postgres from App Runner connector"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.apprunner.id]
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_apprunner_vpc_connector" "main" {
  vpc_connector_name = "${var.app_name}-connector"
  subnets            = data.aws_subnets.default.ids
  security_groups    = [aws_security_group.apprunner.id]
}
