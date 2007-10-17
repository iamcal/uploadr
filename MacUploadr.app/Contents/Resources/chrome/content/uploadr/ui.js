// Full-screen pages in the UI
//   LEGACY: Going away before launch
var pages = {

	_list: ['photos', 'queue'],
	_current: 0,

	// Go to a specified page
	go: function(id) {

		// Load the page
		var ii = pages._list.length;
		for (var i = 0; i < ii; ++i) {
			var display = '';
			if (pages._list[i] == id) {
				display = '-moz-box';
				pages._last = pages._current;
				pages._current = i;
			} else {
				display = 'none';
			}
			document.getElementById('page_' + pages._list[i]).style.display = display;
		}

	},

	// Return the current page name
	current: function() {
		return pages._list[pages._current];
	}

};

// The help menu
var help = {

	about: function() {
		window.openDialog('chrome://uploadr/content/about.xul', 'dialog_about',
			'chrome,modal', uploadr.conf.version);
	},

	faq: function() {
		launch_browser('http://flickr.com/help/faq/');
	}

};

// Progress bars
var ProgressBar = function(id, width) {
	this.id = id;
	this.width = null == width ? document.getElementById(id).parentNode.boxObject.width : width;
};
ProgressBar.prototype = {
	update: function(percent) {
		var bar = document.getElementById(this.id);
		bar.width = Math.round(this.width * percent);
	},
	clear: function() {
		this.update(0);
	},

	// Do something special when the bar is finished
	done: function(success) {
		this.update(1);
	},

	// Generate DOM nodes for this progress bar
	create: function() {
		var inner = document.createElement('box');
		inner.id = this.id;
		var outer = document.createElement('box');
		outer.className = 'progress_bar';
		outer.style.width = this.width + 'px';
		outer.setAttribute('flex', 1);
		outer.appendChild(inner);
		return outer;
	}

};

// Free account capacity indicators
var free = {

	update: function() {

		// Don't do anything if we're not logged in
		if (null == users.username) {
			return;
		}

		// If this is a pro user, hide the bandwidth bars
		if (users.is_pro) {
			free.hide();
		}

		// If this is a free user, adjust and show the bandwidth bars
		else {

			// Calculate the batch size if it hasn't been calculated
			if (0 == photos.batch_size && 0 != photos.count) {
				for each (var p in photos.list) {
					if (null != p) {
						var size = file.size(p.path);
						if (!users.is_pro &&
							users.bandwidth.remaining - photos.batch_size < size) {
							status.set(locale.getString('status.limit'));
						} else {
							status.clear();
						}
						photos.batch_size += size;
					}
				}
			}

			var f = document.getElementById('free');
			f.value = locale.getFormattedString('free.status', [
				Math.round(100 * users.bandwidth.used / users.bandwidth.total),
				Math.round(users.bandwidth.total / 102.4) / 10,
				Math.round(users.bandwidth.remaining / 102.4) / 10,
				photos.count,
				Math.round(photos.batch_size / 102.4) / 10
			]);
			f.style.visibility = 'visible';
		}

	},

	hide: function() {
		document.getElementById('free').style.visibility = 'hidden';
	}

};

// Enable and disable buttons
var buttons = {

	upload: {
		enable: function() {
			if (users.username && 0 < photos.count) {
				document.getElementById('button_upload').className = 'button';
				document.getElementById('menu_upload_upload').disabled = false;
			}
		},
		disable: function() {
			document.getElementById('button_upload').className = 'disabled_button';
			document.getElementById('menu_upload_upload').disabled = true;
		}
	},

	remove: {
		enable: function() {
			document.getElementById('t_remove').className = 'button';
		},
		disable: function() {
			document.getElementById('t_remove').className = 'disabled_button';
		}
	}

};

// Change the status bar text
var status = {

	// Set a message in the status bar
	set: function(str) {
		document.getElementById('status').label = str;
	},

	// Clear the status bar
	clear: function() {
		var status = document.getElementById('status');
		status.label = '';
	}

};

