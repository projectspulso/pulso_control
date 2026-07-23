# motor/ — a esteira de render do PULSO

O que o app **não** faz. O cérebro (roteiro, cenas, áudio) roda online na Vercel; o
**render** roda nesta máquina, porque monta vídeo com ffmpeg e baixa clipes pesados.

Estes arquivos viviam soltos em `D:/tmp/` e não eram versionados — se a máquina se
perdesse, iam junto. Agora estão aqui.

## A cadeia

| Arquivo | O que faz |
|---|---|
| `worker_render.py` | Porta de entrada. Pega 1 item cena-ready da fila e toca até o fim. É quem a Tarefa Agendada chama (08h, 16h, 23h). |
| `gen_scenes.py` | Resolve o b-roll de cada cena pela **cascata de custo** (abaixo). |
| `stock_gen.py` | Acervo real grátis: Pexels → Pixabay. Custo zero. |
| `wan_gen.py` | Wan / DashScope (Alibaba, região Singapura). Cota grátis **por modelo**, com cascata entre modelos. |
| `banco_clips.py` | Banco de clipes reusáveis: busca por prompt idêntico, depois por similaridade de tags. |
| `banco_thumbs.py` | Miniaturas + catálogo navegável que o app lê. |
| `make_video.py` | Montagem final no ffmpeg: corta tudo pra 9:16, casa com o áudio, aplica o molde. |
| `lipsync_pulso.py` | Mascote sincronizado (visemas). Custo zero. |
| `pulso_guard.py` | Trava de orçamento e registro de gasto. Nada gera sem passar por aqui. |

## Cascata de custo (a ordem importa)

1. **Banco de clipes** — reuso, R$ 0
2. **Acervo real** (Pexels/Pixabay) — R$ 0
3. **Wan** — grátis enquanto a cota do modelo durar, ~R$ 4/clipe depois
4. **Higgsfield/Veo** — ~R$ 8/clipe, só quando nada acima resolveu

## ⚠ Onde o código REALMENTE roda hoje

**Em `D:/tmp/`, não aqui.** Isto é uma **cópia de segurança**, não o runtime.

- A Tarefa Agendada chama `D:\tmp\worker_run.vbs` → `worker_run.bat` → `D:/tmp/worker_render.py`.
- O `.vbs` existe pra lançar **oculto**: com janela de console a tarefa morria com
  `0xC000013A` (o Windows manda Ctrl-C ao fechar o console).
- Vários scripts fazem `sys.path.insert(0, "D:/tmp")`, então mesmo rodando daqui eles
  importariam os irmãos de lá.

**Consequência:** editar um arquivo aqui **não muda o que roda**. Enquanto os dois lados
existirem, eles divergem. Para trocar o runtime pra cá é preciso, no mínimo:
1. trocar os caminhos no `worker_run.bat`;
2. trocar os `sys.path.insert(0, "D:/tmp")`;
3. decidir onde fica `D:/tmp/banco_clips/` (617 clipes, ~2,7 GB — **não** vai pro git);
4. reapontar a Tarefa Agendada.

Não foi feito ainda porque mexe num agendador que hoje funciona.

## Credenciais

Nenhum segredo aqui dentro — varrido antes de commitar. Todos leem de
`D:/projetos/pulso_control/.env` (que é gitignored):

`PEXELS_API_KEY` · `PIXABAY_API_KEY` · `DASHSCOPE_API_KEY_SG` · `SUPABASE_SERVICE_ROLE_KEY`

As contas são **do PULSO**, nunca do DIGIAI — os dois têm cadastro nos mesmos serviços e
já houve troca por engano. No Pixabay, o número antes do hífen identifica a conta:
`56826734` é PULSO.

## O que NÃO veio junto

`D:/tmp` tem ~1.147 arquivos, a maioria de outros projetos (`hoya_*`, `brascor_*` são da
ótica) ou scripts de uma vez só (`prep_*`, `_kwai_*`, `backfill_*`). Só entrou a cadeia
que o `worker_render.py` alcança pelos imports.
