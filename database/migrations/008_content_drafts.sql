CREATE TABLE IF NOT EXISTS content_drafts(
 slug varchar(100) PRIMARY KEY,
 kind varchar(20) NOT NULL,
 title varchar(160) NOT NULL,
 body text NOT NULL
) ENGINE=InnoDB CHARSET=utf8mb4;
