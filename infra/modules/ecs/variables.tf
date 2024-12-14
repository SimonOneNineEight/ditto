variable "cluster_name" {
  description = "Name of the ECS cluster"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID for ECS services"
  type        = string
}

variable "security_group_id" {
  description = "Security group for ECS services"
  type        = string
}

variable "services" {
  description = "List of service configurations"
  type = map(object({
    name     = string
    port     = number
    image    = string
    env_vars = map(string)
    subnet_type = string
  }))
}

variable "task_execution_role_arn" {
  description = "ARN of the task execution role for ECS"
  type        = string
}

variable "task_role_arn" {
  description = "ARN of the task role for ECS"
  type        = string
}

variable "public_subnets" {
  description = "List of public subnets for ECS services"
  type        = list(string)
}

variable "private_subnets" {
  description = "List of private subnets for ECS services"
  type        = list(string)
}

variable "security_group_frontend" {
  description = "Security group for frontend service"
  type        = string
}

variable "security_group_backend" {
  description = "Security group for backend services"
  type        = string
}

variable "aws_region" {
    description = "Aws region"
    default = "us-west-1"
}
