resource "aws_db_subnet_group" "rds_subnet_group" {
  name       = "${var.db_name}-subnet-group"
  subnet_ids = var.subnet_ids

  tags = {
    Name = "${var.db_name}-subnet-group"
  }
}

resource "aws_db_instance" "rds" {
  allocated_storage      = var.db_allocated_storage
  engine                 = "postgres"
  engine_version         = "16.1" 
  instance_class         = var.db_instance_class
  username               = var.db_user
  password               = var.db_password
  publicly_accessible    = false
  db_subnet_group_name   = aws_db_subnet_group.rds_subnet_group.name
  vpc_security_group_ids = [var.security_group_id]
  multi_az               = false
  backup_retention_period = 7
  storage_encrypted      = true

  tags = {
    Name = "${var.db_name}-rds"
    Environment = var.environment
  }
}
