-- Add up migration script here
ALTER TABLE companies ADD CONSTRAINT companies_name_unique UNIQUE (name);
