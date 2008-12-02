#
# Flickr Uploadr
#
# Copyright (c) 2007-2008 Yahoo! Inc.  All rights reserved.  This library is
# free software; you can redistribute it and/or modify it under the terms of
# the GNU General Public License (GPL), version 2 only.  This library is
# distributed WITHOUT ANY WARRANTY, whether express or implied. See the GNU
# GPL for more details (http://www.gnu.org/licenses/gpl.html)
#

# Macs can build DMGs and MARs for all languages with `make`
# Windows can build installers and MARs for all languages with `make win`

INTL := $(filter de-de en-US es-us fr-fr it-it ko-kr pt-br zh-hk ja-jp, $(MAKECMDGOALS))

ifeq (de-de, $(INTL))
INTL_SHORT := de
endif
ifeq (en-US, $(INTL))
INTL_SHORT := en
endif
ifeq (es-us, $(INTL))
INTL_SHORT := es
endif
ifeq (fr-fr, $(INTL))
INTL_SHORT := fr
endif
ifeq (it-it, $(INTL))
INTL_SHORT := it
endif
ifeq (ko-kr, $(INTL))
INTL_SHORT := kr
endif
ifeq (pt-br, $(INTL))
INTL_SHORT := br
endif
ifeq (zh-hk, $(INTL))
INTL_SHORT := hk
endif
ifeq (ja-jp, $(INTL))
INTL_SHORT := ja
endif


########################################################################
########################################################################
# Configuration

# Source files
#   Even though this isn't a very Windows-y path, it makes life
#   simpler to use it on all platforms
SRC := MacUploadr.app/Contents

# Version number for Uploadr - this comes from application.ini
VER := `grep ^Version= $(SRC)/Resources/application.ini | sed 's/Version=\(.*\)/\1/'`

########################################################################
# Windows configuration

ifeq (win, $(filter win, $(MAKECMDGOALS)))
PLATFORM := win

# Location of Mozilla tree for the MAR tools
MOZILLA := /c/mozilla

# Location for application bundle staging
APPNAME := Flickr\ Uploadr

# Location to output finished NSIS installers
OUT := /c/code/uploadr

# Location of the makensis.exe binary
MAKE_NSIS := /c/Program\ Files/NSIS/Unicode/makensis.exe


# below here, don't modify anything

# Dated version for the NSIS installer - this comes from application.ini
VER_DATE := `grep ^BuildID= $(SRC)/Resources/application.ini | sed 's/BuildID=\([0-9]\{4\}\)\([0-9]\{2\}\)\([0-9]\{2\}\)\([0-9]\{2\}\)/\1.\2.\3.\4/'`

# Location for build staging
BUILD := $(OUT)/builds/$(INTL)

# Location for application bundle staging
APP := $(BUILD)/$(APPNAME)

# Location for resource file (chrome, components, etc) staging
RES := $(APP)

# End Windows configuration
########################################################################

########################################################################
# Mac configuration

else
PLATFORM := mac

# GraphicsMagick version for stupid directory structure
GM_VER := 1.2.5

# Location of Mozilla tree for the MAR tools
MOZILLA := ~/devel/mozilla

# Location for build staging
#   The base of this path must exist before running make
BUILD := ~/Desktop/builds/$(INTL)

# Location for application bundle staging
APP := $(BUILD)/Flickr\ Uploadr.app

# Location for resource file (chrome, components, etc) staging
RES := $(APP)/Contents/Resources

# Location to output finished DMGs
OUT := ~/Desktop

# End Mac configuration
########################################################################

endif

# End configuration
########################################################################
########################################################################



dummy:
	@echo "Nothing happens if you don't give some arguments!"
	@echo "  win all, mac all:   Build the whole thing"
	@echo "  build, mar: Build a single package or update but requires"
	@echo "              de-de, en-US, es-us, fr-fr, it-it, ko-kr, pt-br, or zh-hk"

all: all-build all-mar

mac:
	@echo "Building for Mac"
win:
	@echo "Building for Windows"

all-build:
	make $(PLATFORM) de-de build
	make $(PLATFORM) en-US build
	make $(PLATFORM) es-us build
	make $(PLATFORM) fr-fr build
	make $(PLATFORM) it-it build
	make $(PLATFORM) ko-kr build
	make $(PLATFORM) pt-br build
	make $(PLATFORM) zh-hk build
	make $(PLATFORM) ja-jp build

