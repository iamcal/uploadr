/*
 * Flickr Uploadr
 *
 * Copyright (c) 2007 Yahoo! Inc.  All rights reserved.  This library is free
 * software; you can redistribute it and/or modify it under the terms of the
 * GNU General Public License (GPL), version 2 only.  This library is
 * distributed WITHOUT ANY WARRANTY, whether express or implied. See the GNU
 * GPL for more details (http://www.gnu.org/licenses/gpl.html)
 */

#include "flGM.h"

// GraphicsMagick
#include "Magick++.h"

// Exiv2
#include "image.hpp"
#include "exif.hpp"
#include "iptc.hpp"

#include <stdlib.h>
#include <iostream>
#include <sstream>
#include <string>
#include <sys/stat.h>
#include "nsCOMPtr.h"
#include "nsIFile.h"
#include "nsDirectoryServiceUtils.h"
#include "nsEmbedString.h"

// _NSGetExecutablePath on Macs
#ifdef XP_MACOSX
#include <mach-o/dyld.h>
#endif

// GetShortPathName, GetWindowsDirectory and CopyFile on Windows
#ifdef XP_WIN
#include <windows.h>
#endif

#define round(n) (int)(0 <= (n) ? (n) + 0.5 : (n) - 0.5)

using namespace std;

// Prototypes
string * conv_path(const nsAString &, bool);
string * find_path(string *, const char *);
int base_orient(Exiv2::ExifData &, Magick::Image &);
void exif_update_dim(Exiv2::ExifData &, int, int);
void unconv_path(string &, nsAString &);

