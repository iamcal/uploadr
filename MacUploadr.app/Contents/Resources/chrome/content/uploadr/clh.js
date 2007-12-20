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
	var first = true;
	for (var i = 0; i < ii; ++i) {
		var arg = queue[i];
		if (photos.is_photo(arg)) {
			if (first) {
				buttons.upload.disable();
				document.getElementById('photos_init').style.display = 'none';
				document.getElementById('photos_new').style.display = 'none';
				document.getElementById('no_meta_prompt').style.visibility = 'visible';
				first = false;
			}
			if (/^file:\/\//.test(arg)) {
				arg = Cc['@mozilla.org/network/protocol;1?name=file'].getService(
					Ci.nsIFileProtocolHandler).getFileFromURLSpec(arg).path;
			}
			photos._add(arg);
		}
	}
	if (0 < photos.count) {
		if (photos.sort) {
			threads.worker.dispatch(new Sort(), threads.worker.DISPATCH_NORMAL);
			document.getElementById('photos_sort_default').style.display = 'block';
			document.getElementById('photos_sort_revert').style.display = 'none';
		} else {
			threads.worker.dispatch(new EnableUpload(), threads.worker.DISPATCH_NORMAL);
			document.getElementById('photos_sort_default').style.display = 'none';
			document.getElementById('photos_sort_revert').style.display = 'block';
		}
	}
};