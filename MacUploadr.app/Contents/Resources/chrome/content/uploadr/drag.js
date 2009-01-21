/*
 * Flickr Uploadr
 *
 * Copyright (c) 2007-2009 Yahoo! Inc.  All rights reserved.  This library is
 * free software; you can redistribute it and/or modify it under the terms of
 * the GNU General Public License (GPL), version 2 only.  This library is
 * distributed WITHOUT ANY WARRANTY, whether express or implied. See the GNU
 * GPL for more details (http://www.gnu.org/licenses/gpl.html)
 */

var drag = {

	// Allow dragging photos into the window
	flavors: null,
	observer: {
		canHandleMultipleItems: true,
		onDragEnter: function(e, flavor, session) {
			document.getElementById('photos').className = 'drag';
		},
		onDragOver: function(e, data) {
		},
		onDragExit: function(e, flavor, session) {
			document.getElementById('photos').className = 'no_drag';
		},
		onDrop: function(e, data) {
			var paths = [];
			var process_dir = function(files) {
				while (files.hasMoreElements()) {
					var f = files.getNext().QueryInterface(Ci.nsIFile);
					if (f.isDirectory()) {
						process_dir(f.directoryEntries);
					} else {
						paths.push(f.QueryInterface(Ci.nsILocalFile).path);
					}
				}
			};
			data.dataList.forEach(function(d) {
				if (d.first.data.isDirectory()) {
					process_dir(d.first.data.directoryEntries);
				} else {
					paths.push(d.first.data.QueryInterface(
						Ci.nsILocalFile).path);
				}
			});
			photos.add(paths);
		},
		getSupportedFlavours: function() {
			return drag.flavors;
		}
	}

};

// Setup the flavors we accept
try {
	drag.flavors = new FlavourSet();
	drag.flavors.appendFlavour('application/x-moz-file', 'nsIFile');
} catch (err) {
	logErrorMessage(err);
}