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
#ifdef XP_MACOSX
#include <mach-o/dyld.h>
#endif

#define round(n) (int)(0 <= (n) ? (n) + 0.5 : (n) - 0.5)

using namespace std;

// Convert an nsAString to a std::string
string * conv_str(const nsAString & nsa) {
	char * s = 0;
	s = new char[nsa.Length() + 1];
	if (0 == s) return 0;
	char * tmp = s;
	const PRUnichar * start = nsa.BeginReading();
	const PRUnichar * end = nsa.EndReading();
	while (start != end) {
		*tmp++ = (char)*start++;
	}
	*tmp = 0;
	string * str = new string(s);
	delete [] s; s = 0;
	return str;
}

// Find a path for the new image file
string * find_path(string * path_str, const char * extra) {
	if (0 == path_str || 0 == extra) {
		return 0;
	}
	string * dir_str = 0;
	try {
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
		nsString dir;
		dir_ptr->GetPath(dir);
		dir_str = conv_str(dir);
		if (0 == dir_str) {
			return 0;
		}
#ifdef XP_WIN
		dir_str->append(path_str->substr(path_str->rfind('\\')));
#else
		dir_str->append(path_str->substr(path_str->rfind('/')));
#endif
		size_t period = dir_str->rfind('.');
		dir_str->insert(period, extra);
		ostringstream index;
		string dir_str_save(*dir_str);
		int i = 0;
		struct stat st;
		while (0 == stat(dir_str->c_str(), &st)) {
			index.str("");
			index << ++i;
			*dir_str = dir_str_save;
			dir_str->insert(dir_str->rfind('.'), index.str());
		}
		return dir_str;
	} catch (Magick::Exception &) {
		delete dir_str;
		return 0;
	}
}

