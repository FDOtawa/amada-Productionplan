' アマダ生産計画抽出：このフォルダの起動用スクリプトを開くショートカットをデスクトップに作る
' （共有フォルダに置いたまま、各PCでダブルクリックしてください）
Option Explicit
Dim sh, fso, dir, vbs, ico, lnk
Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
dir = fso.GetParentFolderName(WScript.ScriptFullName)
vbs = fso.BuildPath(dir, "アマダ生産計画抽出を開く.vbs")
If Not fso.FileExists(vbs) Then
  MsgBox "このフォルダに「アマダ生産計画抽出を開く.vbs」がありません。", vbExclamation, "アマダ生産計画抽出"
  WScript.Quit
End If
Set lnk = sh.CreateShortcut(fso.BuildPath(sh.SpecialFolders("Desktop"), "アマダ生産計画抽出.lnk"))
lnk.TargetPath = sh.ExpandEnvironmentStrings("%WINDIR%") & "\System32\wscript.exe"
lnk.Arguments = """" & vbs & """"
lnk.WorkingDirectory = dir
lnk.Description = "アマダ生産計画抽出"
ico = fso.BuildPath(dir, "icon.ico")
If fso.FileExists(ico) Then lnk.IconLocation = ico & ",0"
lnk.Save
MsgBox "デスクトップに「アマダ生産計画抽出」のショートカットを作りました（前のショートカットは置き換えました）。", vbInformation, "アマダ生産計画抽出"
