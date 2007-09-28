events.bandwidth = {

	switch_users: function() {
		events.buttons.login();
	},

	go_pro: function() {
		var io = Cc['@mozilla.org/network/io-service;1'].getService(Ci.nsIIOService);
		var uri = io.newURI('http://flickr.com/upgrade/', null, null);
		var eps = Cc['@mozilla.org/uriloader/external-protocol-service;1'].getService(
			Ci.nsIExternalProtocolService);
		var launcher = eps.getProtocolHandlerInfo('http');
		launcher.preferredAction = Ci.nsIHandlerInfo.useSystemDefault;
		launcher.launchWithURI(uri, null);
	}

};