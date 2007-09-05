all: 
	@echo "Targets:"
	@echo "  mac"
	@echo "  ppc"
	@echo "  linux"

mac:
	make -f mac.mk

ppc:
	make -f ppc.mk

linux:
	make -f linux.mk

test:
	g++ -w -c -o gm_test.o -I/usr/local/include/GraphicsMagick gm_test.cpp
	g++ -o gm_test gm_test.o -L/usr/local/lib -L/usr/X11R6/lib \
	-L/Developer/SDKs/MacOSX10.4u.sdk/usr/lib -L/opt/local/lib -lGraphicsMagick++ \
	-lGraphicsMagick -lX11 -lz -lbz2 -lxml2 -lXext -ljpeg -lpng -lungif