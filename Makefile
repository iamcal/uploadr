SRC := MacUploadr.app/Contents
PKG := ~/Desktop/build
BUILD := $(PKG)/Flickr\ Uploadr.app/Contents
GM_VER := 1.1.10

all:
	@echo "This target doesn't do anything!  Specify one of these:"
	@echo "  build     Copy everything of interest to ~/Desktop/build/"

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
	ln -s ../Frameworks/XUL.framework/Versions/Current/xulrunner \
		$(BUILD)/MacOS/xulrunner
	cp $(SRC)/Resources/application.ini $(BUILD)/Resources/
	cp $(SRC)/Resources/icons.icns $(BUILD)/Resources/

	# Chrome
	mkdir content
	mkdir content/uploadr
	cp $(SRC)/Resources/chrome/content/uploadr/*.* content/uploadr/
	mkdir locale
	mkdir locale/branding
	cp $(SRC)/Resources/chrome/locale/branding/*.* locale/branding/
	mkdir locale/en-US
	cp $(SRC)/Resources/chrome/locale/en-US/*.* locale/en-US/
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
	mkdir $(BUILD)/Resources/chrome
	mv uploadr.zip $(SRC)/Resources/chrome/uploadr.jar
	cp $(SRC)/Resources/chrome/uploadr.jar $(BUILD)/Resources/chrome/
	cp $(SRC)/Resources/chrome/chrome.manifest.prod $(BUILD)/Resources/chrome/chrome.manifest	

	# XPCOM
	mkdir $(BUILD)/Resources/components
	cp $(SRC)/Resources/components/*.xpt $(BUILD)/Resources/components/
	cp $(SRC)/Resources/components/*.dylib $(BUILD)/Resources/components/

	# XULRunner preferences
	mkdir $(BUILD)/Resources/defaults
	mkdir $(BUILD)/Resources/defaults/preferences
	cp $(SRC)/Resources/defaults/preferences/*.js \
		$(BUILD)/Resources/defaults/preferences/

	@echo "Build done!  Now go check it and make a disk image."