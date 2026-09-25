create table if not exists programs(
  id bigint unsigned auto_increment primary key,
  title varchar(160) not null,
  short_description varchar(500),
  description text,
  image_path varchar(500),
  location varchar(255),
  start_date date null,
  end_date date null,
  status varchar(50) not null default 'upcoming',
  display_order int not null default 0,
  active tinyint(1) not null default 1,
  created_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp on update current_timestamp,
  key programs_public_order(active,display_order,id)
) charset=utf8mb4;
