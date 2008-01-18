#
# Flickr Uploadr
#
# Copyright (c) 2007 Yahoo! Inc.  All rights reserved.  This library is free
# software; you can redistribute it and/or modify it under the terms of the
# GNU General Public License (GPL), version 2 only.  This library is
# distributed WITHOUT ANY WARRANTY, whether express or implied. See the GNU
# GPL for more details (http://www.gnu.org/licenses/gpl.html)
#

VER := 3.0.3
SRC := MacUploadr.app/Contents
PKG := ~/Desktop/build
BUILD := $(PKG)/Flickr\ Uploadr.app/Contents
GM_VER := 1.1.10

INTL := $(filter de-de en-US es-us fr-fr it-it ko-kr pt-br zh-hk, $(MAKECMDGOALS))

all:
	@echo "This target doesn't do anything!  Specify one of these:"
	@echo "  <INTL> build     Copy everything of interest to ~/Desktop/build/"

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

build:

	# Package structure
	rm -rf $(PKG)
	mkdir $(PKG)
	mkdir $(PKG)/Flickr\ Uploadr.app
	ln -s /Applications $(PKG)/Applications
	mkdir $(BUILD)
	mkdir $(BUILD)/lib
	mkdir $(BUILD)/Frameworks
	mkdir $(BUILD)/MacOS
	mkdir $(BUILD)/Resources
	cp $(SRC)/Info.plist $(BUILD)/

	# GraphicsMagick config files
	mkdir $(BUILD)/lib/GraphicsMagick-$(GM_VER)
	mkdir $(BUILD)/lib/GraphicsMagick-$(GM_VER)/config
	cp $(SRC)/lib/GraphicsMagick-$(GM_VER)/config/*.mgk \
		$(BUILD)/lib/GraphicsMagick-$(GM_VER)/config/

	# XULRunner
	cp -R $(SRC)/Frameworks/XUL.framework $(BUILD)/Frameworks/
	cp $(BUILD)/Frameworks/XUL.framework/Versions/Current/xulrunner \
		$(BUILD)/MacOS/xulrunner
	cp $(SRC)/Resources/application.ini $(BUILD)/Resources/
	cp $(SRC)/Resources/LICENSE.txt $(BUILD)/Resources/
	cp $(SRC)/Resources/icons.icns $(BUILD)/Resources/

	# XULRunner preferences
	mkdir $(BUILD)/Resources/defaults
	mkdir $(BUILD)/Resources/defaults/preferences
	cp $(SRC)/Resources/defaults/preferences/*.js \
		$(BUILD)/Resources/defaults/preferences/

	# XULRunner locale
	rm $(BUILD)/Frameworks/XUL.framework/Versions/Current/chrome/??-??.*
	cp ./xulrunner_locales/$(INTL).* \
		$(BUILD)/Frameworks/XUL.framework/Versions/Current/chrome/
	sed 's/en-US/$(INTL)/g' $(SRC)/Resources/defaults/preferences/prefs.js > \
		$(BUILD)/Resources/defaults/preferences/prefs.js

	# Chrome
	mkdir $(BUILD)/Resources/chrome
	mkdir content
	mkdir content/uploadr
	cp $(SRC)/Resources/chrome/content/uploadr/*.* content/uploadr/
	mkdir locale
	mkdir locale/branding
	cp $(SRC)/Resources/chrome/locale/branding/*.* locale/branding/
	mkdir locale/$(INTL)
	cp $(SRC)/Resources/chrome/locale/$(INTL)/*.* locale/$(INTL)/
	sed 's/en-US/$(INTL)/g' $(SRC)/Resources/chrome/chrome.manifest.prod > \
		$(BUILD)/Resources/chrome/chrome.manifest
	mkdir skin
#	mkdir skin/hacks
#	mkdir skin/hacks/mac
#	cp $(SRC)/Resources/chrome/skin/hacks/mac/hacks.css skin/hacks/mac/
#	mkdir skin/hacks/win
#	cp $(SRC)/Resources/chrome/skin/hacks/win/hacks.css skin/hacks/win/
#	mkdir skin/hacks/unix
#	cp $(SRC)/Resources/chrome/skin/hacks/unix/hacks.css skin/hacks/unix/
	mkdir skin/uploadr
	cp $(SRC)/Resources/chrome/skin/uploadr/*.css skin/uploadr/
	cp $(SRC)/Resources/chrome/skin/uploadr/*.gif skin/uploadr/
	cp $(SRC)/Resources/chrome/skin/uploadr/*.png skin/uploadr/
	zip uploadr -r content locale skin
	rm -rf content locale skin
	mv uploadr.zip $(BUILD)/Resources/chrome/uploadr.jar

	# XPCOM
	mkdir $(BUILD)/Resources/components
	cp $(SRC)/Resources/components/*.xpt $(BUILD)/Resources/components/
	cp $(SRC)/Resources/components/*.dylib $(BUILD)/Resources/components/
	cp $(SRC)/Resources/components/*.js $(BUILD)/Resources/components/

	# Record this build for posterity
	rm -rf ~/Desktop/builds/$(INTL)/*
	cp -R $(PKG)/Flickr\ Uploadr.app ~/Desktop/builds/$(INTL)/

	# Copy to DMG
	cp -R $(PKG)/* /Volumes/Flickr\ Uploadr\ $(VER)/
	cp mac_installer/install-pane-$(INTL).png \
		/Volumes/Flickr\ Uploadr\ $(VER)/.i.png
	ln -s .i.png /Volumes/Flickr\ Uploadr\ $(VER)/i.png
