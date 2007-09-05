#include "gm_impl.h"
#include <Magick++.h>
#include <stdlib.h>
#include <iostream>
#include <sstream>
#include <string>
#include <sys/stat.h>
#include "nsCOMPtr.h"
#include "nsDirectoryServiceUtils.h"
#include "nsIFile.h"
#ifdef XP_MACOSX
#include <mach-o/dyld.h>
#endif

#define round(n) (int)(0 <= (n) ? (n) + 0.5 : (n) - 0.5)

using namespace std;
using namespace Magick;

NS_IMPL_ISUPPORTS1(CGM, IGM)

CGM::CGM() {
#ifdef XP_MACOSX
	char path[1024];
	unsigned int size = 1024;
	_NSGetExecutablePath(&path[0], &size);
	InitializeMagick(&path[0]);
#endif
}

CGM::~CGM() {
}

// Setting and getting my name
//   Required?
NS_IMETHODIMP CGM::GetName(nsAString & aName) {
	aName.Assign(mName);
	return NS_OK;
}
NS_IMETHODIMP CGM::SetName(const nsAString & aName) {
	mName.Assign(aName);
	return NS_OK;
}

// Sample interface - add two integers
NS_IMETHODIMP CGM::Add(PRInt32 a, PRInt32 b, PRInt32 *_retval) {
	*_retval = a + b;
	return NS_OK;
}

//
// GM interface
//

// Create a thumbnail of the image, preserving aspect ratio
NS_IMETHODIMP CGM::Thumb(PRInt32 square, const nsAString & path, nsAString & _retval) {
	char * s = 0;
	try {

		// Get the path as a normal std::string
		//   Gotta find a better way to do this
		s = new char[path.Length() + 1];
		if (0 == s) return -1;
		char * tmp = s;
		const PRUnichar * start = path.BeginReading();
		const PRUnichar * end = path.EndReading();
		while (start != end) {
			*tmp++ = (char)*start++;
		}
		*tmp = 0;
		string str(s);
		delete [] s; s = 0;

		// Get the original square size
		Image img(str);
		int bw = img.baseColumns(), bh = img.baseRows();
		int base = bw > bh ? bw : bh;
		ostringstream oss;
		oss << base << "x";

		// Get EXIF date taken
		string exif = img.attribute("EXIF:DateTimeOriginal");
		if (0 == exif.size()) {
			exif = img.attribute("EXIF:DateTimeDigitized");
		}
		if (0 == exif.size()) {
			exif = img.attribute("EXIF:DateTime");
		}
		if (0 == exif.size()) {
			oss << "x";
		} else {
			oss << exif << "x";
		}

		// Find thumbnail width and height
		float r;
		ostringstream dim;
		if (bw > bh) {
			r = (float)bh * (float)square / (float)bw;
			oss << square << "x" << round(r);
			dim << square << "x" << round(r);
		} else {
			r = (float)bw * (float)square / (float)bh;
			oss << round(r) << "x" << square;
			dim << round(r) << "x" << square;
		}

		// Create a thumbnail path
		nsCOMPtr<nsIFile> dir;
		nsresult nsr = NS_GetSpecialDirectory("ProfD", getter_AddRefs(dir));
		if (NS_FAILED(nsr)) return -1;
		dir->AppendNative(NS_LITERAL_CSTRING("thumbs"));
		PRBool dir_exists = PR_FALSE;
		dir->Exists(&dir_exists);
		if (!dir_exists) dir->Create(nsIFile::DIRECTORY_TYPE, 0770);
		nsString dir_str;
		dir->GetPath(dir_str);
		start = dir_str.BeginReading();
		end = dir_str.EndReading();
		string thumb;
		while (start != end) {
			thumb += (char)*start++;
		}
#ifdef XP_WIN
		thumb.append(str.substr(str.rfind('\\')));
#else
		thumb.append(str.substr(str.rfind('/')));
#endif
		size_t period = thumb.rfind('.');
		thumb.insert(period, "-thumb");
		ostringstream index;
		string thumb2(thumb);
		int i = 0;
		struct stat st;
		while (0 == stat(thumb.c_str(), &st)) {
			index.str("");
			index << ++i;
			thumb = thumb2;
			thumb.insert(thumb.rfind('.'), index.str());
		}
		oss << thumb;

		// Find the sharpen sigma as in flickr/include/daemon_new.js
		double sigma;
		if (base <= 800) {
			sigma = 1.9;
		} else if (base <= 1600) {
			sigma = 2.85;
		} else {
			sigma = 3.8;
		}

		// Create the actual thumbnail
		img.scale(dim.str());
		img.sharpen(1, sigma);
		img.write(thumb);

		// If all went well, return stuff
		string o_str = oss.str();
		char * o = (char *)o_str.c_str();
		while (*o) {
			_retval.Append(*o);
			++o;
		}
		return NS_OK;
	}

	// Otherwise yell about it
	catch (Exception & e) {
		char * foo = (char *)e.what();
		while (*foo) {
			_retval.Append(*foo);
			++foo;
		}
	}
	delete [] s;
	return NS_OK;
}

