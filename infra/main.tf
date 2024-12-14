provider "aws" {
  region = "us-west-1" 
}

# VPC Module
module "vpc" {
  source = "./modules/vpc"
  project_name = var.project_name
  cidr_block = "10.0.0.0/16"
  availability_zones = var.availability_zones
  public_subnet_count = var.public_subnet_count
  private_subnet_count = var.private_subnet_count 

}

# Security Groups Module
module "security_groups" {
  source        = "./modules/security_groups"
  vpc_id        = module.vpc.vpc_id
  ecs_ports     = [8080, 8081, 8082]
  rds_port      = 5432
}

# IAM Module
module "iam" {
  source = "./modules/iam"
  cluster_name          = "ditto-cluster"
  vpc_id = module.vpc.vpc_id
}

# RDS Module
module "rds" {
  source              = "./modules/rds"
  environment         = "dev"
  vpc_id              = module.vpc.vpc_id
  subnet_ids          = module.vpc.private_subnets
  security_group_id   = module.security_groups.rds_security_group_id
  db_instance_class   = "db.t3.micro"
  db_allocated_storage = 20
  db_name             = var.db_name
  db_user             = var.db_user
  db_password         = var.db_password
}

# ECS Module
module "ecs" {
  source                = "./modules/ecs"
  cluster_name          = "ditto-cluster"
  public_subnets        = module.vpc.public_subnets
  private_subnets       = module.vpc.private_subnets
  vpc_id                = module.vpc.vpc_id

  security_group_id       = module.security_groups.ecs_security_group_id
  security_group_frontend = module.security_groups.frontend_security_group_id
  security_group_backend  = module.security_groups.backend_security_group_id
  task_execution_role_arn = module.iam.ecs_task_execution_role_arn
  task_role_arn           = module.iam.ecs_task_role_arn

  services = {
    frontend = {
      name       = "frontend"
      port       = 8080
      image      = module.ecs.frontend_repo_url
      env_vars   = { NEXT_PUBLIC_API_URL = var.next_public_api_url }
      subnet_type = "public"
    }
    backend = {
      name       = "backend"
      port       = 8081
      image      = module.ecs.backend_repo_url
      env_vars   = { DATABASE_URL = module.rds.db_endpoint }
      subnet_type = "private"
    }
    scrape-service = {
      name       = "scrape-service"
      port       = 8082
      image      = module.ecs.scrape_service_repo_url
      env_vars   = { DATABASE_URL = module.rds.db_endpoint }
      subnet_type = "private"
    }
  }
}
