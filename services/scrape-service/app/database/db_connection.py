from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError
from config import settings
import logging

from .models import Base

engine = create_engine(settings.DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    try:
        logging.info("Initializing the database...")
        Base.metadata.create_all(bind=engine)

        logging.info("Database initialized successfully")

    except SQLAlchemyError as e:
        logging.error(f"An error occurred while initializing he database: {str(e)}")
        raise

    except Exception as e:
        logging.critical(f"Unexcept error: {str(e)}", exc_info=True)
        raise
