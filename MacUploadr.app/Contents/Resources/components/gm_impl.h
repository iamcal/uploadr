#ifndef GM_IMPL_H
#define GM_IMPL_H

#include "gm.h"
#include "nsStringAPI.h"

#define GM_CONTRACTID "@flickr.com/gm;1"
#define GM_CLASSNAME "GM"
#define GM_CID { 0x0e0d0b74, 0x2c06, 0x11dc, { 0x83, 0x14, 0x08, 0x00, 0x20, 0x0c, 0x9a, 0x66 } }

class CGM : public IGM {
public:
	NS_DECL_ISUPPORTS
	NS_DECL_IGM
	CGM();
private:
	~CGM();
};

#endif