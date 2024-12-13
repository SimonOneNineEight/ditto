output "db_endpoint" {
  value = "postgresql://${var.db_user}:${var.db_password}@${aws_db_instance.rds.endpoint}:5432/${var.db_name}"
}

output "db_instance_identifier" {
  value = aws_db_instance.rds.id
}
