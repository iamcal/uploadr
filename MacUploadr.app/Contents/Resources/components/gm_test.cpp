#include <Magick++.h>
#include <stdio.h>
#include <string>

using namespace std;
using namespace Magick;

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
		try {

			// Time opening an image
			string path_s(path);
			start_timer();
			Image img(path_s);
			double open = stop_timer();
			printf("%s: %f\n", path, open);

		} catch (Exception & e) {
			printf("Error trying to open %s (%s).\n", path, e.what());
			return 1;
		}
	} else {
		printf("Usage: %s <image-file>\n", *argv);
		return 1;
	}

	return 0;
}