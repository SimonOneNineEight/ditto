variable "vpc_id" {
  description = "The VPC ID where security groups will be created"
  type        = string
}

variable "ecs_ports" {
  description = "List of ports for ECS services"
  type        = list(number)
}

variable "rds_port" {
  description = "Port for the RDS database"
  type        = number
}
