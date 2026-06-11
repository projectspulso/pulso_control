-- Verificar IDs de canais e séries para usar nos seeds
SELECT id,
    nome
FROM pulso_core.canais
ORDER BY nome;
SELECT id,
    nome,
    canal_id
FROM pulso_core.series
ORDER BY nome;
| id | nome | canal_id | | ------------------------------------ | -------------------------- | ------------------------------------ |
| 4da81b35-16d4-4b40-bbf9-fd626f4c5c5e | Casos Reais & Bizarros | 490bb475-da7a-4768-bb66-2092116c084a | | cfaf54ad-54e6-409c-b999-57719d7162ef | Casos Reais Misteriosos | 257b5ac4-72ab-4d96-a2eb-031833a319a6 | | a3bcb03f-a3e3-489e-8cd1-e071ae97a804 | Ciência Estranha | c89417ab-ceb0-4a07-9eaf-9293219330e8 | | b18df4dd-b4e0-4319-a46c-5644637a9206 | Ciência Estranha | 91ea6bcf-2eda-413e-893c-1fc6b02ff902 | | 4fdfd9ef-c8ef-4779-b5c7-ef117c68b66f | Clássicos & Memórias | 558816a1-a2c2-4ef7-9948-2aa3f3958d0a | | 16c14047-6626-4f81-922b-db106e018f45 | Curiosidades Dark | 91ea6bcf-2eda-413e-893c-1fc6b02ff902 | | bafbe38f-1a2d-4c36-82c9-52ca8bb19eab | Curiosidades Dark | c89417ab-ceb0-4a07-9eaf-9293219330e8 | | 34e57364-a633-48d3-bed0-e3e1f66734f7 | Curiosidades Psicológicas | 91ea6bcf-2eda-413e-893c-1fc6b02ff902 | | 17c18d85-f018-4648-87e6-f742e7640f92 | Enigmas Históricos | 257b5ac4-72ab-4d96-a2eb-031833a319a6 | | 598b1c65-7f1a-4748-af14-2c5956c7f1e9 | Estudo & Foco | 057957f4-88b1-4a59-98a9-548ec46653e9 | | d777a787-172c-445d-8edc-e1a45ba1cfe0 | Histórias que Viram Chave | 6212146f-a152-4909-852b-c4043451f4df | | a9e0a0da-b10a-4cfd-b424-237d8acabd77 | Microcontos Dark | 75793441 - ddf1 - 4e06 - a891 - b39e27fc84e8 | | ad0bb742-cd0b-4d17-98bf-e0a1c6ed7ae9 | Mistérios Urbanos | c89417ab-ceb0-4a07-9eaf-9293219330e8 | | 2b839a1b-5b19-4f51-b629-b54ee0ff2094 | Mistérios Urbanos | 257b5ac4-72ab-4d96-a2eb-031833a319a6 | | 491ffe43-6fa3-4714-95e9-f1ff4c844f1e | Organização & Rotina | 057957f4-88b1-4a59-98a9-548ec46653e9 | | eef50951-fb0c-443c-8d2c-329e73e0cb88 | Psicologia & Comportamento | d1d643cd-5945-4469-89fa-0658dbc190bf | | a8ada321-a31c-4490-a96c-4b9b5aad996d | Reflexões Diretas | 6212146f-a152-4909-852b-c4043451f4df | | ea666dfc-8794-4dc5-a0a5-f96fca9b35f4 | Relacionamentos & Apego | d1d643cd-5945-4469-89fa-0658dbc190bf | | b5906196-54c4-4c7e-96f1-69922c48bc55 | Saúde Mental no Cotidiano | d1d643cd-5945-4469-89fa-0658dbc190bf | | 122f17e0-5dc2-41df-92ec-9480284a3c68 | Storytelling Curto | 75793441 - ddf1 - 4e06 - a891 - b39e27fc84e8 | | c05481a5-5b10-4ca4-b5c6-d9b7a6af4779 | True Crime Dark | 490bb475-da7a-4768-bb66-2092116c084a | -- Verificar IDs de ideias existentes
SELECT id,
    titulo,
    status
FROM pulso_content.ideias
ORDER BY created_at DESC
LIMIT 5;
| id | titulo | status | | ------------------------------------ | -------------------------------- | -------- |
| 43897700 - f771 - 4dd0 - 8f1f - 4135300d2800 | Você Já Morreu Milhares de Vezes | RASCUNHO | | e72f3aa8-2298-467e-bca7-5bb3b4cc37fb | A Ilusão do Livre Arbítrio | RASCUNHO | | af03be04-be9e-44ec-996a-7b7dd6d59484 | Você Já Morreu Milhares de Vezes | RASCUNHO | | 11f1c9f8-9073-4e2e-b670-066cd76c2820 | A Casa Winchester | APROVADA | | 78ed1608-a9fb-4bfe-9f92-157397280cfd | A Ilusão do Livre Arbítrio | RASCUNHO |