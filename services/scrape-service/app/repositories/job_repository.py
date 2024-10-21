from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database.models import Job, JobDescription
from app.database.schemas import JobCreate, JobDescriptionCreate


class JobRepository:
    @staticmethod
    def get_job(db: Session, job_id: str):
        return db.query(Job).filter(Job.id == job_id).first()

    @staticmethod
    def get_all_jobs(db: Session, skip: int = 0, limit: int = 100):
        return db.query(Job).offset(skip).limit(limit).all()

    @staticmethod
    def create_job(db: Session, job: JobCreate):
        db_job = Job(**job.model_dump())

        db.add(db_job)
        db.commit()
        db.refresh(db_job)

        return db_job

    @staticmethod
    def create_jobs(db: Session, jobs: list[JobCreate]):
        jobs_data = []
        for job in jobs:
            if isinstance(job, BaseModel):
                jobs_data.append(Job(**job.model_dump()))
            else:
                jobs_data.append(Job(**job))

        db.add_all(jobs_data)
        db.commit()
        # db.refresh(jobs_data)

        return jobs_data

    @staticmethod
    def get_all_job_posting_ids(db: Session):
        job_posting_ids = db.query(Job.job_posting_id).all()
        return job_posting_ids

    @staticmethod
    def create_job_description(db: Session, job_description: JobDescriptionCreate):
        db_job_description = JobDescription(**job_description.model_dump())

        db.add(db_job_description)
        db.commit()
        db.refresh(db_job_description)

        return db_job_description

    @staticmethod
    def get_job_description_by_id(db: Session, job_posting_id):
        return (
            db.query(JobDescription)
            .filter(JobDescription.job_posting_id == job_posting_id)
            .first()
        )
