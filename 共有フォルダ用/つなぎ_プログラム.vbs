' 名前を変える前のショートカット用のつなぎ（隠しファイル）。同じフォルダの「生産管理システムを開く.vbs」を開きます。
' 起動用スクリプトがデスクトップのショートカットを直すので、全員のショートカットが直ったら消してかまいません（2026-10-14）
Dim sh, fso
Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
sh.Run "wscript.exe """ & fso.BuildPath(fso.GetParentFolderName(WScript.ScriptFullName), "生産管理システムを開く.vbs") & """", 1, False