// Convert a path from a UTF-16 nsAString to an ASCII std::string
//   In Windows, this will handle all the Unicode weirdness paths come with
//   If is_dir is true then the returned path will transparently become an
//   ASCII-safe path, possibly to a TEMP dir
//   If is_dir is false then the path will be made safe or the file will be
//   copied under a new name to an ASCII-safe TEMP dir
string * conv_path(const nsAString & utf16, bool is_dir) {

	// Fun with Windows paths
#ifdef XP_WIN

	// Is this path outside of ASCII?
	PRUnichar * utf16_start = (PRUnichar *)utf16.BeginReading();
	const PRUnichar * utf16_end = (const PRUnichar *)utf16.EndReading();
	bool needs_unicode = false;
	while (utf16_start != utf16_end) {
		if (0x7f < *utf16_start++) {
			needs_unicode = true;
			break;
		}
	}

	// We're outside of ASCII so we need help
	if (needs_unicode) {

		// UTF-16 nsAString to wchar_t[]
		wchar_t * wide_arr = new wchar_t[utf16.Length() + 1];
		if (0 == wide_arr) return 0;
		wchar_t * wide_arr_p = wide_arr;
		PRUnichar * wide_start = (PRUnichar *)utf16.BeginReading();
		const PRUnichar * wide_end = (const PRUnichar *)utf16.EndReading();
		while (wide_start != wide_end) {
			*wide_arr_p++ = (wchar_t)*wide_start++;
		}
		*wide_arr_p = 0;

		// Try GetShortPathNameW to get ASCII in a wchar_t *
		wchar_t short_arr[4096];
		*short_arr = 0;
		if (0 == GetShortPathNameW(wide_arr, short_arr, 4096)) {

			// Try to find a TEMP directory
			//   This would be the easy way except that it will never work
			//   for users with Unicode characters in their usernames
			/*
			char temp_arr[4096];
			*temp_arr = 0;
			if (0 == GetTempPathA(4096, temp_arr)) {
				delete [] wide_arr;
				return 0;
			}
			*/

			// Try to find a TEMP directory
			//   (This is the hard way but at least it will work)
			//   Get the drive letter from the Windows directory and append
			//   :\temp, create that directory and use it for TEMP
			char win_arr[4096];
			*win_arr = 0;
			if (0 == GetWindowsDirectoryA(win_arr, 4096)) {
				delete [] wide_arr;
				return 0;
			}
			char temp_arr[9];
			temp_arr[0] = *win_arr;
			temp_arr[1] = ':'; temp_arr[2] = '\\';
			temp_arr[3] = 't'; temp_arr[4] = 'e';
			temp_arr[5] = 'm'; temp_arr[6] = 'p';
			temp_arr[7] = '\\'; temp_arr[8] = 0;
			CreateDirectoryA(temp_arr, 0);

			// Directory requests can just have the TEMP directory
			if (is_dir) {
				delete [] wide_arr;
				return new string(temp_arr);
			}

			// But if this is a file we actually need to copy it
			else {
				string base(temp_arr);
				base += "original";

				// Copy the file extension of the original to our base
				wstring wide_w(wide_arr);
				wstring ext_w = wide_w.substr(wide_w.rfind('.'));
				string ext_s;
				wchar_t * ext_p = (wchar_t *)ext_w.c_str();
				while (*ext_p) {
					ext_s += (char)*ext_p++;
				}
				base += ext_s;

				// Destination path
				string * temp = find_path(&base, "");
				wchar_t * temp_wide_arr = new wchar_t[temp->size() + 1];
				wchar_t * temp_wide_arr_p = temp_wide_arr;
				char * temp_p = (char *)temp->c_str();
				while (*temp_p) {
					*temp_wide_arr_p++ = (wchar_t)*temp_p++;
				}
				*temp_wide_arr_p = 0;

				// Copy the file
				if (0 == CopyFileW(wide_arr, temp_wide_arr, false)) {
					delete [] wide_arr;
					delete temp;
					delete [] temp_wide_arr;
					return 0;
				}
				delete [] wide_arr;
				delete [] temp_wide_arr;
				return temp;

			}

		}
		delete [] wide_arr;

		// GetShortPathNameW was successful!
		// wchar_t * to std::string
		string * short_s = new string();
		if (0 == short_s) return 0;
		wchar_t * short_arr_p = short_arr;
		while (*short_arr_p) {
			*short_s += (char)*short_arr_p++;
		}
		return short_s;

	}

	// Within ASCII, pack it down
	else {
		char * ascii_arr = new char[utf16.Length() + 1];
		if (0 == ascii_arr) return 0;
		char * ascii_arr_p = ascii_arr;
		utf16_start = (PRUnichar *)utf16.BeginReading();
		utf16_end = (const PRUnichar *)utf16.EndReading();
		while (utf16_start != utf16_end) {
			*ascii_arr_p++ = (char)*utf16_start++;
		}
		*ascii_arr_p = 0;
		string * ascii_s = new string(ascii_arr);
		delete [] ascii_arr;
		return ascii_s;
	}

	// Macs just need UTF-8
#else

	// UTF-16 nsAString to UTF-8 nsCString
	nsCString utf8 = NS_ConvertUTF16toUTF8(utf16);

	// UTF-8 nsCString to std::string
	char * utf8_arr = new char[utf8.Length() + 1];
	if (0 == utf8_arr) return 0;
	char * utf8_arr_p = utf8_arr;
	char * utf8_start = (char *)utf8.BeginReading();
	const char * utf8_end = (const char *)utf8.EndReading();
	while (utf8_start != utf8_end) {
		*utf8_arr_p++ = *utf8_start++;
	}
	*utf8_arr_p = 0;
	string * utf8_s = new string(utf8_arr);
	delete [] utf8_arr;
	return utf8_s;

#endif

}

