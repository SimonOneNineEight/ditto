from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.router.job_router import router as job_router

from app.services.scheduler import start_scheduler

scheduler = start_scheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # init stage
    yield
    # shutdown stage
    scheduler.shutdown()


app = FastAPI(lifespan=lifespan)

app.include_router(job_router, prefix="/api")


@app.get("/")
async def root():
    return {"message": "Hello FastAPI"}
