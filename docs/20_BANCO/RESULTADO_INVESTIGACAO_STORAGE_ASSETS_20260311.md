# Resultado da Investigacao de Storage dos Assets

Data de referencia: 11 de marco de 2026

## Veredito

O problema atual de `/assets` nao e falta de bucket.

O problema atual e dado salvo incorretamente em `pulso_content.audios`.

## O que foi confirmado

### Buckets

Existem no Supabase Storage:

- `audios`
- `videos`
- `thumbnails`

O unico bucket esperado que ainda nao existe e:

- `broll`

### Estado do bucket de audio

- `audios` existe
- `audios` esta `public = true`
- existem `5` objetos em `storage.objects` para esse bucket

### Problema real no runtime

Na tabela `pulso_content.audios`, a amostra retornou:

- `storage_path = 'undefined'`
- `public_url = https://.../storage/v1/object/public/undefined`

Tambem foi confirmado que o bucket inferido a partir de `storage_path` e `public_url` e:

- `undefined`

## Leitura tecnica

Isso significa que:

- o app estava tentando abrir uma URL invalida
- o erro `Bucket not found` vinha do valor salvo errado, nao da inexistencia do bucket `audios`

## Decisao

### O que ja foi corrigido no app

- a tela `/assets` agora nao deve mais tentar abrir link quando `storage_path/public_url` vierem como `undefined`
- o app passa a sinalizar `URL invalida no banco` em vez de quebrar silenciosamente

### O que ainda falta corrigir

- descobrir como o workflow ou seed gravou `storage_path/public_url` como `undefined`
- reparar os registros invalidos de `pulso_content.audios`
- opcionalmente criar o bucket `broll` quando essa parte do MVP entrar

## Proximo passo

1. retestar `/assets`
2. identificar a origem da gravacao invalida no workflow de audio
3. corrigir dados antigos ou limpar os registros de teste quebrados