// Orient an image's pixels as EXIF instructs
int base_orient(Magick::Image & img) {
	string orientation = img.attribute("EXIF:Orientation");
	int orient = (int)*orientation.c_str() - 0x30;
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

NS_IMPL_ISUPPORTS1(flGM, flIGM)

flGM::flGM() {
#ifdef XP_MACOSX
	char path[1024];
	unsigned int size = 1024;
	_NSGetExecutablePath(&path[0], &size);
	Magick::InitializeMagick(&path[0]);
#endif
}

flGM::~flGM() {
}

// Create a thumbnail of the image, preserving aspect ratio and store it to the profile
NS_IMETHODIMP flGM::Thumb(PRInt32 square, const nsAString & path, nsAString & _retval) {
	string * path_str = 0;
	string * thumb_str = 0;
	try {

		path_str = conv_str(path);
		if (0 == path_str) {
			return NS_ERROR_INVALID_ARG;
		}

		// Orient the image properly and return the orientation
		Magick::Image img(*path_str);
		ostringstream out;
		int orient = base_orient(img);
		out << orient << "###";

		// Get the original size
		int bw, bh;
		if (5 > orient) {
			bw = img.baseColumns();
			bh = img.baseRows();
		} else {
			bw = img.baseRows();
			bh = img.baseColumns();
		}
		int base = bw > bh ? bw : bh;
		out << bw << "###" << bh << "###";

		// Get EXIF date taken
		string date_taken = img.attribute("EXIF:DateTimeOriginal");
		if (0 == date_taken.size()) {
			date_taken = img.attribute("EXIF:DateTimeDigitized");
		}
		if (0 == date_taken.size()) {
			date_taken = img.attribute("EXIF:DateTime");
		}
		out << date_taken << "###";

		// Find thumbnail width and height
		float r;
		ostringstream dim;
		if (bw > bh) {
			r = (float)bh * (float)square / (float)bw;
			out << square << "###" << round(r);
			dim << square << "x" << round(r);
		} else {
			r = (float)bw * (float)square / (float)bh;
			out << round(r) << "###" << square;
			dim << round(r) << "x" << square;
		}
		out << "###";

		// Extract IPTC data that we care about
		string title = "", description = "", tags = "";
		try {
			Exiv2::Image::AutoPtr meta_r = Exiv2::ImageFactory::open(*path_str);
			meta_r->readMetadata();
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
			tags = iptc["Iptc.Application2.Keywords"].toString();
			tags.append(" ");
			tags.append(iptc["Iptc.Application2.City"].toString());
			tags.append(" ");
			tags.append(iptc["Iptc.Application2.ProvinceState"].toString());
			tags.append(" ");
			tags.append(iptc["Iptc.Application2.CountryName"].toString());
		} catch (Exiv2::Error &) {}

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
		out << title << "###" << description << "###" << tags << "###";

		// Create a new path
		thumb_str = find_path(path_str, "-thumb");
		if (0 == thumb_str) {
			return NS_ERROR_NULL_POINTER;
		}
		delete path_str; path_str = 0;

		// If this image is a TIFF, force the thumbnail to be a JPEG
		if (thumb_str->rfind(".tif") + 6 > thumb_str->length()) {
			thumb_str->append(".jpg");
		}
		out << *thumb_str;

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
		img.write(*thumb_str);

		// If all went well, return stuff
		string o_str = out.str();
		delete thumb_str; thumb_str = 0;
		char * o = (char *)o_str.c_str();
		while (*o) {
			_retval.Append(*o);
			++o;
		}

		return NS_OK;
	}

	// Otherwise yell about it
	catch (Magick::Exception & e) {
		delete path_str;
		delete thumb_str;
		char * o = (char *)e.what();
		while (*o) {
			_retval.Append(*o);
			++o; 
		}
	}
	return NS_OK;

}

// Rotate an image, preserving size and store it to the profile
NS_IMETHODIMP flGM::Rotate(PRInt32 degrees, const nsAString & path, nsAString & _retval) {
	string * path_str = 0;
	string * rotate_str = 0;
	try {

		// Don't rotate 0 degrees
		if (0 == degrees) {
			_retval.Append('o');
			_retval.Append('k');
			return NS_OK;
		}

		path_str = conv_str(path);
		if (0 == path_str) {
			return NS_ERROR_INVALID_ARG;
		}

		// Yank out all the metadata we want to save
		Exiv2::ExifData exif;
		Exiv2::IptcData iptc;
		try {
			Exiv2::Image::AutoPtr meta_r = Exiv2::ImageFactory::open(*path_str);
			meta_r->readMetadata();
			exif = meta_r->exifData();
			iptc = meta_r->iptcData();
		} catch (Exiv2::Error &) {}

		// Create a new path
		rotate_str = find_path(path_str, "-rotate");
		if (0 == rotate_str) {
			return NS_ERROR_NULL_POINTER;
		}

		// Rotate the image
		Magick::Image img(*path_str);
		delete path_str; path_str = 0;
		base_orient(img);
		img.rotate(degrees);
		img.compressType(Magick::NoCompression);
		img.write(*rotate_str);

		// Set the orientation to 1 because we're orienting the pixels manually
		exif["Exif.Image.Orientation"] = uint32_t(1);

		// Put saved metadata into the resized image
		try {
			Exiv2::Image::AutoPtr meta_w = Exiv2::ImageFactory::open(*rotate_str);
			meta_w->setExifData(exif);
			meta_w->setIptcData(iptc);
			meta_w->writeMetadata();
		} catch (Exiv2::Error &) {}

		// If all went well, return new path
		_retval.Append('o');
		_retval.Append('k');
		char * o = (char *)rotate_str->c_str();
		while (*o) {
			_retval.Append(*o);
			++o;
		}
		delete rotate_str;
		return NS_OK;
	}

	// Otherwise yell about it
	catch (Magick::Exception & e) {
		delete path_str;
		delete rotate_str;
		char * o = (char *)e.what();
		while (*o) {
			_retval.Append(*o);
			++o;
		}
	}
	return NS_OK;

}

// Resize an image and store it to the profile
NS_IMETHODIMP flGM::Resize(PRInt32 square, const nsAString & path, nsAString & _retval) {
	string * path_str = 0;
	string * resize_str = 0;
	try {
		path_str = conv_str(path);
		if (0 == path_str) {
			return NS_ERROR_INVALID_ARG;
		}

		// Yank out all the metadata we want to save
		Exiv2::ExifData exif;
		Exiv2::IptcData iptc;
		try {
			Exiv2::Image::AutoPtr meta_r = Exiv2::ImageFactory::open(*path_str);
			meta_r->readMetadata();
			exif = meta_r->exifData();
			iptc = meta_r->iptcData();
		} catch (Exiv2::Error &) {}

		// Open the image
		Magick::Image img(*path_str);
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
		resize_str = find_path(path_str, "-resize");
		if (0 == resize_str) {
			return NS_ERROR_NULL_POINTER;
		}
		delete path_str; path_str = 0;
		out << *resize_str;

		// Find the sharpen sigma as the website does
		//   Which is easy, because for these sizes it's just 0.95
		double sigma = 0.95;

		// Resize the image
		img.scale(dim);
		img.sharpen(1, sigma);
		img.compressType(Magick::NoCompression);
		img.write(*resize_str);

		// Put saved metadata into the resized image
		try {
			Exiv2::Image::AutoPtr meta_w = Exiv2::ImageFactory::open(*resize_str);
			meta_w->setExifData(exif);
			meta_w->setIptcData(iptc);
			meta_w->writeMetadata();
		} catch (Exiv2::Error &) {}

		// If all went well, return stuff
		string o_str = out.str();
		delete resize_str; resize_str = 0;
		char * o = (char *)o_str.c_str();
		while (*o) {
			_retval.Append(*o);
			++o;
		}
		return NS_OK;
	}

	// Otherwise yell about it
	catch (Magick::Exception & e) {
		delete path_str;
		delete resize_str;
		char * o = (char *)e.what();
		while (*o) {
			_retval.Append(*o);
			++o;
		}
	}
	return NS_OK;

}