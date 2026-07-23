' Lança o worker de render do PULSO OCULTO (sem janela de console).
' Evita o kill 0xC000013A (Ctrl-C/fechamento de console) da tarefa agendada.
Set sh = CreateObject("WScript.Shell")
sh.Run "cmd /c ""D:\tmp\worker_run.bat""", 0, False
