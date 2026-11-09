CREATE TABLE IF NOT EXISTS verified_certificates (
 id bigint unsigned AUTO_INCREMENT PRIMARY KEY,
 title varchar(160) NOT NULL,
 description text,
 image_path varchar(255),
 verified boolean NOT NULL DEFAULT false,
 active boolean NOT NULL DEFAULT false,
 public_visible boolean NOT NULL DEFAULT false,
 display_order int NOT NULL DEFAULT 0
) ENGINE=InnoDB CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS manual_donations (
 id bigint unsigned AUTO_INCREMENT PRIMARY KEY,
 title varchar(160) NOT NULL,
 bank_name varchar(120),
 account_holder varchar(160),
 account_number varchar(34),
 ifsc varchar(11),
 upi_id varchar(120),
 description text,
 image_path varchar(255),
 verified boolean NOT NULL DEFAULT false,
 active boolean NOT NULL DEFAULT false,
 public_visible boolean NOT NULL DEFAULT false,
 display_order int NOT NULL DEFAULT 0
) ENGINE=InnoDB CHARSET=utf8mb4;