// Find a path for the new image file in our profile
//   If extra is empty, the new path will be in the same directory,
//   otherwise it will be in the Profile
string * find_path(string * path_s, const char * extra) {
	if (0 == path_s || 0 == extra) {
		return 0;
	}
	string * dir_s = 0;
	if (*extra) {
		nsCOMPtr<nsIFile> dir_ptr;
		nsresult nsr = NS_GetSpecialDirectory("ProfD", getter_AddRefs(dir_ptr));
		if (NS_FAILED(nsr)) {
			return 0;
		}
		dir_ptr->AppendNative(NS_LITERAL_CSTRING("images"));
		PRBool dir_exists = PR_FALSE;
		dir_ptr->Exists(&dir_exists);
		if (!dir_exists) {
			dir_ptr->Create(nsIFile::DIRECTORY_TYPE, 0770);
		}
		nsEmbedString dir;
		dir_ptr->GetPath(dir);
		dir_s = conv_path(dir, true);
		if (0 == dir_s) {
			return 0;
		}
#ifdef XP_WIN
		dir_s->append(path_s->substr(path_s->rfind('\\')));
#else
		dir_s->append(path_s->substr(path_s->rfind('/')));
#endif
		size_t period = dir_s->rfind('.');
		dir_s->insert(period, extra);
	} else {
		dir_s = new string(*path_s);
		if (0 == dir_s) {
			return 0;
		}
	}
	ostringstream index;
	string dir_s_save(*dir_s);
	int i = 0;
	struct stat st;
	while (0 == stat(dir_s->c_str(), &st)) {
		index.str("");
		index << ++i;
		*dir_s = dir_s_save;
		dir_s->insert(dir_s->rfind('.'), index.str());
	}
	return dir_s;
}

// Orient an image's pixels as EXIF instructs
int base_orient(Exiv2::ExifData & exif, Magick::Image & img) {
	int orient = -1;
	try {
		orient = exif["Exif.Image.Orientation"].toLong();
		if (-1 == orient) {
			orient = exif["Exif.Panasonic.Rotation"].toLong();
		}
		if (-1 == orient) {
			orient = exif["Exif.MinoltaCs5D.Rotation"].toLong();
		}
	} catch (Exiv2::Error &) {}
	if (1 > orient || 8 < orient) {
		orient = 1;
	}
	switch (orient) {
		case 2:
			img.flop();
		break;
		case 3:
			img.rotate(180.0);
		break;
		case 4:
			img.flip();
		break;
		case 5:
			img.rotate(90.0);
			img.flip();
		break;
		case 6:
			img.rotate(90.0);
		break;
		case 7:
			img.rotate(270.0);
			img.flip();
		break;
		case 8:
			img.rotate(270.0);
		break;
		default:
		break;
	}
	return orient;
}

// Update the image width and height in EXIF
void exif_update_dim(Exiv2::ExifData & exif, int w, int h) {

	// Keys to search
	char * keys[2][4] = {

		// Width
		{
			"Exif.Iop.RelatedImageWidth",
			"Exif.Photo.PixelXDimension", // Only for compressed images
			"Exif.Image.ImageWidth", // From TIFF-land
			0
		},

		// Height
		{
			"Exif.Iop.RelatedImageLength",
			"Exif.Photo.PixelYDimension", // Only for compressed images
			"Exif.Image.ImageLength", // From TIFF-land
			0
		}

	};

	// Once for width, once for height
	int values[2] = { w, h };
	for (unsigned int i = 0; i < 2; ++i) {

		// For each key we have, if it's set, override it
		unsigned int j = 0;
		unsigned int done = 0;
		while (0 != keys[i][j]) {
			string str = string(keys[i][j]);
			Exiv2::ExifKey key = Exiv2::ExifKey(str);
			Exiv2::ExifData::iterator it = exif.findKey(key);
			if (exif.end() != it) {
				exif[keys[i][j]] = uint32_t(values[i]);
				done = 1;
			}
			++j;
		}

		// As a last resort, set the TIFF tags
		if (!done) {
			exif[keys[i][0]] = uint32_t(values[i]);
		}

	}
}

// Get a path/string ready to send back to JavaScript-land
//   On Windows there is little to do, but Macs must go from UTF-8 to UTF-16
void unconv_path(string & path_s, nsAString & _retval) {
	char * o = (char *)path_s.c_str();
#ifdef XP_MACOSX
	nsCString utf8;
#endif
	while (*o) {

		// Macs will still have UTF-8 at this point
#ifdef XP_MACOSX
		utf8.Append(*o++);

		// Windows is good to go, being ASCII and all
#else
		_retval.Append(*o++);

#endif
	}

	// Finish up the Mac transform to UTF-16
#ifdef XP_MACOSX
	_retval.Append(NS_ConvertUTF8toUTF16(utf8));
#endif

}

