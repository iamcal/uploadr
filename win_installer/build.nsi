;
; Flickr Uploadr
;
; Copyright (c) 2007-2009 Yahoo! Inc.  All rights reserved.  This library is
; free software; you can redistribute it and/or modify it under the terms of
; the GNU General Public License (GPL), version 2 only.  This library is
; distributed WITHOUT ANY WARRANTY, whether express or implied. See the GNU
; GPL for more details (http://www.gnu.org/licenses/gpl.html)
;

; Compile-Time Variables:
; VERSION	#.#.#		(whatever, really)
; VERSION_DATE	YYYY.MM.DD.nn	(strictly now)

!include "MUI.nsh"
!include "LogicLib.nsh"

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



;
; Strings and intl and burritos
;

!macro LANG_STRING NAME VALUE
	LangString "${NAME}" "${LANG_${LANG}}" "${VALUE}"
!macroend

!include "strings.nsh"
!insertmacro MUI_LANGUAGE "${LANG_NAME}"

!insertmacro LANG_STRING title_version		"${LANG_STR_TITLE_VERSION}"
!insertmacro LANG_STRING title_version_inst	"${LANG_STR_TITLE_VERSION_INST}"
!insertmacro LANG_STRING copyright		"${LANG_STR_COPYRIGHT}"
!insertmacro LANG_STRING inst			"${LANG_STR_INST}"
!insertmacro LANG_STRING integ_title		"${LANG_STR_INTEG_TITLE}"
!insertmacro LANG_STRING integ_text		"${LANG_STR_INTEG_TEXT}"
!insertmacro LANG_STRING send			"${LANG_STR_SEND}"

;
; Version-y bits
;

Name "$(title_version)"
Caption "$(title_version_inst)"

OutFile "FlickrUploadr-${VERSION}-XX.exe"
XPStyle on

InstallDir "$PROGRAMFILES\Flickr Uploadr"

InstallDirRegKey HKCU "Software\Flickr Uploadr" ""

VIProductVersion "${VERSION_DATE}"
VIAddVersionKey "CompanyName" "Flickr"
VIAddVersionKey "LegalCopyright" "$(copyright)"
VIAddVersionKey "FileDescription" "$(title_version)"
VIAddVersionKey "FileVersion" "${VERSION}"



ReserveFile "config.ini"
!insertmacro MUI_RESERVEFILE_INSTALLOPTIONS

Var INI_VALUE

Section "Install" SecInstall

	SetOutPath "$INSTDIR"

	SetOverwrite on  

	; Chrome
	CreateDirectory "$INSTDIR\chrome"
	CreateDirectory "$INSTDIR\chrome\icons"
	CreateDirectory "$INSTDIR\chrome\icons\default"
	File /oname=chrome\icons\default\main.ico	"Flickr Uploadr\chrome\icons\default\main.ico"
	File /oname=chrome\icons\default\updates.ico	"Flickr Uploadr\chrome\icons\default\updates.ico"
	File /oname=chrome\uploadr.jar			"Flickr Uploadr\chrome\uploadr.jar"
	File /oname=chrome\chrome.manifest		"Flickr Uploadr\chrome\chrome.manifest"

	; XPCOM components
	CreateDirectory "$INSTDIR\components"
	File /oname=components\gm.dll			"Flickr Uploadr\components\gm.dll"
	File /oname=components\flIGM.xpt		"Flickr Uploadr\components\flIGM.xpt"
	File /oname=components\key.dll			"Flickr Uploadr\components\key.dll"
	File /oname=components\flIKey.xpt		"Flickr Uploadr\components\flIKey.xpt"
	File /oname=components\clh.js			"Flickr Uploadr\components\clh.js"
	File /oname=components\flICLH.xpt		"Flickr Uploadr\components\flICLH.xpt"

	; CRT
	File "vcredist_x86.exe"
	ExecWait '"$INSTDIR\vcredist_x86.exe" /q:a /c:"VCREDI~1.EXE /q:a /c:""msiexec /i vcredist.msi /qb!"" "'
	Delete "$INSTDIR\vcredist_x86.exe"

	; XULRunner and friends
	File /r /x .svn "Flickr Uploadr\defaults"
	File /r /x .svn "Flickr Uploadr\xulrunner"
	File "Flickr Uploadr\application.ini"
	File "Flickr Uploadr\LICENSE.txt"
	File "Flickr Uploadr\icons.ico"
	File "Flickr Uploadr\magic.mgk"
	File "Flickr Uploadr\modules.mgk"
	File "Flickr Uploadr\delegates.mgk"
	File "Flickr Uploadr\libexpat.dll"
	File "Flickr Uploadr\Flickr Uploadr.exe"

	; Uninstaller
	WriteRegStr HKCU "Software\Flickr Uploadr" "" $INSTDIR
	WriteUninstaller "$INSTDIR\uninstall.exe"
	WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Flickr Uploadr" "DisplayName" "Flickr Uploadr ${VERSION}"
	WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Flickr Uploadr" "UninstallString" '"$INSTDIR\uninstall.exe"'
	WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Flickr Uploadr" "NoModify" 1
	WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Flickr Uploadr" "NoRepair" 1

	; Right click menu options
	WriteRegStr HKCR "SystemFileAssociations\image\shell\edit.FlickrUploadr" "" "$(send)"
	WriteRegStr HKCR "SystemFileAssociations\image\shell\edit.FlickrUploadr\command" "" '"$INSTDIR\Flickr Uploadr.exe" "%1"'
	WriteRegStr HKCR "SystemFileAssociations\video\shell\edit.FlickrUploadr" "" "$(send)"
	WriteRegStr HKCR "SystemFileAssociations\video\shell\edit.FlickrUploadr\command" "" '"$INSTDIR\Flickr Uploadr.exe" "%1"'

SectionEnd

Section "Start Menu Shortcuts"
	CreateShortCut "$SMPROGRAMS\Flickr Uploadr.lnk" "$INSTDIR\Flickr Uploadr.exe" "" "$INSTDIR\Flickr Uploadr.exe" 0
	!insertmacro MUI_INSTALLOPTIONS_READ $INI_VALUE "config.ini" "Field 1" "State"
	StrCmp $INI_VALUE "1" "" +2    
		CreateShortCut "$DESKTOP\Flickr Uploadr.lnk" "$INSTDIR\Flickr Uploadr.exe" "" "$INSTDIR\Flickr Uploadr.exe" 0
SectionEnd

Function .onInit
	!insertmacro MUI_INSTALLOPTIONS_EXTRACT "config.ini"
FunctionEnd

Function CustomPageA
	!insertmacro MUI_HEADER_TEXT "$(integ_title)" "$(integ_text)"
	!insertmacro MUI_INSTALLOPTIONS_DISPLAY "config.ini"
FunctionEnd

!insertmacro MUI_FUNCTION_DESCRIPTION_BEGIN
!insertmacro MUI_DESCRIPTION_TEXT ${SecInstall} $(inst)
!insertmacro MUI_FUNCTION_DESCRIPTION_END

UninstallIcon "Flickr Uploadr\icons.ico"

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

Icon "Flickr Uploadr\icons.ico"
