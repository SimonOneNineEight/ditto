-- Add down migration script here

ALTER TABLE users ADD COLUMN role UUID REFERENCES roles(id);
