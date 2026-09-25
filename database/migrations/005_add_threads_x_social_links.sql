alter table organization_settings
  add column threads_url varchar(500) null after linkedin_url,
  add column x_url varchar(500) null after threads_url;
