' 置き場所を移す前のショートカット用のつなぎ（隠しファイル）。「プログラムファイル」フォルダの起動用スクリプトを開きます。
' 起動用スクリプトがデスクトップのショートカットを新しい置き場所に直すので、全員のショートカットが直ったら消してかまいません（2026-10-14）
Dim sh, fso
Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
sh.Run "wscript.exe """ & fso.BuildPath(fso.BuildPath(fso.GetParentFolderName(WScript.ScriptFullName), "プログラムファイル"), "アマダ生産計画抽出を開く.vbs") & """", 1, False
