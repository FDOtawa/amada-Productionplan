' アマダ生産管理システム：起動用スクリプトを開くショートカットをデスクトップに作る
' （共有フォルダに置いたまま、各PCでダブルクリックしてください）
' 起動に使うファイル（アプリ本体・起動用・アイコン）は「プログラムファイル」フォルダの中にあります
' アイコンは自分の PC（%LOCALAPPDATA%\AmadaPlan）にコピーしたものを使います（共有フォルダのアイコンは読めず白い形になるため）
Option Explicit
Const APP = "アマダ生産管理システム", OLDAPP = "アマダ生産計画抽出"
Dim sh, fso, dir, vbs, ico, dstDir, icoLocal, lnk, desk
Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
dir = fso.BuildPath(fso.GetParentFolderName(WScript.ScriptFullName), "プログラムファイル")
vbs = fso.BuildPath(dir, APP & "を開く.vbs")
If Not fso.FileExists(vbs) Then
  MsgBox "「プログラムファイル」フォルダに「" & APP & "を開く.vbs」がありません。", vbExclamation, APP
  WScript.Quit
End If
dstDir = fso.BuildPath(sh.ExpandEnvironmentStrings("%LOCALAPPDATA%"), "AmadaPlan")
If Not fso.FolderExists(dstDir) Then fso.CreateFolder dstDir
ico = fso.BuildPath(dir, "icon.ico")
icoLocal = fso.BuildPath(dstDir, "icon.ico")
If fso.FileExists(ico) Then fso.CopyFile ico, icoLocal, True
desk = sh.SpecialFolders("Desktop")
Set lnk = sh.CreateShortcut(fso.BuildPath(desk, APP & ".lnk"))
lnk.TargetPath = sh.ExpandEnvironmentStrings("%WINDIR%") & "\System32\wscript.exe"
lnk.Arguments = """" & vbs & """"
lnk.WorkingDirectory = dir
lnk.Description = APP
If fso.FileExists(icoLocal) Then lnk.IconLocation = icoLocal & ",0"
lnk.Save
' 名前を変える前のショートカットは消す（同じものが2つ並ばないように）
On Error Resume Next
If fso.FileExists(fso.BuildPath(desk, OLDAPP & ".lnk")) Then fso.DeleteFile fso.BuildPath(desk, OLDAPP & ".lnk"), True
On Error GoTo 0
MsgBox "デスクトップに「" & APP & "」のショートカットを作りました（前のショートカットは置き換えました）。", vbInformation, APP
