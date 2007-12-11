const nsIAppShellService    = Components.interfaces.nsIAppShellService;
const nsISupports           = Components.interfaces.nsISupports;
const nsICategoryManager    = Components.interfaces.nsICategoryManager;
const nsIComponentRegistrar = Components.interfaces.nsIComponentRegistrar;
const nsICommandLine        = Components.interfaces.nsICommandLine;
const nsICommandLineHandler = Components.interfaces.nsICommandLineHandler;
const nsIFactory            = Components.interfaces.nsIFactory;
const nsIModule             = Components.interfaces.nsIModule;
const nsIWindowWatcher      = Components.interfaces.nsIWindowWatcher;
const nsIWindowMediator     = Components.interfaces.nsIWindowMediator;
const nsIThread             = Components.interfaces.nsIThread;
const nsIThreadManager      = Components.interfaces.nsIThreadManager;
const nsIFlickrCommandQueue = Components.interfaces.IFlickrCommandQueue;

const clh_contractID	= "@mozilla.org/commandlinehandler/general-startup;1?type=flcmdline";
const clh_CID		= Components.ID("{3e984f42-a822-11dc-8314-0800200c9a66}");
const clh_category	= "m-flcmdline";


const myAppHandler = {

	QueryInterface : function clh_QI(iid){
		if (iid.equals(nsICommandLineHandler) || iid.equals(nsIFactory) || iid.equals(nsISupports) || iid.equals(nsIFlickrCommandQueue)) return this;
		throw Components.results.NS_ERROR_NO_INTERFACE;
	},

	handle : function clh_handle(cmdLine){

		var start_index = 0;

		if (cmdLine.state == 1){ // STATE_REMOTE_AUTO

			// calh: i needed this in my test app, since arg 0 was the application.ini file (wtf?)
			//       don't seem to need it for uploadr though...
			//start_index = 1;
		}

		for (var i=start_index; i<cmdLine.length; i++){

			var arg = cmdLine.getArgument(i);

			if (arg.substr(0,1) == '-') continue;

			var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(nsIWindowMediator);
			var win = wm.getMostRecentWindow('app');

			if (win){
				win.pathFromCommandLine(arg);
			}else{
				this.local_queue.push(arg);
			}
		}

		if (cmdLine.state == 1){ // STATE_REMOTE_AUTO
			cmdLine.preventDefault = true;
		}
	},

	local_queue : [],

	getQueue : function (){
		return this.local_queue.join('|||||');
	},

	helpInfo : "\n",

	createInstance : function clh_CI(outer, iid){
		if (outer != null) throw Components.results.NS_ERROR_NO_AGGREGATION;
		return this.QueryInterface(iid);
	},

	lockFactory : function clh_lock(lock){
		/* no-op */
	}
};

const myAppHandlerModule = {

	QueryInterface : function mod_QI(iid){
		if (iid.equals(nsIModule) || iid.equals(nsISupports)) return this;
		throw Components.results.NS_ERROR_NO_INTERFACE;
	},

	getClassObject : function mod_gch(compMgr, cid, iid){
		if (cid.equals(clh_CID)) return myAppHandler.QueryInterface(iid);
		throw Components.results.NS_ERROR_NOT_REGISTERED;
	},

	registerSelf : function mod_regself(compMgr, fileSpec, location, type){
		compMgr.QueryInterface(nsIComponentRegistrar);
		compMgr.registerFactoryLocation(clh_CID,
                                    "myAppHandler",
                                    clh_contractID,
                                    fileSpec,
                                    location,
                                    type);

		var catMan = Components.classes["@mozilla.org/categorymanager;1"].getService(nsICategoryManager);
		catMan.addCategoryEntry("command-line-handler",
                            clh_category,
                            clh_contractID, true, true);
	},

	unregisterSelf : function mod_unreg(compMgr, location, type){
		compMgr.QueryInterface(nsIComponentRegistrar);
		compMgr.unregisterFactoryLocation(clh_CID, location);
		var catMan = Components.classes["@mozilla.org/categorymanager;1"].getService(nsICategoryManager);
		catMan.deleteCategoryEntry("command-line-handler", clh_category);
	},

	canUnload : function (compMgr){
		return true;
	}
};

function NSGetModule(comMgr, fileSpec){
	return myAppHandlerModule;
}
