GECKO_SDK := ../gecko-sdk.mac
GM_INCLUDE := /usr/local/include/GraphicsMagick
GM_LIB := /usr/local/lib
EXIV_INCLUDE := /usr/local/include/exiv2
#EXIV_LIB := /usr/local/lib # Same as GraphicsMagick lib
X11_LIB := /usr/X11R6/lib
PORTS_LIB := /opt/local/lib
XULRUNNER := ../../Frameworks/XUL.framework/Versions/Current
DEFINE := -DXP_UNIX -DXP_MACOSX

all:

gm: gm_xpt gm_dylib

gm_xpt:
	$(GECKO_SDK)/bin/xpidl -m header -I$(GECKO_SDK)/idl gm.idl
	$(GECKO_SDK)/bin/xpidl -m typelib -I$(GECKO_SDK)/idl gm.idl

gm_impl:
	g++ -w -c -o gm_impl.o -I$(GECKO_SDK)/include -I$(GM_INCLUDE) \
	-I$(EXIV_INCLUDE) $(DEFINE) gm_impl.cpp

gm_module:
	g++ -w -c -o gm_module.o -I$(GECKO_SDK)/include -I$(GM_INCLUDE) \
	-I$(EXIV_INCLUDE) $(DEFINE) gm_module.cpp

gm_dylib: gm_impl gm_module
	g++ -v -dynamiclib -o gm.dylib.mac gm_impl.o gm_module.o \
	-L$(GECKO_SDK)/lib -L$(GM_LIB) -L$(X11_LIB) -L$(PORTS_LIB) -L$(XULRUNNER) \
	-Wl,-executable_path,$(XULRUNNER) -lxpcomglue_s -lxpcom -lnspr4 \
	-lGraphicsMagick -lGraphicsMagick++ -lexiv2 -lX11 -lz -lbz2 -lxml2 -lXext \
	-ljpeg -lpng

secret: secret_xpt secret_dylib

secret_xpt:
	$(GECKO_SDK)/bin/xpidl -m header -I$(GECKO_SDK)/idl secret.idl
	$(GECKO_SDK)/bin/xpidl -m typelib -I$(GECKO_SDK)/idl secret.idl

secret_impl:
	g++ -w -c -o secret_impl.o -I$(GECKO_SDK)/include $(DEFINE) secret_impl.cpp

secret_module:
	g++ -w -c -o secret_module.o -I$(GECKO_SDK)/include $(DEFINE) secret_module.cpp

secret_dylib: secret_impl secret_module
	g++ -v -dynamiclib -o secret.dylib.mac secret_impl.o secret_module.o \
	-L$(GECKO_SDK)/lib -L$(GM_LIB) -L$(X11_LIB) -L$(PORTS_LIB) -L$(XULRUNNER) \
	-Wl,-executable_path,$(XULRUNNER) -lxpcomglue_s -lxpcom -lnspr4 \
	-lGraphicsMagick -lGraphicsMagick++ -lexiv2 -lX11 -lz -lbz2 -lxml2 -lXext \
	-ljpeg -lpng
