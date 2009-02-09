/*
 * Flickr Uploadr
 *
 * Copyright (c) 2007-2008 Yahoo! Inc.  All rights reserved.  This library is
 * free software; you can redistribute it and/or modify it under the terms of
 * the GNU General Public License (GPL), version 2 only.  This library is
 * distributed WITHOUT ANY WARRANTY, whether express or implied. See the GNU
 * GPL for more details (http://www.gnu.org/licenses/gpl.html)
 */

#ifndef GM_IMPL_H
#define GM_IMPL_H

#include "flIGM.h"
#include "nsStringAPI.h"
#include "nsCOMPtr.h"

#define GM_CONTRACTID "@flickr.com/gm;1"
#define GM_CLASSNAME "flGM"
#define GM_CID { 0x0e0d0b74, 0x2c06, 0x11dc, { 0x83, 0x14, 0x08, 0x00, 0x20, 0x0c, 0x9a, 0x66 } }

class flGM : public flIGM {
public:
	NS_DECL_ISUPPORTS
	NS_DECL_FLIGM
	flGM();
private:
	~flGM();
protected:
	nsCOMPtr<UploadObserver> m_Observer;
};

#endif