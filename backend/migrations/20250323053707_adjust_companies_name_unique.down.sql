-- Add down migration script here
ALTER TABLE companies
DROP CONSTRAINT companies_name_unique;
