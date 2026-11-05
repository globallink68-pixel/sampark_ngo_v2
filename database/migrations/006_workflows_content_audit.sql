CREATE TABLE IF NOT EXISTS applications(
 id bigint unsigned AUTO_INCREMENT PRIMARY KEY,
 kind varchar(30) NOT NULL,
 name varchar(120) NOT NULL,
 email varchar(254) NOT NULL,
 mobile varchar(30),
 message text NOT NULL,
 consent_at timestamp NOT NULL DEFAULT current_timestamp,
 status varchar(20) NOT NULL DEFAULT 'new',
 created_at timestamp DEFAULT current_timestamp,
 updated_at timestamp DEFAULT current_timestamp ON UPDATE current_timestamp,
 KEY applications_status(kind,status,created_at)
) ENGINE=InnoDB CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS content_pages(
 slug varchar(100) PRIMARY KEY,
 kind varchar(20) NOT NULL DEFAULT 'page',
 title varchar(160) NOT NULL,
 body text NOT NULL,
 published boolean NOT NULL DEFAULT false,
 updated_at timestamp DEFAULT current_timestamp ON UPDATE current_timestamp
) ENGINE=InnoDB CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS audit_events(
 id bigint unsigned AUTO_INCREMENT PRIMARY KEY,
 admin_id bigint unsigned NOT NULL,
 action varchar(100) NOT NULL,
 resource varchar(255) NOT NULL,
 created_at timestamp DEFAULT current_timestamp,
 CONSTRAINT audit_admin_fk FOREIGN KEY(admin_id) REFERENCES admins(id) ON DELETE RESTRICT
) ENGINE=InnoDB CHARSET=utf8mb4;
