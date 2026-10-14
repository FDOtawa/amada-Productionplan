' 置き場所・名前を変える前のショートカット用のつなぎ（隠しファイル）。「プログラムファイル」の起動用スクリプトを開きます。
' 起動用スクリプトがデスクトップのショートカットを直すので、全員のショートカットが直ったら消してかまいません（2026-10-14）
Dim sh, fso
Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
sh.Run "wscript.exe """ & fso.BuildPath(fso.BuildPath(fso.GetParentFolderName(WScript.ScriptFullName), "プログラムファイル"), "アマダ生産管理システムを開く.vbs") & """", 1, False
