; Tauri writes the registration before this hook. Do not report a successful
; installation when Windows still points at a different version or directory.
!macro NSIS_HOOK_POSTINSTALL
  Push $0
  !insertmacro SetContext
  ClearErrors
  ReadRegStr $0 SHCTX "${UNINSTKEY}" "DisplayVersion"
  IfErrors glass_notes_registration_failed
  StrCmp $0 "${VERSION}" 0 glass_notes_registration_failed
  ReadRegStr $0 SHCTX "${UNINSTKEY}" "InstallLocation"
  IfErrors glass_notes_registration_failed
  StrCmp $0 '$\"$INSTDIR$\"' 0 glass_notes_registration_failed
  ReadRegStr $0 SHCTX "${UNINSTKEY}" "UninstallString"
  IfErrors glass_notes_registration_failed
  StrCmp $0 '$\"$INSTDIR\uninstall.exe$\"' 0 glass_notes_registration_failed
  ReadRegStr $0 SHCTX "${UNINSTKEY}" "MainBinaryName"
  IfErrors glass_notes_registration_failed
  StrCmp $0 "${MAINBINARYNAME}.exe" 0 glass_notes_registration_failed
  ReadRegStr $0 SHCTX "${MANUPRODUCTKEY}" ""
  IfErrors glass_notes_registration_failed
  StrCmp $0 "$INSTDIR" 0 glass_notes_registration_failed
  IfFileExists "$INSTDIR\${MAINBINARYNAME}.exe" 0 glass_notes_registration_failed
  IfFileExists "$INSTDIR\uninstall.exe" 0 glass_notes_registration_failed
  Pop $0
  Goto glass_notes_registration_done

  glass_notes_registration_failed:
    Pop $0
    SetErrorLevel 2
    Abort "Glass Notes: Windows installation registration could not be verified. Close this installer and run it again."
  glass_notes_registration_done:
!macroend
