#
# Flickr Uploadr
#
# Copyright (c) 2007-2008 Yahoo! Inc.  All rights reserved.  This library is
# free software; you can redistribute it and/or modify it under the terms of
# the GNU General Public License (GPL), version 2 only.  This library is
# distributed WITHOUT ANY WARRANTY, whether express or implied. See the GNU
# GPL for more details (http://www.gnu.org/licenses/gpl.html)
#

INTL := $(filter de-de en-US es-us fr-fr it-it ko-kr pt-br zh-hk, $(MAKECMDGOALS))
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

# The base of this path (everything up to INTL) must exist before running make
PKG := ~/Desktop/build/$(INTL)

# Version number for Uploadr
VER := 3.1a1

# Location of Mozilla tree
MOZILLA := ~/mozilla

SRC := MacUploadr.app/Contents
APP := $(PKG)/Flickr\ Uploadr.app
BUILD := $(APP)/Contents
GM_VER := 1.1.10

all:
	make de-de build
	make en-US build
	make es-us build
	make fr-fr build
	make it-it build
	make ko-kr build
	make pt-br build
	make zh-hk build
	make de-de mar
	make en-US mar
	make es-us mar
	make fr-fr mar
	make it-it mar
	make ko-kr mar
	make pt-br mar
	make zh-hk mar

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

	# Saving the previous version
	rm -rf $(PKG)/old
	mv $(APP) $(PKG)/old

	# Package structure
	mkdir $(APP)
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

	# Copy to DMG
	cp -R $(PKG)/Flickr\ Uploadr.app /Volumes/Flickr\ Uploadr\ $(VER)/
	ln -s /Applications /Volumes/Flickr\ Uploadr\ $(VER)/Applications
	cp mac_installer/install-pane-$(INTL).png \
		/Volumes/Flickr\ Uploadr\ $(VER)/.i.png
	ln -s .i.png /Volumes/Flickr\ Uploadr\ $(VER)/i.png

mar:

	# Making MAR files
	ln -s Flickr\ Uploadr.app $(PKG)/new
	PATH="$(PATH):$(MOZILLA)/other-licenses/bsdiff:$(MOZILLA)/modules/libmar/tool" \
		$(MOZILLA)/tools/update-packaging/make_full_update.sh \
		$(PKG)/FlickrUploadr-$(VER)-$(INTL_SHORT).complete.mar $(PKG)/new
	PATH="$(PATH):$(MOZILLA)/other-licenses/bsdiff:$(MOZILLA)/modules/libmar/tool" \
		$(MOZILLA)/tools/update-packaging/make_incremental_update.sh \
		$(PKG)/FlickrUploadr-$(VER)-$(INTL_SHORT).partial.mar $(PKG)/old $(PKG)/new
	rm $(PKG)/new

	# Size and hash for the XML file
	@ls -l $(PKG)/FlickrUploadr-$(VER)-$(INTL_SHORT).complete.mar | awk '{print "Complete size: ",$$5}'
	@md5 $(PKG)/FlickrUploadr-$(VER)-$(INTL_SHORT).complete.mar | awk '{print "Complete MD5:  ",$$4}'
	@ls -l $(PKG)/FlickrUploadr-$(VER)-$(INTL_SHORT).partial.mar | awk '{print "Partial size: ",$$5}'
	@md5 $(PKG)/FlickrUploadr-$(VER)-$(INTL_SHORT).partial.mar | awk '{print "Partial MD5:  ",$$4}'