#include <stdio.h>
#include <string>

// GraphicsMagick
#include "Magick++.h"

// Exiv2
#include "image.hpp"
#include "exif.hpp"
#include "iptc.hpp"

//#include "nsStringAPI.h"

using namespace std;

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
double stop_timer() {
	gettimeofday(&last, 0);
	return ((double)last.tv_sec + (double)last.tv_usec / 1000000) -
		((double)first.tv_sec + (double)first.tv_usec / 1000000);
}

int main(int argc, char * * argv) {

	// Must have one argument, which is a file path
	if (2 == argc) {
		char * path = *(argv + 1);
		string path_s(path);
		try {

			// Time opening an image
			/*
			start_timer();
			Magick::Image img(path_s);
			double open = stop_timer();
			printf("%s: %f\n", path, open);
			*/

			// Gimme IPTC
			/*
			Exiv2::Image::AutoPtr meta_r = Exiv2::ImageFactory::open(path_s);
			meta_r->readMetadata();
			Exiv2::IptcData & iptc = meta_r->iptcData();
			*/

			// Check keywords in IPTC data
			/*
			string tags = iptc["Iptc.Application2.Keywords"].toString();
			string tags2 = iptc["Iptc.Application2.Keywords"].toString();
			printf("Keywords: %s\n", tags.c_str());
			printf("Keywords 2: %s\n", tags2.c_str());
			*/
			/*
			string key("Iptc.Application2.Keywords");
			Exiv2::IptcKey k = Exiv2::IptcKey(key);
			Exiv2::IptcMetadata::iterator i, ii = iptc.end();
			for (i = iptc.begin(); i != ii; ++i) {
				if (i->key() == key) {
					printf("%s\n", i->toString().c_str());
				}
			}
			*/

			// Test funny characters
			//printf("%s\n", iptc["Iptc.Application2.ObjectName"].toString().c_str());

			// Step through UTF8 to UTF16 with 0xC28E crap from Kathryn Yu
			// ?

		} catch (Magick::Exception & e) {
			printf("[GraphicsMagick] %s: %s\n", path, e.what());
			return 1;
		} catch (Exiv2::Error & e) {
			printf("[Exiv2] %s: %s\n", path, e.what());
			return 1;
		}
	} else {
		printf("Usage: %s <image-file>\n", *argv);
		return 1;
	}
	return 0;
}
