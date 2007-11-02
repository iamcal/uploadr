SRC := MacUploadr.app/Contents
PKG := ~/Desktop/build/
BUILD := $(PKG)/Flickr\ Uploadr.app/Contents
GM_VER := 1.1.10

all:
	@echo "This target doesn't do anything!  Specify one of these:"
	@echo "  build     Copy everything of interest to ~/Desktop/build/"

build:
	rm -rf $(PKG)/*
	mkdir $(PKG)/Flickr\ Uploadr.app
	ln -s /Applications $(PKG)/Applications
	mkdir $(BUILD)
	mkdir $(BUILD)/lib
	mkdir $(BUILD)/Frameworks
	mkdir $(BUILD)/MacOS
	mkdir $(BUILD)/Resources
	cp $(SRC)/Info.plist $(BUILD)/
	mkdir $(BUILD)/lib/GraphicsMagick-$(GM_VER)
	mkdir $(BUILD)/lib/GraphicsMagick-$(GM_VER)/config
	cp $(SRC)/lib/GraphicsMagick-$(GM_VER)/config/*.mgk \
		$(BUILD)/lib/GraphicsMagick-$(GM_VER)/config/
	cp -R $(SRC)/Frameworks/XUL.framework $(BUILD)/Frameworks/
	ln -s ../Frameworks/XUL.framework/Versions/Current/xulrunner \
		$(BUILD)/MacOS/xulrunner
	cp $(SRC)/Resources/application.ini $(BUILD)/Resources/
	cp $(SRC)/Resources/icons.icns $(BUILD)/Resources/
	mkdir $(BUILD)/Resources/chrome
	cp $(SRC)/Resources/chrome/chrome.manifest $(BUILD)/Resources/chrome/
	mkdir $(BUILD)/Resources/chrome/content
	mkdir $(BUILD)/Resources/chrome/content/uploadr
	cp $(SRC)/Resources/chrome/content/uploadr/*.* \
		$(BUILD)/Resources/chrome/content/uploadr/
	mkdir $(BUILD)/Resources/chrome/locale
	mkdir $(BUILD)/Resources/chrome/locale/branding
	cp $(SRC)/Resources/chrome/locale/branding/*.* \
		$(BUILD)/Resources/chrome/locale/branding/
	mkdir $(BUILD)/Resources/chrome/locale/en-US
	cp $(SRC)/Resources/chrome/locale/en-US/*.* \
		$(BUILD)/Resources/chrome/locale/en-US/
	mkdir $(BUILD)/Resources/chrome/skin
	mkdir $(BUILD)/Resources/chrome/skin/hacks
	mkdir $(BUILD)/Resources/chrome/skin/hacks/mac
	cp $(SRC)/Resources/chrome/skin/hacks/mac/hacks.css \
		$(BUILD)/Resources/chrome/skin/hacks/mac/
	mkdir $(BUILD)/Resources/chrome/skin/hacks/win
	cp $(SRC)/Resources/chrome/skin/hacks/win/hacks.css \
		$(BUILD)/Resources/chrome/skin/hacks/win/
	mkdir $(BUILD)/Resources/chrome/skin/hacks/unix
	cp $(SRC)/Resources/chrome/skin/hacks/unix/hacks.css \
		$(BUILD)/Resources/chrome/skin/hacks/unix/
	mkdir $(BUILD)/Resources/chrome/skin/uploadr
	cp $(SRC)/Resources/chrome/skin/uploadr/*.css \
		$(BUILD)/Resources/chrome/skin/uploadr/
	cp $(SRC)/Resources/chrome/skin/uploadr/*.gif \
		$(BUILD)/Resources/chrome/skin/uploadr/
	cp $(SRC)/Resources/chrome/skin/uploadr/*.png \
		$(BUILD)/Resources/chrome/skin/uploadr/
	mkdir $(BUILD)/Resources/components
	cp $(SRC)/Resources/components/*.xpt $(BUILD)/Resources/components/
	cp $(SRC)/Resources/components/*.dylib $(BUILD)/Resources/components/
	mkdir $(BUILD)/Resources/defaults
	mkdir $(BUILD)/Resources/defaults/preferences
	cp $(SRC)/Resources/defaults/preferences/*.js \
		$(BUILD)/Resources/defaults/preferences/
	@echo "Build done!  Now go check it and make a disk image."
