#
# Flickr Uploadr
#
# Copyright (c) 2007 Yahoo! Inc.  All rights reserved.  This library is free
# software; you can redistribute it and/or modify it under the terms of the
# GNU General Public License (GPL), version 2 only.  This library is
# distributed WITHOUT ANY WARRANTY, whether express or implied. See the GNU
# GPL for more details (http://www.gnu.org/licenses/gpl.html)
#

# Headers and libraries
GECKO_SDK := ../gecko-sdk
GM_INCLUDE := /usr/local/include/GraphicsMagick
GM_LIB := /usr/local/lib
EXIV_INCLUDE := /usr/local/include/exiv2
#EXIV_LIB := /usr/local/lib # Same as GraphicsMagick lib
X11_LIB := /usr/X11R6/lib
PORTS_LIB := /opt/local/lib
XULRUNNER := ../../Frameworks/XUL.framework/Versions/Current

PLATFORM := $(filter mac ppc linux universal, $(MAKECMDGOALS))
COMPONENT := $(filter gm key, $(MAKECMDGOALS))

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
	@echo "Building the GraphicsMagick XPCOM component..."
ifeq (mac, $(PLATFORM))
	@echo "Building XPT file..."
	$(GECKO_SDK).$(PLATFORM)/bin/xpidl \
		-m header \
		-I$(GECKO_SDK).$(PLATFORM)/idl \
		flIGM.idl
	$(GECKO_SDK).$(PLATFORM)/bin/xpidl \
		-m typelib \
		-I$(GECKO_SDK).$(PLATFORM)/idl \
		flIGM.idl
endif
	g++ -w -c -O2 \
		-o flGM.o \
		-I$(GECKO_SDK).$(PLATFORM)/include \
		-I$(GM_INCLUDE) \
		-I$(EXIV_INCLUDE) \
		$(DEFINE) \
		flGM.cpp
	g++ -w -c -O2 \
		-o flGMModule.o \
		-I$(GECKO_SDK).$(PLATFORM)/include \
		-I$(GM_INCLUDE) \
		-I$(EXIV_INCLUDE) \
		$(DEFINE) \
		flGMModule.cpp
#	g++ -dynamiclib -O2 \
#		-o gm.dylib.$(PLATFORM) \
#		flGM.o flGMModule.o \
#		-L$(GECKO_SDK).$(PLATFORM)/lib \
#		-L$(GM_LIB) \
#		-L$(X11_LIB) \
#		-L$(PORTS_LIB) \
#		-L$(XULRUNNER) -Wl,-executable_path,$(XULRUNNER) \
#		-lxpcomglue_s -lxpcom -lnspr4 \
#		-lGraphicsMagick -lGraphicsMagick++ \
#		-lexiv2 \
#		-lX11 \
#		-lz -lbz2 \
#		-lxml2 \
3		-lXext \
#		-ljpeg -lpng -ltiff
	g++ -dynamiclib -O2 \
		-o gm.dylib.$(PLATFORM) \
		flGM.o flGMModule.o \
		-L$(GECKO_SDK).$(PLATFORM)/lib \
		-L$(GM_LIB) \
		-L$(PORTS_LIB) \
		-L$(XULRUNNER) -Wl,-executable_path,$(XULRUNNER) \
		-lxpcomglue_s -lxpcom -lnspr4 \
		-lGraphicsMagick -lGraphicsMagick++ \
		-lexiv2 \
		-lz -lbz2 \
		-lxml2 \
		-ljpeg -lpng -ltiff
else
	@echo "Not building the GraphicsMagick XPCOM component"
endif



key:
ifneq (universal, $(PLATFORM))
	@echo "Building the API key XPCOM component..."
ifeq (mac, $(PLATFORM))
	@echo "Building XPT file..."
	$(GECKO_SDK).$(PLATFORM)/bin/xpidl \
		-m header \
		-I$(GECKO_SDK).$(PLATFORM)/idl \
		flIKey.idl
	$(GECKO_SDK).$(PLATFORM)/bin/xpidl \
		-m typelib \
		-I$(GECKO_SDK).$(PLATFORM)/idl \
		flIKey.idl
endif
	g++ -w -c -O2 \
		-o flKey.o \
		-I$(GECKO_SDK).$(PLATFORM)/include \
		$(DEFINE) \
		flKey.cpp
	g++ -w -c -O2 \
		-o flKeyModule.o \
		-I$(GECKO_SDK).$(PLATFORM)/include \
		$(DEFINE) \
		flKeyModule.cpp
	g++ -dynamiclib -O2 \
		-o key.dylib.$(PLATFORM) \
		flKey.o flKeyModule.o \
		-L$(GECKO_SDK).$(PLATFORM)/lib \
		-L$(XULRUNNER) -Wl,-executable_path,$(XULRUNNER) \
		-lxpcomglue_s -lxpcom -lnspr4
else
	@echo "Not building the API key XPCOM component"
endif



test:
	g++ -w -c -O2 -o gm_test.o -I$(GM_INCLUDE) -I$(EXIV_INCLUDE) gm_test.cpp
	g++ -O2 -o gm_test gm_test.o \
		-L$(GM_LIB) \
		-L$(X11_LIB) \
		-L$(PORTS_LIB) \
		-lGraphicsMagick++ -lGraphicsMagick \
		-lexiv2 \
		-lX11 \
		-lz -lbz2 \
		-lxml2 \
		-lXext \
		-ljpeg -lpng -ltiff
