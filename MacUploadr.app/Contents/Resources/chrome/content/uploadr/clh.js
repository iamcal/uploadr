/*
 * Flickr Uploadr
 *
 * Copyright (c) 2007-2008 Yahoo! Inc.  All rights reserved.  This library is
 * free software; you can redistribute it and/or modify it under the terms of
 * the GNU General Public License (GPL), version 2 only.  This library is
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
	photos.add(queue.split('|||||'));
};