/*
 * Flickr Uploadr
 *
 * Copyright (c) 2007 Yahoo! Inc.  All rights reserved.  This library is free
 * software; you can redistribute it and/or modify it under the terms of the
 * GNU General Public License (GPL), version 2 only.  This library is
 * distributed WITHOUT ANY WARRANTY, whether express or implied. See the GNU
 * GPL for more details (http://www.gnu.org/licenses/gpl.html)
 */

var clh = {

	// Handle a single path passed to Uploadr
	handle: function(arg) {
Components.classes["@mozilla.org/consoleservice;1"]
.getService(Components.interfaces.nsIConsoleService)
.logStringMessage("Got a file " + arg);
		if (photos.is_photo(arg)) {
			if (/^file:\/\//.test(arg)) {
				arg = Cc['@mozilla.org/network/protocol;1?name=file'].getService(
					Ci.nsIFileProtocolHandler).getFileFromURLSpec(arg).path;
			}
			photos._add(arg);
		}
	},

	// Check the command line queue for arguments
	check: function() {
		var comp = Cc["@mozilla.org/commandlinehandler/general-startup;1?type=flcmdline"]
			.getService(Ci.flICLH);
		var queue = comp.getQueue();
		queue = queue.split('|||||');
		var ii = queue.length;
		var first = true;
		for (var i = 0; i < ii; ++i) {
			if (photos.is_photo(queue[i])) {
				if (first) {
					buttons.upload.disable();
					document.getElementById('photos_stack').style.visibility = 'visible';
					document.getElementById('photos_init').style.display = 'none';
					document.getElementById('photos_new').style.display = 'none';
					document.getElementById('no_meta_prompt').style.visibility = 'visible';
					first = false;
				}
				clh.handle(queue[i]);
			}
		}
	}

};