/*
 * Flickr Uploadr
 *
 * Copyright (c) 2007 Yahoo! Inc.  All rights reserved.  This library is free
 * software; you can redistribute it and/or modify it under the terms of the
 * GNU General Public License (GPL), version 2 only.  This library is
 * distributed WITHOUT ANY WARRANTY, whether express or implied. See the GNU
 * GPL for more details (http://www.gnu.org/licenses/gpl.html)
 */

#include "nsIGenericFactory.h"
#include "gm_impl.h"

NS_GENERIC_FACTORY_CONSTRUCTOR(CGM)

static nsModuleComponentInfo components[] = {
	{
		GM_CLASSNAME, 
		GM_CID,
		GM_CONTRACTID,
		CGMConstructor
	}
};

NS_IMPL_NSGETMODULE("GMModule", components)