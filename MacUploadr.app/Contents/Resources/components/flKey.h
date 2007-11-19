/*
 * Flickr Uploadr
 *
 * Copyright (c) 2007 Yahoo! Inc.  All rights reserved.  This library is free
 * software; you can redistribute it and/or modify it under the terms of the
 * GNU General Public License (GPL), version 2 only.  This library is
 * distributed WITHOUT ANY WARRANTY, whether express or implied. See the GNU
 * GPL for more details (http://www.gnu.org/licenses/gpl.html)
 */

#ifndef KEY_IMPL_H
#define KEY_IMPL_H

#include "flIKey.h"
#include "nsStringAPI.h"

#define KEY_CONTRACTID "@flickr.com/key;1"
#define KEY_CLASSNAME "flKey"
#define KEY_CID { 0x30d5eeac, 0x87fa, 0x11dc, { 0x83, 0x14, 0x08, 0x00, 0x20, 0x0c, 0x9a, 0x66 } }

class flKey : public flIKey {
public:
	NS_DECL_ISUPPORTS
	NS_DECL_FLIKEY
	flKey();
private:
	~flKey();
};

#endif