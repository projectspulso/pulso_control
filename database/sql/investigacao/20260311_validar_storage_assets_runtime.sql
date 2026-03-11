-- Validacao do storage usado pelo runtime de assets do MVP
-- Data de referencia: 11 de marco de 2026
-- Objetivo: descobrir se o problema e bucket ausente ou URL/path inconsistente

-- =====================================================
-- 1. BUCKETS EXISTENTES
-- =====================================================
select
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
from storage.buckets
order by name;

| id         | name       | public | file_size_limit | allowed_mime_types                     |
| ---------- | ---------- | ------ | --------------- | -------------------------------------- |
| audios     | audios     | true   | null            | null                                   |
| avatars    | avatars    | true   | 5242880         | ["image/png","image/jpg","image/webp"] |
| thumbnails | thumbnails | true   | 2097152         | ["image/png","image/jpg","image/webp"] |
| videos     | videos     | true   | null            | null                                   |

-- =====================================================
-- 2. BUCKETS ESPERADOS PELO MVP
-- =====================================================
with esperados(bucket_name) as (
  values
    ('audios'),
    ('videos'),
    ('thumbnails'),
    ('broll')
)
select
  e.bucket_name,
  case when b.id is null then 'MISSING' else 'OK' end as status,
  b.public
from esperados e
left join storage.buckets b
  on b.id = e.bucket_name
order by e.bucket_name;

| bucket_name | status  | public |
| ----------- | ------- | ------ |
| audios      | OK      | true   |
| broll       | MISSING | null   |
| thumbnails  | OK      | true   |
| videos      | OK      | true   |


-- =====================================================
-- 3. AMOSTRA DE AUDIOS DO RUNTIME
-- =====================================================
select
  id,
  storage_path,
  public_url,
  status,
  created_at
from pulso_content.audios
order by created_at desc
limit 20;

| id                                   | storage_path | public_url                                                                  | status | created_at                    |
| ------------------------------------ | ------------ | --------------------------------------------------------------------------- | ------ | ----------------------------- |
| b088ef28-157e-44f2-9467-ee150c6c09a0 | undefined    | https://nlcisbfdiokmipyihtuz.supabase.co/storage/v1/object/public/undefined | OK     | 2025-12-04 13:14:45.182379+00 |


-- =====================================================
-- 4. BUCKET INFERIDO A PARTIR DO storage_path
-- =====================================================
select distinct
  split_part(storage_path, '/', 1) as bucket_inferido_storage_path
from pulso_content.audios
where storage_path is not null
  and storage_path <> ''
order by 1;

| bucket_inferido_storage_path |
| ---------------------------- |
| undefined                    |

-- =====================================================
-- 5. BUCKET INFERIDO A PARTIR DO public_url
-- =====================================================
select distinct
  split_part(split_part(public_url, '/object/public/', 2), '/', 1) as bucket_inferido_public_url
from pulso_content.audios
where public_url is not null
  and public_url like '%/object/public/%'
order by 1;

| bucket_inferido_public_url |
| -------------------------- |
| undefined                  |

-- =====================================================
-- 6. CONTAGEM DE OBJETOS NO STORAGE
-- =====================================================
select
  bucket_id,
  count(*) as total_objetos
from storage.objects
group by bucket_id
order by bucket_id;

| bucket_id | total_objetos |
| --------- | ------------- |
| audios    | 5             |

mas acho que não temos nada de som real, somente teste mesmo