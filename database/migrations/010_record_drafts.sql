ALTER TABLE members ADD COLUMN IF NOT EXISTS category varchar(80) NULL, ADD COLUMN IF NOT EXISTS public_visible boolean NOT NULL DEFAULT true;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS category varchar(80) NULL, ADD COLUMN IF NOT EXISTS public_visible boolean NOT NULL DEFAULT true;
ALTER TABLE gallery_items ADD COLUMN IF NOT EXISTS album varchar(80) NULL, ADD COLUMN IF NOT EXISTS public_visible boolean NOT NULL DEFAULT true;
CREATE TABLE IF NOT EXISTS record_drafts (
 id char(36) CHARACTER SET ascii PRIMARY KEY,
 collection varchar(16) NOT NULL,
 target_id bigint unsigned NULL,
 baseline char(64) CHARACTER SET ascii NULL,
 revision char(36) CHARACTER SET ascii NOT NULL,
 payload text NOT NULL,
 image MEDIUMBLOB NULL,
 updated_at timestamp DEFAULT current_timestamp ON UPDATE current_timestamp,
 KEY draft_collection (collection, updated_at)
) ENGINE=InnoDB;
