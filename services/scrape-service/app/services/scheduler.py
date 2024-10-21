from apscheduler.schedulers.background import BackgroundScheduler
from .job_services import get_new_jobs
from app.database.db_connection import get_db


def run_schedule_job():
    db = next(get_db())
    get_new_jobs(db)


def start_scheduler():
    scheduler = BackgroundScheduler()
    scheduler.add_job(run_schedule_job, "interval", hours=12)
    scheduler.start()
    return scheduler