NS_IMPL_ISUPPORTS1(flGM, flIGM)

flGM::flGM() {
}

flGM::~flGM() {
}

// Initialize our GraphicsMagick setup
NS_IMETHODIMP flGM::Init(const nsAString & pwd) {

	//Mac needs to setup GraphicsMagick
#ifdef XP_MACOSX
	char path[1024];
	unsigned int size = 1024;
	_NSGetExecutablePath(&path[0], &size);
	Magick::InitializeMagick(&path[0]);
#endif

	// Windows needs to get its working directory ready for GraphicsMagick
#ifdef XP_WIN
	string * pwd_s = conv_path(pwd, true);
	if (0 == pwd_s) return NS_ERROR_NULL_POINTER;
	SetCurrentDirectoryA(pwd_s->c_str());
	delete pwd_s;
#endif

	return NS_OK;
}

// Create a thumbnail of the image, preserving aspect ratio and store it to the profile
NS_IMETHODIMP flGM::Thumb(PRInt32 square, const nsAString & path, nsAString & _retval) {
	string * path_s = 0;
	string * thumb_s = 0;
	try {

		// Get the path as a C++ string
		path_s = conv_path(path, false);
		if (0 == path_s) {
			return NS_ERROR_INVALID_ARG;
		}

		// Open the image
		Magick::Image img(*path_s);

		// Extract EXIF and IPTC data that we care about
		int orient = 1;
		string title = "", description = "", tags = "";
		try {
			Exiv2::Image::AutoPtr meta_r = Exiv2::ImageFactory::open(*path_s);
			meta_r->readMetadata();

			// EXIF orientation
			Exiv2::ExifData & exif = meta_r->exifData();
			orient = base_orient(exif, img);

			// IPTC metadata
			Exiv2::IptcData & iptc = meta_r->iptcData();
			title = iptc["Iptc.Application2.ObjectName"].toString();
			if (0 == title.size()) {
				title = iptc["Iptc.Application2.Headline"].toString();
			}
			description = iptc["Iptc.Application2.Caption"].toString();
			if (0 == description.size()) {
				try {
					Exiv2::ExifData & exif = meta_r->exifData();
					description = exif["Exif.Image.ImageDescription"].toString();
				} catch (Exiv2::Error &) {}
			}
			string key("Iptc.Application2.Keywords");
			Exiv2::IptcKey k = Exiv2::IptcKey(key);
			Exiv2::IptcMetadata::iterator i, ii = iptc.end();
			for (i = iptc.begin(); i != ii; ++i) {
				if (i->key() == key) {
					string val = i->toString();
					if (string::npos == val.find(" ", 0)) {
						tags += val;
					} else {
						tags += "\"";
						tags += val;
						tags += "\"";
					}
					tags += " ";
				}
			}
			tags += " ";
			string city = iptc["Iptc.Application2.City"].toString();
			if (string::npos == city.find(" ", 0)) {
				tags += city;
			} else {
				tags += "\"";
				tags += city;
				tags += "\"";
			}
			tags += " ";
			string state = iptc["Iptc.Application2.ProvinceState"].toString();
			if (string::npos == state.find(" ", 0)) {
				tags += state;
			} else {
				tags += "\"";
				tags += state;
				tags += "\"";
			}
			tags += " ";
			string country = iptc["Iptc.Application2.CountryName"].toString();
			if (string::npos == country.find(" ", 0)) {
				tags += country;
			} else {
				tags += "\"";
				tags += country;
				tags += "\"";
			}

		} catch (Exiv2::Error &) {}
		ostringstream out1;
		out1 << orient << "###";

		// Original size
		int bw, bh;
		if (5 > orient) {
			bw = img.baseColumns();
			bh = img.baseRows();
		} else {
			bw = img.baseRows();
			bh = img.baseColumns();
		}
		int base = bw > bh ? bw : bh;
		out1 << bw << "###" << bh << "###";

		// EXIF date taken
		string date_taken = img.attribute("EXIF:DateTimeOriginal");
		if (0 == date_taken.size()) {
			date_taken = img.attribute("EXIF:DateTimeDigitized");
		}
		if (0 == date_taken.size()) {
			date_taken = img.attribute("EXIF:DateTime");
		}
		out1 << date_taken << "###";

		// Thumbnail width and height
		float r;
		ostringstream dim;
		if (bw > bh) {
			r = (float)bh * (float)square / (float)bw;
			out1 << square << "###" << round(r);
			dim << square << "x" << round(r);
		} else {
			r = (float)bw * (float)square / (float)bh;
			out1 << round(r) << "###" << square;
			dim << round(r) << "x" << square;
		}
		out1 << "###";

		// Hide ### strings within the IPTC data
		size_t pos = title.find("###", 0);
		while (string::npos != pos) {
			title.replace(pos, 3, "{---THREE---POUND---DELIM---}");
			pos = title.find("###", pos);
		}
		pos = description.find("###", 0);
		while (string::npos != pos) {
			description.replace(pos, 3, "{---THREE---POUND---DELIM---}");
			pos = description.find("###", pos);
		}
		pos = tags.find("###", 0);
		while (string::npos != pos) {
			tags.replace(pos, 3, "{---THREE---POUND---DELIM---}");
			pos = tags.find("###", pos);
		}
		ostringstream out2;
		out2 << "###" << title << "###" << description << "###" << tags;

		// Create a new path
		thumb_s = find_path(path_s, "-thumb");
		if (0 == thumb_s) {
			return NS_ERROR_NULL_POINTER;
		}
		delete path_s; path_s = 0;

		// If this image is a TIFF, force the thumbnail to be a JPEG
		if (thumb_s->rfind(".tif") + 6 > thumb_s->length()) {
			thumb_s->append(".jpg");
		}

		// Find the sharpen sigma as the website does
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
		img.compressType(Magick::NoCompression);
		img.write(*thumb_s);

		// If all went well, return stuff
		string out1_s = out1.str();
		char * o = (char *)out1_s.c_str();
		nsCString utf8;
		while (*o) {
			utf8.Append(*o++);
		}
		_retval.Append(NS_ConvertUTF8toUTF16(utf8));
		unconv_path(*thumb_s, _retval);
		delete thumb_s; thumb_s = 0;
		string out2_s = out2.str();
		o = (char *)out2_s.c_str();
		utf8.Assign(NS_LITERAL_CSTRING(""));
		while (*o) {
			utf8.Append(*o++);
		}
		_retval.Append(NS_ConvertUTF8toUTF16(utf8));

		return NS_OK;
	}

	// Otherwise yell about it
	catch (Magick::Exception & e) {
		delete path_s;
		delete thumb_s;
		char * o = (char *)e.what();
		while (*o) {
			_retval.Append(*o++);
		}
	}
	return NS_OK;

}

