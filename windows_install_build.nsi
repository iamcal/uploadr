; Compile-Time Variables:
; VERSION_DATE - yyyy.mm.dd.##
; VERSION - #.#.#.#
; VERSION_SHORT - #.#

!include "MUI.nsh"

Name "Flickr Uploadr ${VERSION_SHORT}"
Caption "Flickr Uploadr ${VERSION_SHORT} Installer"

OutFile "Flickr Uploadr ${VERSION_SHORT}.exe"
XPStyle on

InstallDir "$PROGRAMFILES\Flickr Uploadr"

InstallDirRegKey HKCU "Software\Flickr Uploadr" ""

VIProductVersion "${VERSION_DATE}"
VIAddVersionKey "CompanyName" "Yahoo!, Inc."
VIAddVersionKey "LegalCopyright" "Copyright (c) Yahoo! Inc."
VIAddVersionKey "FileDescription" "Flickr Uploadr ${VERSION}"
VIAddVersionKey "FileVersion" "${VERSION_DATE}"

!define MUI_ABORTWARNING
!define MUI_HEADERIMAGE

!insertmacro MUI_PAGE_WELCOME    
!insertmacro MUI_PAGE_DIRECTORY  
Page custom CustomPageA
!insertmacro MUI_PAGE_INSTFILES  
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_WELCOME
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH  

!insertmacro MUI_LANGUAGE "English"

ReserveFile "io.ini"
!insertmacro MUI_RESERVEFILE_INSTALLOPTIONS

Var INI_VALUE

Section "Install" SecInstall

	SetOutPath "$INSTDIR"

	SetOverwrite on  
	File /r ".\Flickr Uploadr ${VERSION_SHORT}\*"
	CreateShortCut "$INSTDIR\Flickr Uploadr.lnk" "$INSTDIR\xulrunner\xulrunner.exe" "application.ini" "$INSTDIR\icons.ico"

	WriteRegStr HKCU "Software\Flickr Uploadr" "" $INSTDIR

	WriteUninstaller "$INSTDIR\uninstall.exe"

	WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Flickr Uploadr" "DisplayName" "Flickr Uploadr ${VERSION}"
	WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Flickr Uploadr" "UninstallString" '"$INSTDIR\uninstall.exe"'
	WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Flickr Uploadr" "NoModify" 1
	WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Flickr Uploadr" "NoRepair" 1

	StrCmp $INI_VALUE "1" "" over
		WriteRegStr HKCR "SystemFileAssociations\image\shell\edit.FlickrUploadr" "" "Send to Flickr..."
		WriteRegStr HKCR "SystemFileAssociations\image\shell\edit.FlickrUploadr\command" "" '"$INSTDIR\Flickr Uploadr.exe" "%1"'
	over:

SectionEnd

Section "Start Menu Shortcuts"

	CreateDirectory "$SMPROGRAMS\Flickr Uploadr"
	CreateShortCut "$SMPROGRAMS\Flickr Uploadr\Flickr Uploadr.lnk" "$INSTDIR\Flickr Uploadr.lnk" "" "$INSTDIR\Flickr Uploadr.lnk" 0

	!insertmacro MUI_INSTALLOPTIONS_READ $INI_VALUE "io.ini" "Field 1" "State"

	StrCmp $INI_VALUE "1" "" +2    
		CreateShortCut "$DESKTOP\Flickr Uploadr.lnk" "$INSTDIR\Flickr Uploadr.lnk" "" "$INSTDIR\Flickr Uploadr.exe" 0

SectionEnd

Function .onInit
	!insertmacro MUI_INSTALLOPTIONS_EXTRACT "io.ini"  
FunctionEnd

LangString TEXT_IO_TITLE ${LANG_ENGLISH} "Integration Options"
LangString TEXT_IO_SUBTITLE ${LANG_ENGLISH} "Choose how Flickr will integrate with Windows."

Function CustomPageA
	!insertmacro MUI_HEADER_TEXT "$(TEXT_IO_TITLE)" "$(TEXT_IO_SUBTITLE)"
	!insertmacro MUI_INSTALLOPTIONS_DISPLAY "io.ini"
FunctionEnd

LangString DESC_SecInstall ${LANG_ENGLISH} "Install"

!insertmacro MUI_FUNCTION_DESCRIPTION_BEGIN
!insertmacro MUI_DESCRIPTION_TEXT ${SecInstall} $(DESC_SecInstall)
!insertmacro MUI_FUNCTION_DESCRIPTION_END

UninstallIcon ".\Flickr Uploadr 3.0\icons.ico"

Section "Uninstall"

DeleteRegKey /ifempty HKCU "Software\Flickr Uploadr"

	DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Flickr Uploadr"
	DeleteRegKey HKLM "Software\Flickr Uploadr"

	DeleteRegKey HKCR "SystemFileAssociations\image\shell\edit.FlickrUploadr"
	DeleteRegKey HKCR "SystemFileAssociations\image\shell\edit.FlickrUploadr\command"

	Delete "$INSTDIR"

	Delete "$SMPROGRAMS\Flickr Uploadr\*.*"
	Delete "$DESKTOP\Flickr Uploadr.lnk" 

	RMDir "$SMPROGRAMS\Flickr Uploadr"
	RMDir "$INSTDIR"

SectionEnd  

Icon ".\Flickr Uploadr 3.0\icons.ico"   