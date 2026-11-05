ALTER TABLE admins ADD COLUMN active boolean NOT NULL DEFAULT true, ADD COLUMN role varchar(30) NOT NULL DEFAULT 'admin';
