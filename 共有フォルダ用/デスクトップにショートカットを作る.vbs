' アマダ生産計画抽出：起動用スクリプトを開くショートカットをデスクトップに作る
' （共有フォルダに置いたまま、各PCでダブルクリックしてください）
' 起動に使うファイル（アプリ本体・起動用・アイコン）は「プログラムファイル」フォルダの中にあります（2026-10-14）
' アイコンは自分の PC（%LOCALAPPDATA%\AmadaPlan）にコピーしたものを使います（共有フォルダのアイコンは読めず白い形になるため）
Option Explicit
Dim sh, fso, dir, vbs, ico, dstDir, icoLocal, lnk
Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
dir = fso.BuildPath(fso.GetParentFolderName(WScript.ScriptFullName), "プログラムファイル")
vbs = fso.BuildPath(dir, "アマダ生産計画抽出を開く.vbs")
If Not fso.FileExists(vbs) Then
  MsgBox "「プログラムファイル」フォルダに「アマダ生産計画抽出を開く.vbs」がありません。", vbExclamation, "アマダ生産計画抽出"
  WScript.Quit
End If
dstDir = fso.BuildPath(sh.ExpandEnvironmentStrings("%LOCALAPPDATA%"), "AmadaPlan")
If Not fso.FolderExists(dstDir) Then fso.CreateFolder dstDir
ico = fso.BuildPath(dir, "icon.ico")
icoLocal = fso.BuildPath(dstDir, "icon.ico")
If fso.FileExists(ico) Then fso.CopyFile ico, icoLocal, True
Set lnk = sh.CreateShortcut(fso.BuildPath(sh.SpecialFolders("Desktop"), "アマダ生産計画抽出.lnk"))
lnk.TargetPath = sh.ExpandEnvironmentStrings("%WINDIR%") & "\System32\wscript.exe"
lnk.Arguments = """" & vbs & """"
lnk.WorkingDirectory = dir
lnk.Description = "アマダ生産計画抽出"
If fso.FileExists(icoLocal) Then lnk.IconLocation = icoLocal & ",0"
lnk.Save
MsgBox "デスクトップに「アマダ生産計画抽出」のショートカットを作りました（前のショートカットは置き換えました）。", vbInformation, "アマダ生産計画抽出"
