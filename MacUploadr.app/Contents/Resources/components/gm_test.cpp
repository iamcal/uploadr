#include <Magick++.h>
#include <stdio.h>
#include <string>
//#include <sys/stat.h>

using namespace std;
using namespace Magick;

#define PATH "/Users/rcrowley/Desktop/crap/IMG_1725 copy.JPG"

// What should this program do?
#define PRINT 1
#define ROTATE 0

void print_blob(Blob & b) {
	char * p = (char *)b.data();
	int l = (unsigned int)b.length();
	for (unsigned int i = 0; i < l; ++i) {
		char c = (char)*p;
		if (0 == c) {
//			printf("0");
		} else if (128 == 0x80 & c) {
			printf("%c", ~0x80 & c);
		} else {
			printf("%c", c);
		}
		++p;
	}
	printf("\n");
}

int main(int, char * *) {

	Image img(PATH);

#if PRINT
	printf("EXIF\n");
	try {
		Blob exif = img.profile("EXIF");
		print_blob(exif);
	} catch (Exception & e) {
		printf("%s\n", e.what());
	}
	printf("\nIPTC\n");
	try {
		Blob iptc = img.profile("IPTC");
		print_blob(iptc);
	} catch (Exception & e) {
		printf("%s\n", e.what());
	}
	printf("\nIPTC using iptcProfile() instead\n");
	try {
		Blob iptc2 = img.iptcProfile();
		print_blob(iptc2);
	} catch (Exception & e) {
		printf("%s\n", e.what());
	}
	printf("\n*, which is theoretically everything\n");
	try {
		Blob star = img.profile("*");
		print_blob(star);
	} catch (Exception & e) {
		printf("%s\n", e.what());
	}
#endif

#if ROTATE
	Blob exif = img.profile("EXIF");
	img.rotate(90);
	img.profile("EXIF", exif);
	img.write(PATH);
#endif

	return 0;
}