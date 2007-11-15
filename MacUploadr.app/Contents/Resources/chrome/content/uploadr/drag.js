var drag = {

	// Handle files dragged on startup
	//   This will hopefully be replaced by an XPCOM command line handler, but until then this
	//   is still here to handle drags on startup
	on_startup: function() {
		var cl = window.arguments[0].QueryInterface(Ci.nsICommandLine);
		var ii = cl.length;
		if (0 == ii) {
			return;
		}
		var first = true;
		for (var i = 0; i < ii; ++i) {
			if ('-url' == cl.getArgument(i)) {
				if (first) {
					buttons.upload.disable();
					document.getElementById('photos_stack').style.visibility = 'visible';
					document.getElementById('photos_init').style.display = 'none';
					document.getElementById('photos_new').style.display = 'none';
					document.getElementById('no_meta_prompt').style.visibility = 'visible';
					first = false;
				}
				photos._add(Cc['@mozilla.org/network/protocol;1?name=file'].getService(
					Ci.nsIFileProtocolHandler).getFileFromURLSpec(cl.getArgument(++i)).path);
			}
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
			data.dataList.forEach(function(d) {
				if (d.first.data.isDirectory()) {
					var files = d.first.data.directoryEntries;
					
					while (files.hasMoreElements()) {
						photos._add(files.getNext().QueryInterface(Ci.nsILocalFile).path);
					}
				} else {
					photos._add(d.first.data.QueryInterface(Ci.nsILocalFile).path);
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