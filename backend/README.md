# <img src="https://img.pokemondb.net/sprites/scarlet-violet/normal/oddish.png" alt="Oddish" style="width:70px"> Oddish - Backend Server for Automated Job Application

## Project Overview

Oddish is the primary backend server for the **Automated Job Application** project, targeting recruiters. It allows users to manage job listings and descriptions, with functionality to scrape job details from an external microservice. The backend serves as the central hub for storing job data, processing job applications, and fetching job descriptions as needed.

Oddish integrates with a Python-based scraping microservice to automatically update job descriptions if they are missing from the database, ensuring that users have access to up-to-date job information.

## Features
- **Job Management**: Store, retrieve, and manage job data.
- **Automated Job Description Scraping**: Automatically scrape job list and job descriptions using a separate Python microservice when not available in the local database.
- **REST API**: Provides endpoints for interacting with job data and descriptions.
- **Error Handling**: Handles missing data and external API errors gracefully.

## Technology Stack
- **Spring Boot**: Backend framework for building the REST API.
- **WebClient**: For making non-blocking HTTP requests.
- **PostgreSQL**: The primary database for storing job and job description data.
- **Maven**: For dependency management and building the project.

## Prerequisites
- **Java 17** or higher
- **Maven** (optional, as the project includes the Maven Wrapper)
- **PostgreSQL** (or another preferred database)

## Installation and Setup

### Clone the Repository:
```bash
git clone https://github.com/your-repo/oddish.git
cd oddish
```

### Set Up Environment Variables:
Configure your database and external API in `application.properties` or `.env` file:

```properties
spring.datasource.url=YOUR_DATABASE_URL
spring.datasource.username=YOUR_DATABASE_USERNAME
spring.datasource.password=YOUR_DATABASE_PASSWORD
external.timburr.base.url=YOUR_EXTERNAL_API_URL
```

### Run the Application:
```bash
./mvnw spring-boot:run
```

### Database Migration (Optional):
If you'd like to use the provided database schema, you can add database migrations using **Flyway** or **Liquibase** to ensure the correct schema is applied. Alternatively, you can manually run SQL scripts to set up the database structure.

## API Endpoints

### 1. Get All Jobs
- **URL**: `/jobs`
- **Method**: `GET`
- **Response**: Returns a list of all jobs stored in the database.

#### Example Response:
```json
[
  {
    "id": 1,
    "title": "Software Engineer",
    "company": "Tech Co",
    "location": "Remote",
    "applied": true,
    "applyStatus": "Offered",
    "offered": true,
  },
  {
    "id": 2,
    "title": "Data Analyst",
    "company": "Analytics Inc",
    "location": "New York",
    "applied": true,
    "applyStatus": "Offered",
    "offered": true,
  }
]
```

### 2. Get Job Description by Job ID
- **URL**: `/jobs/description/{jobId}`
- **Method**: `GET`
- **Response**: Fetches the job description for the specified job ID. If the job description is not found in the database, the service will attempt to retrieve it via the Python-based scraping microservice.

#### Example Response:
```json
{
  "id": 1,
  "job_id": 2,
  "jobDescription": "This is a detailed job description for a software engineer."
}
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Let me know if you'd like further changes!