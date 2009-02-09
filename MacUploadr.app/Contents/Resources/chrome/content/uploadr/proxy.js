/*
 * Flickr Uploadr
 *
 * Copyright (c) 2007-2009 Yahoo! Inc.  All rights reserved.  This library is
 * free software; you can redistribute it and/or modify it under the terms of
 * the GNU General Public License (GPL), version 2 only.  This library is
 * distributed WITHOUT ANY WARRANTY, whether express or implied. See the GNU
 * GPL for more details (http://www.gnu.org/licenses/gpl.html)
 */

var gProxyDialog = {

	beforeAccept: function (){

		var proxyTypePref = document.getElementById("network.proxy.type");

		if (proxyTypePref.value == 2) {
			this.doAutoconfigURLFixup();
			return true;
    		}

		return true;
	},

	proxyTypeChanged: function (){

		var proxyTypePref = document.getElementById("network.proxy.type");

		document.getElementById("network.proxy.socks").disabled			= proxyTypePref.value != 1;
		document.getElementById("network.proxy.socks_port").disabled		= proxyTypePref.value != 1;
		document.getElementById("network.proxy.http_port").disabled		= proxyTypePref.value != 1;
		document.getElementById("network.proxy.http").disabled			= proxyTypePref.value != 1;
		document.getElementById("network.proxy.socks_version").disabled		= proxyTypePref.value != 1;
		
		document.getElementById("network.proxy.autoconfig_url").disabled	= proxyTypePref.value != 2;
		document.getElementById("flickr.proxy.disable_reload_button").disabled	= proxyTypePref.value != 2;
	},
  
	readProxyType: function(){

		this.proxyTypeChanged();
		return undefined;
	},

	reloadPAC: function (){

		var autoURL = document.getElementById("networkProxyAutoconfigURL");
		var pps = Components.classes["@mozilla.org/network/protocol-proxy-service;1"].getService(Components.interfaces.nsPIProtocolProxyService);
		pps.configureFromPAC(autoURL.value);
	},

	doAutoconfigURLFixup: function(){

		var autoURL = document.getElementById("networkProxyAutoconfigURL");
		var autoURLPref = document.getElementById("network.proxy.autoconfig_url");
		var URIFixup = Components.classes["@mozilla.org/docshell/urifixup;1"].getService(Components.interfaces.nsIURIFixup);

		try {
			autoURLPref.value = autoURL.value = URIFixup.createFixupURI(autoURL.value, 0).spec;
		} catch(ex) {}
	}

};
