variable "project_name" {
  description = "The name of the project for tagging resources"
  type        = string
}

variable "db_name" {
  description = "Name of the RDS database"
}

variable "db_user" {
  description = "Username for the RDS database"
}

variable "db_password" {
  description = "Password for the RDS database"
  sensitive   = true
}

variable "timburr_url" {
  description = "URL for Timburr service"
}

variable "next_public_api_url" {
  description = "API URL for the frontend"
}

variable "availability_zones" {
    description = "Subnet AZ"
}

variable "public_subnet_count" {
  description = "Number of public subnets"
  type        = number
  default     = 2
}

variable "private_subnet_count" {
  description = "Number of private subnets"
  type        = number
  default     = 2
}