// Functions to find photos in the grid
var findr = {

	// How many photos are in each full row?
	width: function() {
		var p = photos.list;
		var top = -1;
		var width = 0;
		for (var i = p.length; i >= 0; --i) {
			if (null != p[i]) {
				var test = document.getElementById('photo' + i).offsetTop;
				if (-1 != top && test > top) {
					return width;
				}
				top = test;
				++width;
			}
		}
		return 0;
	},

	// Get photos in a bounding box
	bounding_box: function(x1, y1, x2, y2) {
		const OFFSET_X = -events.photos.box.x - 5;
		const OFFSET_Y = -events.photos.box.y - 5;
		var pos = {x: {}, y: {}};
		events.photos.box.getPosition(pos.x, pos.y);

		// Get our points in order
		if (x2 < x1) {
			var tmp = x2;
			x2 = x1;
			x1 = tmp;
		}
		if (y2 < y1) {
			var tmp = y2;
			y2 = y1;
			y1 = tmp;
		}

		// Walk the photos and see which are in the box
		var p = photos.list;
		for (var i = p.length; i >= 0; --i) {
			if (null != p[i]) {
				var img = document.getElementById('photo' + i).getElementsByTagName('img')[0];
				if (img.offsetLeft + OFFSET_X + img.width >= x1 &&
					img.offsetLeft + OFFSET_X <= x2 &&
					img.offsetTop + OFFSET_Y + img.height >= y1 &&
					img.offsetTop + OFFSET_Y <= y2) {
					img.className = 'selecting';
				} else {
					img.className = '';
				}
			}
		}

	}

};

// File drag and drop handler
var drag = {

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
			} else {
				threads.worker.dispatch(new EnableUpload(), threads.worker.DISPATCH_NORMAL);
			}

			// Enable the upload button?
			if (0 == photos.count) {
				buttons.upload.disable();
			}

		},
		getSupportedFlavours: function() {
			return drag.flavors;
		}
	}

};

// Setup the drag and drop handler
try {
	drag.flavors = new FlavourSet();
	drag.flavors.appendFlavour('application/x-moz-file', 'nsIFile');
} catch (err) {
	Components.utils.reportError(err);
}

// Get the locale object (a StringBundle) from the DOM
var locale = document.getElementById('locale');

// Now hack locale.getFormattedString to work like it should
locale.getFormattedString = function(id, args) {
	var str = locale.getString(id);
	var ii = args.length;
	for (var i = 0; i < ii; ++i) {
		var regex = new RegExp('%' + (i + 1) + '\\$[ds]');
		str = str.replace(regex, args[i]);
	}
	return str;
};

// Allow functions to block removing photos
var _block_remove = 0;
var block_remove = function() {
	if (0 == _block_remove) {
		var b = document.getElementById('t_remove');
		b.disabled = true;
		b.className = 'disabled_button';
	}
	++_block_remove;
};
var unblock_remove = function() {
	--_block_remove;
	if (0 == _block_remove) {
		var b = document.getElementById('t_remove');
		b.disabled = false;
		b.className = 'button';
	}
};

// Allow functions to block exiting
var _block_exit = 0;
var block_exit = function() {
	++_block_exit;
};
var unblock_exit = function() {
	--_block_exit;
};

// Why is exiting such a pain?
var exit = function(force) {
	if (null == force) {
		force = false;
	}

	// Don't exit if exit is blocked
	if (!force && 0 < _block_exit) {
Components.utils.reportError(_block_exit);
		return;
	}

	// Save state
	photos.save();
	settings.save();
	users.save();

	// Remove the images directory if there are no photos left
	if (0 == photos.count) {
		try {
			var profile = Cc['@mozilla.org/file/directory_service;1'].getService(
				Ci.nsIProperties).get('ProfD', Ci.nsIFile);
			profile.append('images');
			profile.remove(true);
		} catch (err) {}
	}

	// Finally exit
	var e = Cc['@mozilla.org/toolkit/app-startup;1'].getService(
		Components.interfaces.nsIAppStartup);
	e.quit(Ci.nsIAppStartup.eForceQuit);

};

// Override the alert, confirm and prompt functions to take a 2nd arg as a title
var alert = function(msg, title) {
	window.openDialog('chrome://uploadr/content/alert.xul', 'dialog_alert',
		'chrome,modal', msg, title);
};
var confirm = function(msg, title) {
	var result = {result: false};
	window.openDialog('chrome://uploadr/content/confirm.xul', 'dialog_confirm',
		'chrome,modal', msg, title, result);
	return result.result;
};
var prompt = function(msg, title) {
	var result = {result: false};
	window.openDialog('chrome://uploadr/content/prompt.xul', 'dialog_prompt',
		'chrome,modal', msg, title, result);
	return result.result;
};

// Open a browser window to the given URL
var launch_browser = function(url) {
	var io = Cc['@mozilla.org/network/io-service;1'].getService(Ci.nsIIOService);
	var uri = io.newURI(url, null, null);
	var eps = Cc['@mozilla.org/uriloader/external-protocol-service;1'].getService(
		Ci.nsIExternalProtocolService);
	var launcher = eps.getProtocolHandlerInfo('http');
	launcher.preferredAction = Ci.nsIHandlerInfo.useSystemDefault;
	launcher.launchWithURI(uri, null);
};