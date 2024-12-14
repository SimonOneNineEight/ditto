-- CreateTable
CREATE TABLE "alembic_version" (
    "version_num" VARCHAR(32) NOT NULL,

    CONSTRAINT "alembic_version_pkc" PRIMARY KEY ("version_num")
);

-- CreateTable
CREATE TABLE "job_descriptions" (
    "id" SERIAL NOT NULL,
    "job_id" INTEGER,
    "job_description" VARCHAR(255),
    "created_at" TIMESTAMP(6),
    "updated_at" TIMESTAMP(6),

    CONSTRAINT "job_descriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255),
    "company" VARCHAR(255),
    "location" VARCHAR(255),
    "job_posting_id" VARCHAR(255),
    "job_url" VARCHAR(255),
    "date" TIMESTAMP(6),
    "is_applied" BOOLEAN,
    "apply_status" VARCHAR(255),
    "is_offered" BOOLEAN,
    "created_at" TIMESTAMP(6),
    "updated_at" TIMESTAMP(6),

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ix_job_descriptions_job_id" ON "job_descriptions"("job_id");

-- CreateIndex
CREATE INDEX "ix_job_descriptions_id" ON "job_descriptions"("id");

-- CreateIndex
CREATE INDEX "ix_jobs_company" ON "jobs"("company");

-- CreateIndex
CREATE INDEX "ix_jobs_date" ON "jobs"("date");

-- CreateIndex
CREATE INDEX "ix_jobs_id" ON "jobs"("id");

-- CreateIndex
CREATE INDEX "ix_jobs_job_posting_id" ON "jobs"("job_posting_id");

-- CreateIndex
CREATE INDEX "ix_jobs_location" ON "jobs"("location");

-- CreateIndex
CREATE INDEX "ix_jobs_title" ON "jobs"("title");

-- AddForeignKey
ALTER TABLE "job_descriptions" ADD CONSTRAINT "job_descriptions_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
