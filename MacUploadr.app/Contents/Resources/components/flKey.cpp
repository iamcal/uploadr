/*
 * Flickr Uploadr
 *
 * Copyright (c) 2007 Yahoo! Inc.  All rights reserved.  This library is free
 * software; you can redistribute it and/or modify it under the terms of the
 * GNU General Public License (GPL), version 2 only.  This library is
 * distributed WITHOUT ANY WARRANTY, whether express or implied. See the GNU
 * GPL for more details (http://www.gnu.org/licenses/gpl.html)
 */

#include "flKey.h"
#include "md5.h"

/*
// Perhaps later we'll use nsICryptoHash?
#include "xpcom/nsXPCOM.h"
#include "xpcom/nsCOMPtr.h"
#include "string/nsReadableUtils.h"
#include "xpcom/nsIServiceManager.h"
#include "necko/nsICryptoHash.h"
*/

NS_IMPL_ISUPPORTS1(flKey, flIKey)

flKey::flKey() {
}

flKey::~flKey() {
}

// Return the API key
NS_IMETHODIMP flKey::Key(nsAString & _retval) {
#ifdef XP_MACOSX
	char * k = "mac-key-here";
#endif
#ifdef XP_WIN
	char * k = "win-key-here";
#endif
	unsigned int i;
	unsigned int ii = 32; // API key length
	for (i = 0; i < ii; ++i) {
		_retval.Append(k[i]);
	}
	return NS_OK;
}

// Sign a set of args and return the MD5 signature
NS_IMETHODIMP flKey::Sign(const nsAString & args, nsAString & _retval) {

	// Build the array of bytes (not null terminated!)
	//   This assumes that UTF-8 characters have been escaped already
	unsigned int ii = args.Length();
	unsigned char * bytes = new unsigned char[16 + ii];
	if (0 == bytes) return NS_ERROR_NULL_POINTER;
	unsigned char * tmp = bytes + 16;
	const PRUnichar * start = args.BeginReading();
	const PRUnichar * end = args.EndReading();
	while (start != end) {
		*tmp++ = (unsigned char)*start++;
	}

	// The shared secret
#ifdef XP_MACOSX
	bytes[0] = '-';
	bytes[1] = '-';
	bytes[2] = '-';
	bytes[3] = '-';
	bytes[4] = '-';
	bytes[5] = '-';
	bytes[6] = '-';
	bytes[7] = '-';
	bytes[8] = '-';
	bytes[9] = '-';
	bytes[10] = '-';
	bytes[11] = '-';
	bytes[12] = '-';
	bytes[13] = '-';
	bytes[14] = '-';
	bytes[15] = '-';
#endif
#ifdef XP_WIN
	bytes[0] = '-';
	bytes[1] = '-';
	bytes[2] = '-';
	bytes[3] = '-';
	bytes[4] = '-';
	bytes[5] = '-';
	bytes[6] = '-';
	bytes[7] = '-';
	bytes[8] = '-';
	bytes[9] = '-';
	bytes[10] = '-';
	bytes[11] = '-';
	bytes[12] = '-';
	bytes[13] = '-';
	bytes[14] = '-';
	bytes[15] = '-';
#endif

	// Returning API secret, legacy
/*
	unsigned int i;
	for (i = 0; i < 16; ++i) {
		_retval.Append(bytes[i]);
	}
*/

/*
// Perhaps later we'll use nsICryptoHash?
	// The arguments
	unsigned int i, j = 16;
	for (i = 0; i < ii; ++i) {
		bytes[j++] = args_p[i];
	}
	bytes[j] = 0;

	// Hash the args with MD5
	nsCOMPtr<nsIServiceManager> service;
	nsresult rv = NS_GetServiceManager(getter_AddRefs(service));
	if (NS_FAILED(rv)) return -1;
	nsCOMPtr<nsICryptoHash> hash;
	rv = service->GetServiceByContractID("@mozilla.org/security/hash;1",
		NS_GET_IID(nsICryptoHash), getter_AddRefs(hash));
	if (NS_FAILED(rv)) return -1;
	hash->init(2); // 2 == MD5
	hash->update(bytes, 16 + ii);
	char * packed = ToNewCString(hash->finish(0));
*/

	// Hash the args with MD5
	MD5_CTX context;
	unsigned char packed[16];
	MD5Init(&context);
	MD5Update(&context, bytes, 16 + ii);
	MD5Final(packed, &context);

	// Unpack the result, bin2hex style
	unsigned int i;
	for (i = 0; i < 16; ++i) {
		char ones = packed[i] % 16;
		char tens = packed[i] >> 4;
		_retval.Append(tens + (tens > 9 ? 87 : 48));
		_retval.Append(ones + (ones > 9 ? 87 : 48));
	}


	delete [] bytes;
	return NS_OK;
}