#include <string>
#include <stdio.h>

// GraphicsMagick
#include "Magick++.h"

// Exiv2
#include "image.hpp"
#include "exif.hpp"
#include "iptc.hpp"

#define NS_OK 0
#define NS_ERROR_INVALID_ARG 1
#define NS_ERROR_NULL_POINTER 2

using namespace std;

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

//NS_IMETHODIMP flGM::Rotate(PRInt32 degrees, const nsAString & path, nsAString & _retval) {
int rotate(int degrees, string & path, string & _retval) {
	string * path_s = 0;
	string * rotate_s = 0;
	try {

		// Don't rotate 0 degrees
		if (0 == degrees) {
			//_retval.Append('o');
			//_retval.Append('k');
			_retval += "ok";
			return NS_OK;
		}

		//path_s = conv_path(path, false);
		path_s = new string(path);
		if (!path_s) {
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
		//rotate_s = find_path(path_s, "-rotate");
		rotate_s = new string("rotate_output.jpg");
		if (!rotate_s) {
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
		//unconv_path(*rotate_s, _retval);
		_retval += *rotate_s;
		delete rotate_s;
		return NS_OK;
	}

	// Otherwise yell about it
	catch (Magick::Exception & e) {
		delete path_s;
		delete rotate_s;
		char * o = (char *)e.what();
		//while (*o) {
		//	_retval.Append(*o++);
		//}
		_retval += o;
	}
	return NS_OK;

}

int main(int argc, char * * argv) {
	if (2 == argc) {
		string path(*(argv + 1));
		string out("");
		rotate(90, path, out);
		printf("%s\n", out.c_str());
	} else {
		printf("Usage: %s <image-file>\n", *argv);
	}
}