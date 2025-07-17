-- Drop everything in reverse order of dependencies

-- Drop event trigger and function
DROP EVENT TRIGGER IF EXISTS add_timestamp_trigger_event;
DROP FUNCTION IF EXISTS add_timestamp_trigger();

-- Drop triggers
DROP TRIGGER IF EXISTS update_job_from_scraped_jobs ON scraped_jobs;
DROP TRIGGER IF EXISTS update_job_from_user_jobs ON user_jobs;
DROP FUNCTION IF EXISTS update_parent_job_timestamp();

DROP TRIGGER IF EXISTS update_interviews_timestamp ON interviews;
DROP TRIGGER IF EXISTS update_applications_timestamp ON applications;
DROP TRIGGER IF EXISTS update_scraped_jobs_timestamp ON scraped_jobs;
DROP TRIGGER IF EXISTS update_user_jobs_timestamp ON user_jobs;
DROP TRIGGER IF EXISTS update_jobs_timestamp ON jobs;
DROP TRIGGER IF EXISTS update_application_status_timestamp ON application_status;
DROP TRIGGER IF EXISTS update_skills_timestamp ON skills;
DROP TRIGGER IF EXISTS update_skill_categories_timestamp ON skill_categories;
DROP TRIGGER IF EXISTS update_companies_timestamp ON companies;
DROP TRIGGER IF EXISTS update_users_auth_timestamp ON users_auth;
DROP TRIGGER IF EXISTS update_users_timestamp ON users;
DROP TRIGGER IF EXISTS update_roles_timestamp ON roles;

DROP FUNCTION IF EXISTS update_timestamp();

-- Drop indexes
DROP INDEX IF EXISTS idx_interviews_deleted_at;
DROP INDEX IF EXISTS idx_interviews_application_id;
DROP INDEX IF EXISTS idx_applications_deleted_at;
DROP INDEX IF EXISTS idx_applications_status_id;
DROP INDEX IF EXISTS idx_applications_job_id;
DROP INDEX IF EXISTS idx_applications_user_id;
DROP INDEX IF EXISTS idx_scraped_jobs_posting_id;
DROP INDEX IF EXISTS idx_scraped_jobs_job_id;
DROP INDEX IF EXISTS idx_user_jobs_job_id;
DROP INDEX IF EXISTS idx_user_jobs_user_id;
DROP INDEX IF EXISTS idx_jobs_deleted_at;
DROP INDEX IF EXISTS idx_jobs_source_type;
DROP INDEX IF EXISTS idx_jobs_company_id;
DROP INDEX IF EXISTS idx_companies_deleted_at;
DROP INDEX IF EXISTS idx_companies_name;
DROP INDEX IF EXISTS idx_users_auth_user_id;
DROP INDEX IF EXISTS idx_users_deleted_at;
DROP INDEX IF EXISTS idx_users_email;

-- Drop junction tables
DROP TABLE IF EXISTS user_skills;
DROP TABLE IF EXISTS job_skills;
DROP TABLE IF EXISTS user_roles;

-- Drop main tables (in dependency order)
DROP TABLE IF EXISTS interviews;
DROP TABLE IF EXISTS applications;
DROP TABLE IF EXISTS scraped_jobs;
DROP TABLE IF EXISTS user_jobs;
DROP TABLE IF EXISTS jobs;
DROP TABLE IF EXISTS application_status;
DROP TABLE IF EXISTS skills;
DROP TABLE IF EXISTS skill_categories;
DROP TABLE IF EXISTS companies;
DROP TABLE IF EXISTS users_auth;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;

-- Drop ENUM types
DROP TYPE IF EXISTS job_source_type;