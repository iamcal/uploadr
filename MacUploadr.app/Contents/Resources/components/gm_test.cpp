#include <Magick++.h>
#include <stdio.h>
#include <string>
//#include <sys/stat.h>

using namespace std;
using namespace Magick;

/*
// Fake gettimeofday on Windows
#ifdef XP_WIN
#include <windows.h>
#if defined(_MSC_VER) || defined(_MSC_EXTENSIONS)
#define DELTA_EPOCH_IN_MICROSECS  11644473600000000Ui64
#else
#define DELTA_EPOCH_IN_MICROSECS  11644473600000000ULL
#endif
struct timezone {
	int  tz_minuteswest;
	int  tz_dsttime;
};
int gettimeofday(struct timeval *tv, struct timezone *tz) {
	FILETIME ft;
	unsigned __int64 tmpres = 0;
	static int tzflag;
	if (NULL != tv) {
		GetSystemTimeAsFileTime(&ft);
		tmpres |= ft.dwHighDateTime;
		tmpres <<= 32;
		tmpres |= ft.dwLowDateTime;
		tmpres -= DELTA_EPOCH_IN_MICROSECS;
		tmpres /= 10;
		tv->tv_sec = (long)(tmpres / 1000000UL);
		tv->tv_usec = (long)(tmpres % 1000000UL);
	}
	if (NULL != tz) {
		if (!tzflag) {
			_tzset();
			tzflag++;
		}
		tz->tz_minuteswest = _timezone / 60;
		tz->tz_dsttime = _daylight;
	}
	return 0;
}
#else
#include <sys/time.h>
#endif

// Cheesy code timing
struct timeval first;
struct timeval last;
void start_timer() {
	gettimeofday(&first, 0);
}
void stop_timer(nsAString & _retval) {
	gettimeofday(&last, 0);
	double runtime = ((double)last.tv_sec + (double)last.tv_usec / 1000000) -
		((double)first.tv_sec + (double)first.tv_usec / 1000000);
	ostringstream oss;
	oss << runtime << ";";
	string s = oss.str();
	char * c = (char *)s.c_str();
	int i = 0;
	while (*c) {
		_retval.Insert(*c, i++);
		++c;
	}
}
*/

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