' アマダ生産計画抽出を開く（起動用）
' 共有フォルダの最新版のアプリを、自分の PC（%LOCALAPPDATA%\AmadaPlan）にコピーしてから Edge で開きます。
' 共有フォルダから直接開くと、Edge が保存先フォルダの選択を受け付けないことがあるため（2026-10-14）。
' アプリ（とアイコン）を新しくするときは、共有フォルダの「アマダ生産計画抽出.html」「icon.ico」を置き換えるだけで、次の起動から全員が新しい版になります。
Option Explicit
Dim sh, fso, srcDir, src, ico, dstDir, dst, ok
Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
srcDir = fso.GetParentFolderName(WScript.ScriptFullName)
src = fso.BuildPath(srcDir, "アマダ生産計画抽出.html")
ico = fso.BuildPath(srcDir, "icon.ico")
dstDir = fso.BuildPath(sh.ExpandEnvironmentStrings("%LOCALAPPDATA%"), "AmadaPlan")
dst = fso.BuildPath(dstDir, "アマダ生産計画抽出.html")
If Not fso.FolderExists(dstDir) Then fso.CreateFolder dstDir
ok = False
On Error Resume Next
If fso.FileExists(src) Then
  fso.CopyFile src, dst, True
  If Err.Number = 0 Then ok = True
  Err.Clear
  If fso.FileExists(ico) Then fso.CopyFile ico, fso.BuildPath(dstDir, "icon.ico"), True
  Err.Clear
End If
On Error GoTo 0
If Not fso.FileExists(dst) Then
  MsgBox "アプリを開けません。共有フォルダ（" & srcDir & "）に入れるか確認してください。", vbExclamation, "アマダ生産計画抽出"
  WScript.Quit
End If
If Not ok Then MsgBox "共有フォルダに入れなかったため、この PC に前回コピーした版で開きます。", vbInformation, "アマダ生産計画抽出"
' デスクトップの「アマダ生産計画抽出」のショートカットのアイコンを、共有フォルダの icon.ico（を自分の PC にコピーしたもの）にそろえる（2026-10-14）
' （共有フォルダのアイコンを直接指すと Windows が読めず白い形になるため、コピーを指す。共有の icon.ico を置き換えれば、次の起動で全員のアイコンが変わる）
Dim icoLocal, deskDir, f, lk
icoLocal = fso.BuildPath(dstDir, "icon.ico")
On Error Resume Next
If fso.FileExists(icoLocal) Then
  deskDir = sh.SpecialFolders("Desktop")
  For Each f In fso.GetFolder(deskDir).Files
    If LCase(fso.GetExtensionName(f.Name)) = "lnk" Then
      Set lk = sh.CreateShortcut(f.Path)
      If InStr(lk.Arguments, "アマダ生産計画抽出を開く.vbs") > 0 Or InStr(lk.TargetPath, "アマダ生産計画抽出.html") > 0 Then
        If lk.IconLocation <> icoLocal & ",0" Then lk.IconLocation = icoLocal & ",0" : lk.Save
      End If
    End If
  Next
End If
Err.Clear
On Error GoTo 0
' Edge で開く（Edge が無ければ、ふだん使うブラウザで開く）
On Error Resume Next
sh.Run "msedge """ & dst & """", 1, False
If Err.Number <> 0 Then
  Err.Clear
  sh.Run """" & dst & """", 1, False
End If
