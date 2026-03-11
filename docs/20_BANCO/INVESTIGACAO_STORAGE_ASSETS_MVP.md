# Investigacao de Storage dos Assets do MVP

Data de referencia: 11 de marco de 2026

## Sintoma atual

Na tela `/assets`, a abertura de asset retornou:

- `404 Bucket not found`

## Leitura honesta

Esse erro nao aponta para problema de React.

Ele aponta para um destes cenarios:

1. o bucket esperado nao existe no Supabase Storage
2. o `public_url` salvo em `pulso_content.audios` aponta para bucket errado
3. o `storage_path` foi salvo num formato que nao bate com o bucket real

## SQL de investigacao

Rodar:

- `database/sql/investigacao/20260311_validar_storage_assets_runtime.sql`

## O que eu preciso ver no retorno

### 1. Buckets existentes

Quais buckets existem hoje em `storage.buckets`.

### 2. Buckets esperados

Se pelo menos `audios` existe e esta `public = true`.

### 3. Amostra da tabela `pulso_content.audios`

Quero ver:

- `storage_path`
- `public_url`
- `status`

### 4. Bucket inferido

Se os audios apontam para:

- `audios`
- ou algum nome diferente

## Decisao depois da investigacao

### Se o bucket `audios` nao existir

O proximo passo e criar a migration limpa dos buckets do MVP.

### Se o bucket existir, mas o `public_url` estiver errado

O proximo passo e corrigir os dados salvos ou a regra de geracao de URL.

### Se o bucket existir e o URL estiver certo, mas ainda falhar

O proximo passo e revisar politicas/publicidade do bucket.