all-mar:
	@make $(PLATFORM) de-de mar
	@make $(PLATFORM) en-US mar
	@make $(PLATFORM) es-us mar
	@make $(PLATFORM) fr-fr mar
	@make $(PLATFORM) it-it mar
	@make $(PLATFORM) ko-kr mar
	@make $(PLATFORM) pt-br mar
	@make $(PLATFORM) zh-hk mar
	@make $(PLATFORM) ja-jp mar


de-de:
	@echo "Building German (de-de)"
en-US:
	@echo "Building English (en-US)"
es-us:
	@echo "Building Spanish (es-us)"
fr-fr:
	@echo "Building French (fr-fr)"
it-it:
	@echo "Building Italian (it-it)"
ko-kr:
	@echo "Building Korean (ko-kr)"
pt-br:
	@echo "Building Portuguese (pt-br)"
zh-hk:
	@echo "Building Chinese (zh-hk)"
ja-jp:
	@echo "Building Japanese (ja-jp)"

build:
	@echo "Build step"
	@# Make sure the package directory exists
	mkdir -p $(BUILD)

	@# Saving the previous version for the partial MAR
#	rm -rf $(BUILD)/old
#	mv $(APP) $(BUILD)/old
	rm -rf $(APP)
ifeq (mac, $(PLATFORM))
	rm -f $(BUILD)/Applications
endif

	@# Package structure
ifeq (mac, $(PLATFORM))
	mkdir -p $(APP)/Contents
	mkdir $(APP)/Contents/lib
	mkdir $(APP)/Contents/Frameworks
	mkdir $(APP)/Contents/MacOS
	mkdir $(RES)
	cp $(SRC)/Info.plist $(APP)/Contents/
else
	mkdir $(APP)
endif

	@# GraphicsMagick config files