// Rotate an image, preserving size and store it to the profile
NS_IMETHODIMP flGM::Rotate(PRInt32 degrees, const nsAString & path, nsAString & _retval) {
	string * path_s = 0;
	string * rotate_s = 0;
	try {

		// Don't rotate 0 degrees
		if (0 == degrees) {
			_retval.Append('o');
			_retval.Append('k');
			return NS_OK;
		}

		path_s = conv_path(path, false);
		if (0 == path_s) {
			return NS_ERROR_INVALID_ARG;
		}

		// Yank out all the metadata we want to save
		Exiv2::ExifData exif;
		Exiv2::IptcData iptc;
		try {
			Exiv2::Image::AutoPtr meta_r = Exiv2::ImageFactory::open(*path_s);
			meta_r->readMetadata();
			exif = meta_r->exifData();
			iptc = meta_r->iptcData();
		} catch (Exiv2::Error &) {}

		// Create a new path
		rotate_s = find_path(path_s, "-rotate");
		if (0 == rotate_s) {
			return NS_ERROR_NULL_POINTER;
		}

		// Rotate the image
		Magick::Image img(*path_s);
		delete path_s; path_s = 0;
		base_orient(exif, img);
		img.rotate(degrees);
		img.compressType(Magick::NoCompression);
		img.write(*rotate_s);

		// Set the orientation to 1 because we're orienting the pixels manually
		exif["Exif.Image.Orientation"] = uint32_t(1);

		// Put saved metadata into the resized image
		try {
			Exiv2::Image::AutoPtr meta_w = Exiv2::ImageFactory::open(*rotate_s);
			meta_w->setExifData(exif);
			meta_w->setIptcData(iptc);
			meta_w->writeMetadata();
		} catch (Exiv2::Error &) {}

		// If all went well, return new path
		rotate_s->insert(0, "ok");
		unconv_path(*rotate_s, _retval);
		delete rotate_s;
		return NS_OK;
	}

	// Otherwise yell about it
	catch (Magick::Exception & e) {
		delete path_s;
		delete rotate_s;
		char * o = (char *)e.what();
		while (*o) {
			_retval.Append(*o++);
		}
	}
	return NS_OK;

}

