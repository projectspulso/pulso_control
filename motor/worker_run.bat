@echo off
REM Worker de render do PULSO — chamado pelo Agendador de Tarefas do Windows.
REM Processa 1 item cena-ready da fila por execução. Guard (teto/dia) + QC barram excessos.
set PYTHONIOENCODING=utf-8
"D:\Program Files\Python313\python.exe" D:/tmp/worker_render.py --next >> D:/tmp/worker_render.log 2>&1
