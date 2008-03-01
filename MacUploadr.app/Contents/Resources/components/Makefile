#
# Flickr Uploadr
#
# Copyright (c) 2007-2008 Yahoo! Inc.  All rights reserved.  This library is
# free software; you can redistribute it and/or modify it under the terms of
# the GNU General Public License (GPL), version 2 only.  This library is
# distributed WITHOUT ANY WARRANTY, whether express or implied. See the GNU
# GPL for more details (http://www.gnu.org/licenses/gpl.html)
#

PLATFORM := $(filter mac ppc linux universal, $(MAKECMDGOALS))
COMPONENT := $(filter gm key clh, $(MAKECMDGOALS))

GECKO_SDK := ../gecko-sdk.$(PLATFORM)
GM_INCLUDE := -I/usr/local/include/GraphicsMagick
GM_LIB := -L/usr/local/lib
EXIV_INCLUDE := -I/usr/local/include/exiv2
EXIV_LIB := -L/usr/local/lib -L/usr/lib
FF_INCLUDE := -I/usr/local/include/ffmpeg
FF_LIB := -L/usr/local/lib
X11_LIB := -L/usr/X11R6/lib
PORTS_LIB := -L/opt/local/lib
XULRUNNER := ../../Frameworks/XUL.framework/Versions/Current

ifeq (mac, $(PLATFORM))
DEFINE := -DXP_UNIX -DXP_MACOSX
endif
ifeq (ppc, $(PLATFORM))
DEFINE := -DXP_UNIX -DXP_MACOSX
endif
ifeq (linux, $(PLATFORM))
DEFINE := -DXP_UNIX
endif

all: 
	@echo "Platform targets:"
	@echo "  mac (Intel)"
	@echo "  ppc"
	@echo "  linux"
	@echo "  universal (combines mac and ppc dylibs using lipo)"
	@echo "Components:"
	@echo "  gm"
	@echo "  key"
	@echo "  clh"
	@echo "Mix & match from the above lists to build components for platforms"
	@echo ""
	@echo "Usage: make <platform> <component>"



mac:
	@echo "Building for Intel Macs..."

ppc:
	@echo "Building for PowerPC Macs..."

linux:
	@echo "Building for x86 Linux..."

universal:
	@echo "Building Universal Binary for Macs..."
	lipo -create \
		-arch ppc $(COMPONENT).dylib.ppc \
		-arch i386 $(COMPONENT).dylib.mac \
		-output $(COMPONENT).dylib



gm:
ifneq (universal, $(PLATFORM))
	@echo "Building the GraphicsMagick/FFmpeg XPCOM component..."
ifeq (mac, $(PLATFORM))
	@echo "Building the GraphicsMagick/FFmpeg XPT file..."
	$(GECKO_SDK)/bin/xpidl \
		-m header \
		-I$(GECKO_SDK)/idl \
		flIGM.idl
	$(GECKO_SDK)/bin/xpidl \
		-m typelib \
		-I$(GECKO_SDK)/idl \
		flIGM.idl
endif
	g++ -w -c -O2 \
		-o flGM.o \
		-I$(GECKO_SDK)/include \
		$(GM_INCLUDE) \
		$(EXIV_INCLUDE) \
		$(FF_INCLUDE) \
		$(DEFINE) \
		flGM.cpp
	g++ -w -c -O2 \
		-o flGMModule.o \
		-I$(GECKO_SDK)/include \
		$(DEFINE) \
		flGMModule.cpp
	g++ -dynamiclib -O2 \
		-o gm.dylib.$(PLATFORM) \
		flGM.o flGMModule.o \
		-L$(GECKO_SDK)/lib \
		$(GM_LIB) \
		$(PORTS_LIB) \
		-L$(XULRUNNER) -Wl,-executable_path,$(XULRUNNER) \
		-lxpcomglue_s -lxpcom -lnspr4 \
		-lGraphicsMagick -lGraphicsMagick++ \
		-lexiv2 -liconv -lexpat \
		-lz -lbz2 \
		-lxml2 \
		-ljpeg -lpng -ltiff \
		-lavformat -lavcodec -lavutil \
		-Wl,-read_only_relocs,suppress
else
	@echo "Not building the GraphicsMagick/FFmpeg XPCOM component"
endif



key:
ifneq (universal, $(PLATFORM))
	@echo "Building the API key XPCOM component..."
ifeq (mac, $(PLATFORM))
	@echo "Building the API key XPT file..."
	$(GECKO_SDK)/bin/xpidl \
		-m header \
		-I$(GECKO_SDK)/idl \
		flIKey.idl
	$(GECKO_SDK)/bin/xpidl \
		-m typelib \
		-I$(GECKO_SDK)/idl \
		flIKey.idl
endif
	g++ -w -c -O2 \
		-o flKey.o \
		-I$(GECKO_SDK)/include \
		$(DEFINE) \
		flKey.cpp
	g++ -w -c -O2 \
		-o flKeyModule.o \
		-I$(GECKO_SDK)/include \
		$(DEFINE) \
		flKeyModule.cpp
	g++ -dynamiclib -O2 \
		-o key.dylib.$(PLATFORM) \
		flKey.o flKeyModule.o \
		-L$(GECKO_SDK)/lib \
		-L$(XULRUNNER) -Wl,-executable_path,$(XULRUNNER) \
		-lxpcomglue_s -lxpcom -lnspr4
else
	@echo "Not building the API key XPCOM component"
endif



clh:
	@echo "Building the CLH XPT file..."
	$(GECKO_SDK)/bin/xpidl \
		-m typelib \
		-I$(GECKO_SDK)/idl \
		flICLH.idl



gm_test:
	g++ -w -c -O2 -o gm_test.o $(GM_INCLUDE) $(EXIV_INCLUDE) gm_test.cpp
	g++ -O2 -o gm_test gm_test.o \
		$(GM_LIB) \
		$(PORTS_LIB) \
		-lGraphicsMagick++ -lGraphicsMagick \
		-lexiv2 -liconv -lexpat \
		-lz -lbz2 \
		-lxml2 \
		-ljpeg -lpng -ltiff

gm_clean:
	rm -f gm_test gm_test.o



ff_test:
	g++ -w -c -O2 -o ff_test.o \
		$(GM_INCLUDE) $(EXIV_INCLUDE) $(FF_INCLUDE) \
		ff_test.cpp
	g++ -O2 -o ff_test ff_test.o \
		$(GM_LIB) \
		$(PORTS_LIB) \
		-lavformat -lavcodec -lavutil \
		-lGraphicsMagick++ -lGraphicsMagick \
		-lexiv2 -liconv -lexpat \
		-lz -lbz2 \
		-lxml2 \
		-ljpeg -lpng -ltiff

ff_clean:
	rm -f ff_test ff_test.o



rotate:
	g++ -w -c -O2 -o rotate.o $(GM_INCLUDE) $(EXIV_INCLUDE) rotate.cpp
	g++ -O2 -o rotate rotate.o \
		$(GM_LIB) \
		$(PORTS_LIB) \
		-lGraphicsMagick++ -lGraphicsMagick \
		-lexiv2 -liconv -lexpat \
		-lz -lbz2 \
		-lxml2 \
		-ljpeg -lpng -ltiff

rotate_clean:
	rm -f rotate rotate.o
