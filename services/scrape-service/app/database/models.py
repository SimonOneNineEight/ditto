from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Date,
    Boolean,
    event,
)
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime, UTC

from sqlalchemy.orm import relationship

Base = declarative_base()


class Job(Base):
    __tablename__ = "jobs"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    company = Column(String, index=True)
    location = Column(String, index=True)
    job_posting_id = Column(String, index=True)
    job_url = Column(String)
    date = Column(DateTime, index=True)
    is_applied = Column(Boolean)
    apply_status = Column(String)
    is_offered = Column(Boolean)
    created_at = Column(DateTime(timezone=True))
    updated_at = Column(DateTime(timezone=True))

    job_description = relationship(
        "JobDescription",
        back_populates="job",
        uselist=False,
        cascade="all, delete-orphan",
    )


class JobDescription(Base):
    __tablename__ = "job_descriptions"
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(
        Integer,
        ForeignKey("jobs.id"),
        unique=True,
        index=True,
    )
    job_description = Column(String)

    job = relationship("Job", back_populates="job_description")


@event.listens_for(Job, "before_insert")
def set_created_at(mapper, connection, target):
    target.created_at = datetime.now(UTC)
    target.updated_at = datetime.now(UTC)
    target.apply_status = "not_applied"


@event.listens_for(Job, "before_update")
def set_updated_at(mapper, connection, target):
    target.updated_at = datetime.now(UTC)
