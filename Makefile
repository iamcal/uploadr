SRC := ~/code/flickrUploadr3/MacUploadr.app/Contents
BUILD := ~/Desktop/build/Flickr\ Uploadr.app/Contents
GM_VER := 1.1.10

all:
	@echo "This target doesn't do anything!  Specify one of these:"
	@echo "  setup     Setup symlinks for development environment"
	@echo "  teardown  Teardown symlinks for development environment"
	@echo "  build     Copy everything of interest to ~/Desktop/build/"

setup:
	ln -s ../../uploadr MacUploadr.app/Contents/Resources
	mkdir MacUploadr.app/Contents/Frameworks
	ln -s /Library/Frameworks/XUL.framework \
		MacUploadr.app/Contents/Frameworks/XUL.framework
	mkdir MacUploadr.app/Contents/MacOS
	ln -s /Library/Frameworks/XUL.framework/Versions/Current/xulrunner \
		MacUploadr.app/Contents/MacOS/xulrunner

teardown:
	rm MacUploadr.app/Contents/Resources
	rm MacUploadr.app/Contents/MacOS/xulrunner
	rmdir MacUploadr.app/Contents/MacOS

build:
	rm -rf $(BUILD)/Frameworks/*
	rm -rf $(BUILD)/MacOS/*
	rm -rf $(BUILD)/Resources/*
	rm -rf $(BUILD)/lib/*
	cp $(SRC)/Info.plist $(BUILD)/
	mkdir $(BUILD)/lib/GraphicsMagick-$(GM_VER)
	mkdir $(BUILD)/lib/GraphicsMagick-$(GM_VER)/config
	cp $(SRC)/lib/GraphicsMagick-$(GM_VER)/config/*.mgk \
		$(BUILD)/lib/GraphicsMagick-$(GM_VER)/
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
