#include "nsIGenericFactory.h"
#include "gm_impl.h"

NS_GENERIC_FACTORY_CONSTRUCTOR(CGM)

static nsModuleComponentInfo components[] = {
	{
		GM_CLASSNAME, 
		GM_CID,
		GM_CONTRACTID,
		CGMConstructor,
	}
};

NS_IMPL_NSGETMODULE("GMModule", components)