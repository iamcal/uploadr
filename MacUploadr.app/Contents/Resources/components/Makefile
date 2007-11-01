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
COMPONENT := $(filter gm secret, $(MAKECMDGOALS))

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
	@echo "  secret"
	@echo "Steps:"
	@echo "  xpt (Works on Intel Mac only)"
	@echo "  dylib"
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
		gm.idl
	$(GECKO_SDK).$(PLATFORM)/bin/xpidl \
		-m typelib \
		-I$(GECKO_SDK).$(PLATFORM)/idl \
		gm.idl
endif
	g++ -w -c \
		-o gm_impl.o \
		-I$(GECKO_SDK).$(PLATFORM)/include \
		-I$(GM_INCLUDE) \
		-I$(EXIV_INCLUDE) \
		$(DEFINE) \
		gm_impl.cpp
	g++ -w -c \
		-o gm_module.o \
		-I$(GECKO_SDK).$(PLATFORM)/include \
		-I$(GM_INCLUDE) \
		-I$(EXIV_INCLUDE) \
		$(DEFINE) \
		gm_module.cpp
	g++ -dynamiclib \
		-o gm.dylib.$(PLATFORM) \
		gm_impl.o gm_module.o \
		-L$(GECKO_SDK).$(PLATFORM)/lib \
		-L$(GM_LIB) \
		-L$(X11_LIB) \
		-L$(PORTS_LIB) \
		-L$(XULRUNNER) -Wl,-executable_path,$(XULRUNNER) \
		-lxpcomglue_s -lxpcom -lnspr4 \
		-lGraphicsMagick -lGraphicsMagick++ \
		-lexiv2 \
		-lX11 \
		-lz -lbz2 \
		-lxml2 \
		-lXext \
		-ljpeg -lpng
else
	@echo "Not building the GraphicsMagick XPCOM component"
endif



secret:
ifneq (universal, $(PLATFORM))
	@echo "Building the API Secret XPCOM component..."
ifeq (mac, $(PLATFORM))
	@echo "Building XPT file..."
	$(GECKO_SDK).$(PLATFORM)/bin/xpidl \
		-m header \
		-I$(GECKO_SDK).$(PLATFORM)/idl \
		secret.idl
	$(GECKO_SDK).$(PLATFORM)/bin/xpidl \
		-m typelib \
		-I$(GECKO_SDK).$(PLATFORM)/idl \
		secret.idl
endif
	g++ -w -c \
		-o secret_impl.o \
		-I$(GECKO_SDK).$(PLATFORM)/include \
		$(DEFINE) \
		secret_impl.cpp
	g++ -w -c \
		-o secret_module.o \
		-I$(GECKO_SDK).$(PLATFORM)/include \
		$(DEFINE) \
		secret_module.cpp
	g++ -dynamiclib \
		-o secret.dylib.$(PLATFORM) \
		secret_impl.o secret_module.o \
		-L$(GECKO_SDK).$(PLATFORM)/lib \
		-L$(XULRUNNER) -Wl,-executable_path,$(XULRUNNER) \
		-lxpcomglue_s -lxpcom -lnspr4
else
	@echo "Not building the API Secret XPCOM component"
endif



test:
	g++ -w -c -o gm_test.o -I/usr/local/include/GraphicsMagick gm_test.cpp
	g++ -o gm_test gm_test.o -L/usr/local/lib -L/usr/X11R6/lib \
	-L/Developer/SDKs/MacOSX10.4u.sdk/usr/lib -L/opt/local/lib \
	-lGraphicsMagick++ -lGraphicsMagick -lX11 -lz -lbz2 -lxml2 -lXext \
	-ljpeg -lpng -lungif
