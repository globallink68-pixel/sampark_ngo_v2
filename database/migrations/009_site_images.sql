CREATE TABLE IF NOT EXISTS site_images (
 id char(36) CHARACTER SET ascii PRIMARY KEY,
 image MEDIUMBLOB NOT NULL,
 published boolean NOT NULL DEFAULT false
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS site_image_slots (
 slot varchar(16) PRIMARY KEY,
 draft_id char(36) CHARACTER SET ascii,
 public_id char(36) CHARACTER SET ascii,
 FOREIGN KEY (draft_id) REFERENCES site_images(id),
 FOREIGN KEY (public_id) REFERENCES site_images(id)
) ENGINE=InnoDB;
INSERT IGNORE INTO site_image_slots(slot) VALUES ('logo'),('favicon'),('hero');
