Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "E:\code_tino_19_4\Code_Tool_Python\gdrive-video-ai-renamer"
WshShell.Run "cmd /c npm run dev", 0, False