ifeq (mac, $(PLATFORM))
	mkdir $(APP)/Contents/lib/GraphicsMagick-$(GM_VER)
	mkdir $(APP)/Contents/lib/GraphicsMagick-$(GM_VER)/config
	cp $(SRC)/lib/GraphicsMagick-$(GM_VER)/config/*.mgk \
		$(APP)/Contents/lib/GraphicsMagick-$(GM_VER)/config/
else
	cp $(SRC)/Resources/*.mgk $(RES)/
endif

	@# XULRunner
	cp $(SRC)/Resources/application.ini $(RES)/
	cp $(SRC)/Resources/LICENSE.txt $(RES)/
ifeq (mac, $(PLATFORM))
	cp -R $(SRC)/Frameworks/XUL.framework $(APP)/Contents/Frameworks/
	cp $(APP)/Contents/Frameworks/XUL.framework/Versions/Current/xulrunner \
		$(APP)/Contents/MacOS/xulrunner
	cp $(SRC)/Resources/icons.icns $(RES)/
endif
ifeq (win, $(PLATFORM))
	cp -R $(SRC)/Resources/xulrunner $(RES)/
	cp $(SRC)/Resources/Flickr\ Uploadr.exe $(RES)/
	cp $(SRC)/Resources/libexpat.dll $(RES)/
	cp $(SRC)/Resources/icons.ico $(RES)/
endif

	@# XULRunner preferences
	mkdir -p $(RES)/defaults/preferences
	cp $(SRC)/Resources/defaults/preferences/*.js \
		$(RES)/defaults/preferences/
	sed 's/en-US/$(INTL)/g' $(SRC)/Resources/defaults/preferences/prefs.js > \
		$(RES)/defaults/preferences/prefs.js

	@# XULRunner locale
ifeq (mac, $(PLATFORM))
	rm $(APP)/Contents/Frameworks/XUL.framework/Versions/Current/chrome/??-??.*
	cp ./xulrunner_locales/$(INTL).* \
		$(APP)/Contents/Frameworks/XUL.framework/Versions/Current/chrome/
else
	rm $(RES)/xulrunner/chrome/??-??.*
	cp ./xulrunner_locales/$(INTL).* $(RES)/xulrunner/chrome/
endif

	@# Chrome
	mkdir $(RES)/chrome
	mkdir $(BUILD)/jar
	mkdir $(BUILD)/jar/content
	mkdir $(BUILD)/jar/content/uploadr
	cp $(SRC)/Resources/chrome/content/uploadr/*.* $(BUILD)/jar/content/uploadr/
	mkdir $(BUILD)/jar/content/hacks
ifeq (mac, $(PLATFORM))
	mkdir $(BUILD)/jar/content/hacks/mac
	cp $(SRC)/Resources/chrome/content/hacks/mac/*.xul $(BUILD)/jar/content/hacks/mac/
#	cp $(SRC)/Resources/chrome/content/hacks/mac/*.js $(BUILD)/jar/content/hacks/mac/
endif
ifeq (win, $(PLATFORM))
	mkdir $(BUILD)/jar/content/hacks/win
	cp $(SRC)/Resources/chrome/content/hacks/win/*.xul $(BUILD)/jar/content/hacks/win/
#	cp $(SRC)/Resources/chrome/content/hacks/win/*.js $(BUILD)/jar/content/hacks/win/
endif
ifeq (linux, $(PLATFORM))
	mkdir content/hacks/unix
	cp $(SRC)/Resources/chrome/content/hacks/unix/*.xul $(BUILD)/jar/content/hacks/unix/
#	cp $(SRC)/Resources/chrome/content/hacks/unix/*.js $(BUILD)/jar/content/hacks/unix/
endif
	mkdir $(BUILD)/jar/locale
	mkdir $(BUILD)/jar/locale/branding
	cp $(SRC)/Resources/chrome/locale/branding/*.* $(BUILD)/jar/locale/branding/
	mkdir $(BUILD)/jar/locale/$(INTL)
	cp $(SRC)/Resources/chrome/locale/$(INTL)/*.* $(BUILD)/jar/locale/$(INTL)/
	sed 's/en-US/$(INTL)/g' $(SRC)/Resources/chrome/chrome.manifest.prod > \
		$(RES)/chrome/chrome.manifest
	mkdir $(BUILD)/jar/skin
#ifeq (mac, $(PLATFORM))
#	mkdir $(BUILD)/jar/skin/hacks
#	mkdir $(BUILD)/jar/skin/hacks/mac
#	cp $(SRC)/Resources/chrome/skin/hacks/mac/hacks.css $(BUILD)/jar/skin/hacks/mac/
#endif
#ifeq (win, $(PLATFORM))
#	mkdir $(BUILD)/jar/skin/hacks/win
#	cp $(SRC)/Resources/chrome/skin/hacks/win/hacks.css $(BUILD)/jar/skin/hacks/win/
#endif
#ifeq (linux, $(PLATFORM))
#	mkdir $(BUILD)/jar/skin/hacks/unix
#	cp $(SRC)/Resources/chrome/skin/hacks/unix/hacks.css $(BUILD)/jar/skin/hacks/unix/
#endif
	mkdir $(BUILD)/jar/skin/uploadr
	cp $(SRC)/Resources/chrome/skin/uploadr/*.css $(BUILD)/jar/skin/uploadr/
	cp $(SRC)/Resources/chrome/skin/uploadr/*.gif $(BUILD)/jar/skin/uploadr/
	cp $(SRC)/Resources/chrome/skin/uploadr/*.png $(BUILD)/jar/skin/uploadr/
ifeq (win, $(PLATFORM))
	cd $(BUILD)/jar/ && zip uploadr.zip -r content locale skin
else
	cd $(BUILD)/jar/ && zip uploadr -r content locale skin
endif
	mv $(BUILD)/jar/uploadr.zip $(RES)/chrome/uploadr.jar
	rm -rf $(BUILD)/jar

	@# Non-JAR'd Chrome
	mkdir $(RES)/chrome/icons
	mkdir $(RES)/chrome/icons/default
	cp $(SRC)/Resources/chrome/icons/default/*.ico $(RES)/chrome/icons/default/

	@# XPCOM
	mkdir $(RES)/components
	cp $(SRC)/Resources/components/*.xpt $(RES)/components/
ifeq (mac, $(PLATFORM))
	cp $(SRC)/Resources/components/*.dylib $(RES)/components/
endif
ifeq (win, $(PLATFORM))
	cp $(SRC)/Resources/components/*.dll $(RES)/components/
endif
ifeq (linux, $(PLATFORM))
	cp $(SRC)/Resources/components/*.so $(RES)/components/
endif
	cp $(SRC)/Resources/components/*.js $(RES)/components/

	@# Create DMG for Macs
ifeq (mac, $(PLATFORM))
	ln -s /Applications $(BUILD)/Applications
	cp mac_installer/install-pane-$(INTL_SHORT).png $(BUILD)/.i.png
	cp mac_installer/DS_Store $(BUILD)/.DS_Store
	rm -f $(OUT)/FlickrUploadr-$(VER)-$(INTL_SHORT).dmg
	hdiutil create -srcfolder $(BUILD) -volname "Flickr Uploadr $(VER)" \
		-format UDZO -imagekey zlib-level=9 \
		$(OUT)/FlickrUploadr-$(VER)-$(INTL_SHORT).dmg
endif

	@# Create NSIS installer for Windows
ifeq (win, $(PLATFORM))

	perl win_installer/strsub.pl win_installer/strings.nsh \
		$(SRC)/Resources/chrome/locale/$(INTL)/installer.properties > \
		$(BUILD)/strings-temp.nsh
	perl win_installer/utf16.pl \
		$(BUILD)/strings-temp.nsh > \
		$(BUILD)/strings.nsh
	rm $(BUILD)/strings-temp.nsh

	perl win_installer/strsub.pl win_installer/config.ini \
		$(SRC)/Resources/chrome/locale/$(INTL)/installer.properties > \
		$(BUILD)/config-temp.ini
	perl win_installer/utf16.pl \
		$(BUILD)/config-temp.ini > \
		$(BUILD)/config.ini
	rm $(BUILD)/config-temp.ini

	perl win_installer/utf16.pl \
		win_installer/build.nsi > \
		$(BUILD)/build.nsi

	cp win_installer/vcredist_x86.exe $(BUILD)/vcredist_x86.exe

	$(MAKE_NSIS) -DVERSION=$(VER) \
		-DVERSION_DATE=$(VER_DATE) \
		$(BUILD)/build.nsi

	mv $(BUILD)/FlickrUploadr-$(VER)-XX.exe \
		$(OUT)/FlickrUploadr-$(VER)-$(INTL_SHORT).exe

	rm $(BUILD)/build.nsi
	rm $(BUILD)/strings.nsh
	rm $(BUILD)/config.ini
	rm $(BUILD)/vcredist_x86.exe
endif

	@# Create ??? for Linux
ifeq (linux, $(PLATFORM))
endif



mar:

	@echo "MAR step"
	@# Making MAR files
ifeq (mac, $(PLATFORM))
	@ln -s Flickr\ Uploadr.app $(BUILD)/new
endif
ifeq (win, $(PLATFORM))
	@# In Windows, `ln -s ...` == `cp -R ...`
	@ln -s $(BUILD)/Flickr\ Uploadr $(BUILD)/new
endif
ifeq (linux, $(PLATFORM))
	@ln -s Flickr\ Uploadr $(BUILD)/new
endif
	@rm -f $(OUT)/FlickrUploadr-$(VER)-$(INTL_SHORT).complete.mar
	@PATH="$(PATH):$(MOZILLA)/other-licenses/bsdiff:$(MOZILLA)/modules/libmar/tool" \
		$(MOZILLA)/tools/update-packaging/make_full_update.sh \
		$(OUT)/FlickrUploadr-$(VER)-$(INTL_SHORT).complete.mar \
		$(BUILD)/new &> /dev/null
#	@rm -f $(OUT)/FlickrUploadr-$(VER)-$(INTL_SHORT).partial.mar
#	@PATH="$(PATH):$(MOZILLA)/other-licenses/bsdiff:$(MOZILLA)/modules/libmar/tool" \
#		$(MOZILLA)/tools/update-packaging/make_incremental_update.sh \
#		$(OUT)/FlickrUploadr-$(VER)-$(INTL_SHORT).partial.mar \
#		$(BUILD)/old $(BUILD)/new &> /dev/null
ifeq (win, $(PLATFORM))
	@rm -rf $(BUILD)/new
else
	@rm $(BUILD)/new
endif

	@# Size and hash for the XML file
#	@ls -l $(OUT)/FlickrUploadr-$(VER)-$(INTL_SHORT).complete.mar | \
#		awk '{print "$(INTL) complete size: ",$$5}'
#	@md5 $(OUT)/FlickrUploadr-$(VER)-$(INTL_SHORT).complete.mar | \
#		awk '{print "$(INTL) complete MD5:  ",$$4}'
#	@ls -l $(OUT)/FlickrUploadr-$(VER)-$(INTL_SHORT).partial.mar | \
#		awk '{print "$(INTL) partial size: ",$$5}'
#	@md5 $(OUT)/FlickrUploadr-$(VER)-$(INTL_SHORT).partial.mar | \
#		awk '{print "$(INTL) partial MD5:  ",$$4}'