output "cluster_name" {
  value = aws_ecs_cluster.main.name
}

output "service_names" {
  value = keys(aws_ecs_service.services)
}

output "backend_repo_url" {
  value = aws_ecr_repository.backend.repository_url
}

output "frontend_repo_url" {
  value = aws_ecr_repository.frontend.repository_url
}

output "scrape_service_repo_url" {
  value = aws_ecr_repository.scrape_service.repository_url
}