// Resize an image and store it to the profile
NS_IMETHODIMP flGM::Resize(PRInt32 square, const nsAString & path, nsAString & _retval) {
	string * path_s = 0;
	string * resize_s = 0;
	try {
		path_s = conv_path(path, false);
		if (0 == path_s) {
			return NS_ERROR_INVALID_ARG;
		}

		// Yank out all the metadata we want to save
		Exiv2::ExifData exif;
		Exiv2::IptcData iptc;
		try {
			Exiv2::Image::AutoPtr meta_r = Exiv2::ImageFactory::open(*path_s);
			meta_r->readMetadata();
			exif = meta_r->exifData();
			iptc = meta_r->iptcData();
		} catch (Exiv2::Error &) {}

		// Open the image
		Magick::Image img(*path_s);
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
		if (base <= square) {
			_retval = path;
			return NS_OK;
		}

		// Find resized width and height
		float r;
		ostringstream out;
		if (bw > bh) {
			r = (float)bh * (float)square / (float)bw;
			r = round(r);
			exif_update_dim(exif, square, r);
			out << square << "x" << r;
		} else {
			r = (float)bw * (float)square / (float)bh;
			r = round(r);
			exif_update_dim(exif, r, square);
			out << r << "x" << square;
		}
		string dim(out.str());

		// Create a new path
		resize_s = find_path(path_s, "-resize");
		if (0 == resize_s) {
			return NS_ERROR_NULL_POINTER;
		}
		delete path_s; path_s = 0;
		out << *resize_s;

		// Find the sharpen sigma as the website does
		//   Which is easy, because for these sizes it's just 0.95
		double sigma = 0.95;

		// Resize the image
		img.scale(dim);
		img.sharpen(1, sigma);
		img.compressType(Magick::NoCompression);
		img.write(*resize_s);

		// Put saved metadata into the resized image
		try {
			Exiv2::Image::AutoPtr meta_w = Exiv2::ImageFactory::open(*resize_s);
			meta_w->setExifData(exif);
			meta_w->setIptcData(iptc);
			meta_w->writeMetadata();
		} catch (Exiv2::Error &) {}
		delete resize_s; resize_s = 0;

		// If all went well, return stuff
		string o_s = out.str();
		unconv_path(o_s, _retval);
	
		return NS_OK;
	}

	// Otherwise yell about it
	catch (Magick::Exception & e) {
		delete path_s;
		delete resize_s;
		char * o = (char *)e.what();
		while (*o) {
			_retval.Append(*o++);
		}
	}
	return NS_OK;

}