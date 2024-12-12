import logging
from sqlalchemy.orm import Session
from sqlalchemy.sql.functions import current_time

from app.exceptions import JobNotFoundError, ScrapeFailedError
from app.services.linkedin_scraper import get_job_description, scrape_jobs
from app.repositories.job_repository import JobRepository
from app.utils import is_job_exist


def get_new_jobs(db: Session):
    scraped_jobs = scrape_jobs()

    existing_jobs = JobRepository.get_all_jobs(db)

    if not scrape_jobs:
        logging.warning("No Job Scrapped!")
        return {"count": 0, "new_jobs": []}

    new_jobs = [job for job in scraped_jobs if not is_job_exist(job, existing_jobs)]

    new_jobs.sort(key=lambda x: x.get("date", current_time), reverse=True)

    new_jobs = JobRepository.create_jobs(db, new_jobs)

    return {"count": len(new_jobs), "new_jobs": new_jobs}


def scrape_job_description(job_id: str, db: Session):
    job = JobRepository.get_job(db, job_id)

    if not job:
        raise JobNotFoundError("Job not found")

    job_description = get_job_description(job.job_url)

    if not job_description:
        raise ScrapeFailedError("Scrape failed")

    return job_description
