/*
 * Flickr Uploadr
 *
 * Copyright (c) 2007 Yahoo! Inc.  All rights reserved.  This library is free
 * software; you can redistribute it and/or modify it under the terms of the
 * GNU General Public License (GPL), version 2 only.  This library is
 * distributed WITHOUT ANY WARRANTY, whether express or implied. See the GNU
 * GPL for more details (http://www.gnu.org/licenses/gpl.html)
 */

var drag = {

	// Handle files dragged on startup
	//   This will hopefully be replaced by an XPCOM command line handler, but until then this
	//   is still here to handle drags on startup
	on_startup: function() {
return;
		var cl = window.arguments[0].QueryInterface(Ci.nsICommandLine);
		var ii = cl.length;
		if (0 == ii) {
			return;
		}
		var first = true;
		for (var i = 0; i < ii; ++i) {
			var arg = cl.getArgument(i);
			if (photos.is_photo(arg)) {
				if (first) {
					buttons.upload.disable();
					document.getElementById('photos_stack').style.visibility = 'visible';
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
		if (photos.count) {
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
	},

	// Currently, this is handled by dock.xul and only really applies to Macs
	after_startup: function() {
	},

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

			// Add the files
			buttons.upload.disable();
			document.getElementById('photos_stack').style.visibility = 'visible';
			document.getElementById('photos_init').style.display = 'none';
			document.getElementById('photos_new').style.display = 'none';
			document.getElementById('no_meta_prompt').style.visibility = 'visible';
			var process_dir = function(files) {
				while (files.hasMoreElements()) {
					var f = files.getNext();
					if (f.isDirectory()) {
						process_dir(f.directoryEntries);
					} else {
						var path = f.QueryInterface(Ci.nsILocalFile).path;
						if (photos.is_photo(path)) {
							photos._add(path);
						}
					}
				}				
			};
			data.dataList.forEach(function(d) {
				if (d.first.data.isDirectory()) {
					process_dir(d.first.data.directoryEntries);
				} else {
					var path = d.first.data.QueryInterface(Ci.nsILocalFile).path;
					if (photos.is_photo(path)) {
						photos._add(path);
					}
				}
			});

			// After the last file is added, sort the images by date taken
			if (photos.sort) {
				threads.worker.dispatch(new Sort(), threads.worker.DISPATCH_NORMAL);
				document.getElementById('photos_sort_default').style.display = 'block';
				document.getElementById('photos_sort_revert').style.display = 'none';
			} else {
				threads.worker.dispatch(new EnableUpload(), threads.worker.DISPATCH_NORMAL);
				document.getElementById('photos_sort_default').style.display = 'none';
				document.getElementById('photos_sort_revert').style.display = 'block';
			}

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
	Components.utils.reportError(err);
}

// Observer for components/clh.js
function CommandLineObserver() {
	this.register();
}
CommandLineObserver.prototype = {
	observe: function(aSubject, aTopic, aData) {
		var cl = aSubject.QueryInterface(Components.interfaces.nsICommandLine);
		var ii = cl.length;
		var first = true;
		for (var i = 0; i < ii; ++i) {
			var arg = cl.getArgument(i);
			if (photos.is_photo(arg)) {
				if (first) {
					buttons.upload.disable();
					document.getElementById('photos_stack').style.visibility = 'visible';
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
		if (photos.count) {
			if (null == threads.gm) {
				threads.init();
			}
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
	},
	register: function() {
		var ob = Cc['@mozilla.org/observer-service;1'].getService(Ci.nsIObserverService);
		ob.addObserver(this, 'commandline-args-changed', false);
	},
	unregister: function() {
		var ob = Cc['@mozilla.org/observer-service;1'].getService(Ci.nsIObserverService);
		ob.removeObserver(this, 'commandline-args-changed');
	}
};
var observer = new CommandLineObserver();
var observerService = Cc['@mozilla.org/observer-service;1'].getService(Ci.nsIObserverService);
observerService.notifyObservers(window.arguments[0], 'commandline-args-changed', null);
addEventListener('unload', observer.unregister, false);