// Create a thumbnail of the image, preserving aspect ratio
NS_IMETHODIMP CGM::Rotate(PRInt32 degrees, const nsAString & path, nsAString & _retval) {
	char * s = 0;
	try {

		// Get the path as a normal std::string
		//   Gotta find a better way to do this
		s = new char[path.Length() + 1];
		if (0 == s) return -1;
		char * tmp = s;
		const PRUnichar * start = path.BeginReading();
		const PRUnichar * end = path.EndReading();
		while (start != end) {
			*tmp++ = (char)*start++;
		}
		*tmp = 0;
		string str(s);
		delete [] s; s = 0;

		// Rotate the image
		//   TODO: Save EXIF and IPTC profiles
		Image img(str);
		img.rotate(degrees);
		img.write(str);

		// If all went well, return ok
		_retval.Append('o');
		_retval.Append('k');
		return NS_OK;
	}

	// Otherwise yell about it
	catch (Exception & e) {
		char * foo = (char *)e.what();
		while (*foo) {
			_retval.Append(*foo);
			++foo;
		}
	}
	delete [] s;
	return NS_OK;
}

NS_IMETHODIMP CGM::Resize(PRInt32 square, const nsAString & path, nsAString & _retval) {
	char * s = 0;
	try {

		// Get the path as a normal std::string
		//   Gotta find a better way to do this
		s = new char[path.Length() + 1];
		if (0 == s) return -1;
		char * tmp = s;
		const PRUnichar * start = path.BeginReading();
		const PRUnichar * end = path.EndReading();
		while (start != end) {
			*tmp++ = (char)*start++;
		}
		*tmp = 0;
		string str(s);
		delete [] s; s = 0;

		// Open the image
		Image img(str);
		int bw = img.baseColumns(), bh = img.baseRows();
		int base = bw > bh ? bw : bh;

		// In the special -1 case, find the next-smallest size to scale to
		if (-1 == square) {
			if (base > 2048) {
				square = 2048;
			} else if (base > 1600) {
				square = 1600;
			} else if (base > 1280) {
				square = 1280;
			} else {
				square = 800;
			}
		}

		// Don't resize if we're already that size
		if (base < square) {
			_retval.Append('o');
			_retval.Append('k');
			return NS_OK;
		}

		// Find resized width and height
		float r;
		ostringstream oss;
		if (bw > bh) {
			r = (float)bh * (float)square / (float)bw;
			oss << square << "x" << round(r);
		} else {
			r = (float)bw * (float)square / (float)bh;
			oss << round(r) << "x" << square;
		}
		string dim(oss.str());

		// Find the sharpen sigma as in flickr/include/daemon_new.js
		//   Which is dumb, because right now it's just 0.95
		double sigma = 0.95;

		// Resize the image
		//   TODO: Save EXIF and IPTC profiles
		img.scale(dim);
		img.sharpen(1, sigma);
		img.write(str);

		// If all went well, return ok
		_retval.Append('o');
		_retval.Append('k');
		return NS_OK;
	}

	// Otherwise yell about it
	catch (Exception & e) {
		char * foo = (char *)e.what();
		while (*foo) {
			_retval.Append(*foo);
			++foo;
		}
	}
	delete [] s;
	return NS_OK;
}