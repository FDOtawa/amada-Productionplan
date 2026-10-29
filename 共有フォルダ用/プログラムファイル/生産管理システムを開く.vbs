' 生産管理システムを開く（起動用）
' 共有フォルダの最新版のアプリを、自分の PC（%LOCALAPPDATA%\AmadaPlan）にコピーしてから Edge で開きます。
' 共有フォルダから直接開くと、Edge が保存先フォルダの選択を受け付けないことがあるため（2026-10-14）。
' アプリ（とアイコン）を新しくするときは、このフォルダの「生産管理システム.html」「icon.ico」を置き換えるだけで、次の起動から全員が新しい版になります。
Option Explicit
Const APP = "生産管理システム", OLDAPP = "アマダ生産計画抽出", OLDAPP2 = "アマダ生産管理システム" ' 2026-10-14：名前を「生産管理システム」に
Dim sh, fso, srcDir, src, ico, dstDir, dst, ok
Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
srcDir = fso.GetParentFolderName(WScript.ScriptFullName)
src = fso.BuildPath(srcDir, APP & ".html")
ico = fso.BuildPath(srcDir, "icon.ico")
dstDir = fso.BuildPath(sh.ExpandEnvironmentStrings("%LOCALAPPDATA%"), "AmadaPlan")
dst = fso.BuildPath(dstDir, APP & ".html")
If Not fso.FolderExists(dstDir) Then fso.CreateFolder dstDir
ok = False
On Error Resume Next
If fso.FileExists(src) Then
  fso.CopyFile src, dst, True
  If Err.Number = 0 Then ok = True
  Err.Clear
  If fso.FileExists(ico) Then fso.CopyFile ico, fso.BuildPath(dstDir, "icon.ico"), True
  Err.Clear
  ' 2026-10-29：操作マニュアル（manual フォルダ）もコピーする（アプリから manual\index.html を開くため）
  If fso.FolderExists(fso.BuildPath(srcDir, "manual")) Then fso.CopyFolder fso.BuildPath(srcDir, "manual"), fso.BuildPath(dstDir, "manual"), True
  Err.Clear
  If fso.FileExists(fso.BuildPath(dstDir, OLDAPP & ".html")) Then fso.DeleteFile fso.BuildPath(dstDir, OLDAPP & ".html"), True ' 名前を変える前のコピーは消す
  Err.Clear
  If fso.FileExists(fso.BuildPath(dstDir, OLDAPP2 & ".html")) Then fso.DeleteFile fso.BuildPath(dstDir, OLDAPP2 & ".html"), True
  Err.Clear
End If
On Error GoTo 0
If Not fso.FileExists(dst) Then
  MsgBox "アプリを開けません。共有フォルダ（" & srcDir & "）に入れるか確認してください。", vbExclamation, APP
  WScript.Quit
End If
If Not ok Then MsgBox "共有フォルダに入れなかったため、この PC に前回コピーした版で開きます。", vbInformation, APP
' デスクトップのショートカットをそろえる（2026-10-14）
' ・アイコン：共有フォルダの icon.ico を自分の PC にコピーしたもの（共有のアイコンを直接指すと Windows が読めず白い形になるため）
' ・開くもの：この起動用スクリプト（置き場所や名前を変える前のショートカットも、ここで直る）
' ・名前：「アマダ生産計画抽出」「アマダ生産管理システム」のショートカットは「生産管理システム」に名前を変える
Dim icoLocal, want, desk, f, lk, list, i, newLnk
icoLocal = fso.BuildPath(dstDir, "icon.ico")
want = """" & WScript.ScriptFullName & """"
On Error Resume Next
desk = sh.SpecialFolders("Desktop")
newLnk = fso.BuildPath(desk, APP & ".lnk")
list = ""
For Each f In fso.GetFolder(desk).Files
  If LCase(fso.GetExtensionName(f.Name)) = "lnk" Then list = list & f.Path & vbLf
Next
For Each i In Split(list, vbLf)
  If i <> "" Then
    Set lk = sh.CreateShortcut(i)
    If InStr(lk.Arguments, OLDAPP & "を開く.vbs") > 0 Or InStr(lk.Arguments, APP & "を開く.vbs") > 0 Or InStr(lk.TargetPath, OLDAPP & ".html") > 0 Or InStr(lk.TargetPath, APP & ".html") > 0 Then
      If lk.IconLocation <> icoLocal & ",0" Or lk.Arguments <> want Then
        lk.TargetPath = sh.ExpandEnvironmentStrings("%WINDIR%") & "\System32\wscript.exe"
        lk.Arguments = want
        lk.WorkingDirectory = srcDir
        lk.Description = APP
        If fso.FileExists(icoLocal) Then lk.IconLocation = icoLocal & ",0"
        lk.Save
      End If
      If (LCase(fso.GetFileName(i)) = LCase(OLDAPP & ".lnk") Or LCase(fso.GetFileName(i)) = LCase(OLDAPP2 & ".lnk")) And Not fso.FileExists(newLnk) Then fso.MoveFile i, newLnk
    End If
  End If
Next
Err.Clear
On Error GoTo 0
' Edge で開く（Edge が無ければ、ふだん使うブラウザで開く）
On Error Resume Next
sh.Run "msedge """ & dst & """", 1, False
If Err.Number <> 0 Then
  Err.Clear
  sh.Run """" & dst & """", 1, False
End If
