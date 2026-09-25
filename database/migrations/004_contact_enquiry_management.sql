alter table contact_messages
  add column address varchar(500) null after name,
  add column city varchar(120) null after address,
  add column state varchar(120) null after city,
  add column postal_code varchar(20) null after state,
  add column status varchar(20) not null default 'new' after message,
  add column admin_notes text null after status,
  add column last_contacted_at datetime null after admin_notes,
  add column updated_at timestamp default current_timestamp on update current_timestamp after created_at;
create table if not exists contact_interactions(
  id bigint unsigned auto_increment primary key,
  contact_message_id bigint unsigned not null,
  interaction_type varchar(20) not null,
  note text not null,
  interaction_at datetime not null,
  created_at timestamp default current_timestamp,
  key contact_interactions_message_time(contact_message_id,interaction_at),
  constraint contact_interactions_message_fk foreign key(contact_message_id) references contact_messages(id) on delete restrict
) charset=utf8mb4;
