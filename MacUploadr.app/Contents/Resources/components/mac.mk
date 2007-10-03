GECKO_SDK := ../gecko-sdk.mac
GM_INCLUDE := /usr/local/include/GraphicsMagick
GM_LIB := /usr/local/lib
EXIV_INCLUDE := /usr/local/include/exiv2
#EXIV_LIB := /usr/local/lib # Same as GraphicsMagick lib
X11_LIB := /usr/X11R6/lib
PORTS_LIB := /opt/local/lib
XULRUNNER := ../../Frameworks/XUL.framework/Versions/Current
DEFINE := -DXP_UNIX -DXP_MACOSX

all: xpt dylib

xpt:
	$(GECKO_SDK)/bin/xpidl -m header -I$(GECKO_SDK)/idl gm.idl
	$(GECKO_SDK)/bin/xpidl -m typelib -I$(GECKO_SDK)/idl gm.idl

impl:
	g++ -arch i386 -w -c -o gm_impl.o -I$(GECKO_SDK)/include -I$(GM_INCLUDE) \
	-I$(EXIV_INCLUDE) $(DEFINE) gm_impl.cpp

module:
	g++ -arch i386 -w -c -o gm_module.o -I$(GECKO_SDK)/include -I$(GM_INCLUDE) \
	-I$(EXIV_INCLUDE) $(DEFINE) gm_module.cpp

dylib: impl module
	g++ -arch i386 -v -dynamiclib -o gm.dylib.mac gm_impl.o gm_module.o \
	-L$(GECKO_SDK)/lib -L$(GM_LIB) -L$(X11_LIB) -L$(PORTS_LIB) -L$(XULRUNNER) \
	-Wl,-executable_path,$(XULRUNNER) -lxpcomglue_s -lxpcom -lnspr4 \
	-lGraphicsMagick -lGraphicsMagick++ -lexiv2 -lX11 -lz -lbz2 -lxml2 -lXext \
	-ljpeg -lpng