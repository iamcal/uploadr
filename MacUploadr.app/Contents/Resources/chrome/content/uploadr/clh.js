/*
 * Flickr Uploadr
 *
 * Copyright (c) 2007 Yahoo! Inc.  All rights reserved.  This library is free
 * software; you can redistribute it and/or modify it under the terms of the
 * GNU General Public License (GPL), version 2 only.  This library is
 * distributed WITHOUT ANY WARRANTY, whether express or implied. See the GNU
 * GPL for more details (http://www.gnu.org/licenses/gpl.html)
 */

// Check the command line queue for arguments
var clh = function(queue) {
	if (null == queue) {
		var comp = Cc["@mozilla.org/commandlinehandler/general-startup;1?type=flcmdline"]
			.getService(Ci.flICLH);
		queue = comp.getQueue();
	}
	queue = queue.split('|||||');
	var ii = queue.length;
	var paths = [];
	for (var i = 0; i < ii; ++i) {
		var arg = queue[i];
		if (photos.is_photo(arg)) {
			if (/^file:\/\//.test(arg)) {
				arg = Cc['@mozilla.org/network/protocol;1?name=file'].getService(
					Ci.nsIFileProtocolHandler).getFileFromURLSpec(arg).path;
			}
			paths.push(arg);
		}
	}
	photos.add(paths);
};