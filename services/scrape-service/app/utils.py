def is_job_exist(job, exist_jobs):
    return not any(
        exist_job["title"] == job["title"]
        and exist_job["company"] == job["company"]
        and exist_job["date"] == job["date"]
        for exist_job in exist_jobs
    )
