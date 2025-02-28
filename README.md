# Ditto: Your Job Application Assistant

Ditto is a web application designed to simplify and streamline the job application process. It helps you scrape job information from LinkedIn, manage your application statuses, and (in future updates) generate customized resumes and cover letters tailored to each job description using ChatGPT. With Ditto, you can reduce the repetitive work of tailoring your resume and focus on landing your dream job.

---

## 🚀 Features

### Implemented

- **Scrape Jobs from LinkedIn**
  - Use the scraping service to gather job listings directly from LinkedIn.
- **Manage Application Status**
  - Keep track of where you’ve applied, interview progress, and application outcomes.

### Coming Soon

- **Customized Resume and Cover Letter Suggestions**
  - Automatically generate tailored resumes and cover letters based on templates you provide and the job description.
- **Resume and Cover Letter Storage**
  - Save and manage customized resumes and cover letters for future applications.

---

## 🛠️ Tech Stack

### Frontend

- **Next.js** (React-based framework for server-rendered and static websites)
- **TypeScript** (Type-safe development)
- **Tailwind CSS** (Utility-first CSS framework for styling)

### Backend

- **Rust** (High-performance system programming language)
- **Axum** (Web framework for building APIs in Rust)
- **PostgreSQL** (Relational database for storing application and job data)

### Scraping Service

- **FastAPI** (Python-based web framework for building scraping services)
- **SQLAlchemy** (Python SQL toolkit and ORM)

### Deployment

- **Docker** (Containerization for consistent development and deployment)
- **AWS** (Cloud platform for scalable and secure hosting)

---

## 📦 Installation and Setup

1. **Clone the Repository**

   ```bash
   git clone https://github.com/your-username/ditto.git
   cd ditto
   ```

2. **Setup the Backend**

   - Navigate to the `backend/` directory.
   - Install dependencies:
     ```bash
     npm install
     ```
   - Set up your `.env` file with the required environment variables:
     ```
     DATABASE_URL=your_postgresql_url
     ```

3. **Setup the Frontend**

   - Navigate to the `frontend/` directory.
   - Install dependencies:
     ```bash
     npm install
     ```
   - Start the development server:
     ```bash
     npm run dev
     ```

4. **Setup the Scraping Service**

   - Navigate to the `scrape-service/` directory.
   - Create a Python virtual environment:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```
   - Install dependencies:
     ```bash
     pip install -r requirements.txt
     ```

5. **Run with Docker**

   - Set up your `.env` file with the required environment variables:

     ```
     # Database Credentials
     POSTGRES_USER=yout-postgresql-username
     POSTGRES_PASSWORD=your-postgresql-password
     POSTGRES_DB=yout-postgresql-db-name

     # Database URL
     DATABASE_URL=your-postgresql-url

     # Service URLs
     TIMBURR_URL=yout-scrape-service-url
     NEXT_PUBLIC_API_URL=your-backend-url
     ```

   - Build and start the application using Docker Compose:

   ```bash
   docker-compose up --build
   ```

---

## 📖 Usage

1. **Scrape Jobs from LinkedIn**

   - Enter LinkedIn search parameters into the scraping service to fetch job listings.

2. **Track Your Application Progress**

   - Use the application management tool to organize your job applications and stay on top of your progress.

3. **Future: Generate Tailored Resumes and Cover Letters**
   - Leverage ChatGPT to generate customized application materials (coming soon!).

---

## 🤝 Contributing

We welcome contributions to Ditto! To contribute:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Submit a pull request.

---

## 📜 License

Ditto is open source and available under the [MIT License](LICENSE).

---

## 🌟 Roadmap

- [x] Implement job scraping service
- [] Build application status management
- [] Add user specific job application tracking
- [ ] Add support for generating tailored resumes and cover letters
- [ ] Enable storage for customized application materials
- [ ] Improve UI/UX for seamless user experience

---

## 🛡️ Acknowledgments

Ditto leverages ChatGPT and modern web development tools to deliver a seamless experience. Special thanks to all the open-source libraries and frameworks used in this project.
