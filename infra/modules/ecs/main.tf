# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = var.cluster_name
}

resource "aws_ecs_task_definition" "tasks" {
  for_each = var.services

  family                   = each.key
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = var.task_execution_role_arn
  task_role_arn            = var.task_role_arn

  container_definitions = jsonencode([
    {
      name      = each.value.name
      image     = each.value.image
      cpu       = 256
      memory    = 512
      essential = true
      portMappings = [
        {
          containerPort = each.value.port
          hostPort      = each.value.port
          protocol      = "tcp"
        }
      ]
      environment = [
        for key, value in each.value.env_vars : { name = key, value = value }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = "/ecs/${each.key}" 
          awslogs-region        = var.aws_region    
          awslogs-stream-prefix = "ecs"            
        }
      }
    }
  ])
}

resource "aws_ecs_service" "services" {
  for_each               = var.services
  name                   = each.key
  cluster                = aws_ecs_cluster.main.id
  task_definition        = aws_ecs_task_definition.tasks[each.key].arn
  desired_count          = 1
  launch_type            = "FARGATE"

  network_configuration {
    subnets          = each.value.subnet_type == "public" ? var.public_subnets : var.private_subnets
    security_groups  = [each.value.subnet_type == "public" ? var.security_group_frontend : var.security_group_backend]
    assign_public_ip = each.value.subnet_type == "public"
  }

  depends_on = [aws_ecs_task_definition.tasks]
}

# ECR Repositories
resource "aws_ecr_repository" "backend" {
  name = "backend"
}

resource "aws_ecr_repository" "frontend" {
  name = "frontend"
}

resource "aws_ecr_repository" "scrape_service" {
  name = "scrape-service"
}

resource "aws_cloudwatch_log_group" "ecs_logs" {
  for_each = var.services

  name              = "/ecs/${each.key}" 
  retention_in_days = 7                  
}
