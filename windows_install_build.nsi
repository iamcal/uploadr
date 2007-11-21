;
; Flickr Uploadr
;
; Copyright (c) 2007 Yahoo! Inc.  All rights reserved.  This library is free
; software; you can redistribute it and/or modify it under the terms of the
; GNU General Public License (GPL), version 2 only.  This library is
; distributed WITHOUT ANY WARRANTY, whether express or implied. See the GNU
; GPL for more details (http://www.gnu.org/licenses/gpl.html)
;

; Compile-Time Variables:
; VERSION_DATE - yyyy.mm.dd.##
; VERSION - #.#.#
; VERSION_SHORT - #.#

!include "MUI.nsh"

!macro LANG_LOAD LANGLOAD
	!insertmacro MUI_LANGUAGE "${LANGLOAD}"
	!verbose off
	!include "locale\${LANGLOAD}.nsh"
	!verbose on
	!undef LANG
!macroend
!macro LANG_STRING NAME VALUE
	LangString "${NAME}" "${LANG_${LANG}}" "${VALUE}"
!macroend 
!macro LANG_UNSTRING NAME VALUE
	!insertmacro LANG_STRING "un.${NAME}" "${VALUE}"
!macroend

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
; Language
!insertmacro MUI_LANGUAGE "English"
!insertmacro LANG_LOAD "English"
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

Name "Flickr Uploadr ${VERSION_SHORT}"
Caption "Flickr Uploadr ${VERSION_SHORT} Installer"

OutFile "Flickr Uploadr ${VERSION_SHORT}.exe"
XPStyle on

InstallDir "$PROGRAMFILES\Flickr Uploadr"

InstallDirRegKey HKCU "Software\Flickr Uploadr" ""

VIProductVersion "${VERSION_DATE}"
VIAddVersionKey "CompanyName" "Flickr"
VIAddVersionKey "LegalCopyright" "Copyright � 2007 - Yahoo!, Inc."
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

ReserveFile "io.ini"
!insertmacro MUI_RESERVEFILE_INSTALLOPTIONS

Var INI_VALUE

Section "Install" SecInstall

	SetOutPath "$INSTDIR"

	SetOverwrite on  

	CreateDirectory "$INSTDIR\chrome"
	CreateDirectory "$INSTDIR\chrome\icons"
	CreateDirectory "$INSTDIR\chrome\icons\default"
	File /oname=chrome\icons\default\main.ico MacUploadr.app\Contents\Resources\chrome\icons\default\main.ico
	File /oname=chrome\uploadr.jar MacUploadr.app\Contents\Resources\chrome\uploadr.jar
	File /oname=chrome\chrome.manifest MacUploadr.app\Contents\Resources\chrome\chrome.manifest.prod
	CreateDirectory "$INSTDIR\components"
	File /oname=components\gm.dll MacUploadr.app\Contents\Resources\components\gm.dll
	File /oname=components\flIGM.xpt MacUploadr.app\Contents\Resources\components\flIGM.xpt
	File /oname=components\key.dll MacUploadr.app\Contents\Resources\components\key.dll
	File /oname=components\flIKey.xpt MacUploadr.app\Contents\Resources\components\flIKey.xpt
	File /r /x CVS MacUploadr.app\Contents\Resources\defaults
	File /r /x CVS MacUploadr.app\Contents\Resources\xulrunner
	File MacUploadr.app\Contents\Resources\application.ini
	File MacUploadr.app\Contents\Resources\LICENSE.txt
	File MacUploadr.app\Contents\Resources\icons.ico
	File MacUploadr.app\Contents\Resources\magic.mgk
	File MacUploadr.app\Contents\Resources\modules.mgk
	File MacUploadr.app\Contents\Resources\delegates.mgk
	File "MacUploadr.app\Contents\Resources\Flickr Uploadr.exe"
	File "MacUploadr.app\Contents\Resources\LICENSE.txt"

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

	CreateShortCut "$SMPROGRAMS\Flickr Uploadr.lnk" "$INSTDIR\Flickr Uploadr.exe" "" "$INSTDIR\Flickr Uploadr.exe" 0

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

UninstallIcon ".\MacUploadr.app\Contents\Resources\icons.ico"

Section "Uninstall"

DeleteRegKey /ifempty HKCU "Software\Flickr Uploadr"

	DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Flickr Uploadr"
	DeleteRegKey HKLM "Software\Flickr Uploadr"

	DeleteRegKey HKCR "SystemFileAssociations\image\shell\edit.FlickrUploadr"
	DeleteRegKey HKCR "SystemFileAssociations\image\shell\edit.FlickrUploadr\command"

	Delete "$INSTDIR"

	Delete "$SMPROGRAMS\Flickr Uploadr.lnk"
	Delete "$DESKTOP\Flickr Uploadr.lnk" 

	RMDir /r "$SMPROGRAMS\Flickr Uploadr"
	RMDir /r "$INSTDIR"

SectionEnd  

Icon ".\MacUploadr.app\Contents\Resources\icons.ico"   