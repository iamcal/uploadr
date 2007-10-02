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

var buttons = {

	_list: ['login', 'upload'],

	// Show specified buttons
	show: function(list) {
		if ('string' == typeof list) {
			list = [list];
		}
		buttons.hide_all();
		for each (l in list) {
			document.getElementById('button_' + l).style.display = '-moz-box';
		}
	},

	// Hide all buttons
	hide_all: function() {
		for each (l in buttons._list) {
			document.getElementById('button_' + l).style.display = 'none';
		}
	},

	// Enable specified buttons
	enable: function(list) {
		if ('string' == typeof list) {
			list = [list];
		}
		for each (l in list) {
			var b = document.getElementById('button_' + l);
			b.disabled = false;
			b.className = 'button';
			if ('upload' == l) {
				document.getElementById('menu_upload_upload').disabled = false;
			}
		}
	},

	// Disable specified buttons
	disable: function(list) {
		if ('string' == typeof list) {
			list = [list];
		}
		for each (l in list) {
			var b = document.getElementById('button_' + l);
			b.disabled = true;
			b.className = 'disabled_button';
			if ('upload' == l) {
				document.getElementById('menu_upload_upload').disabled = true;
			}
		}
	}

};

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

// Drag and drop handler
var drag = {

	flavors: null,

	observer: {
		canHandleMultipleItems: true,
		onDragEnter: function(e, flavor, session) {
		},
		onDragOver: function(e, data) {
			document.getElementById('photos').className = 'drag';
		},
		onDragExit: function(e, flavor, session) {
			document.getElementById('photos').className = 'no_drag';
		},
		onDrop: function(e, data) {

			// Add the files
			buttons.disable('upload');
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
				buttons.disable('upload');
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

// Allow functions to block exiting
var _block_exit = 0;
var block_exit = function() {
	++_block_exit;
}
var unblock_exit = function() {
	--_block_exit;
}

// Why is exiting such a pain?
var exit = function() {

	// Don't exit if exit is blocked
	if (0 < _block_exit) {
Components.utils.reportError(_block_exit);
		return;
	}

	// Save state
	photos.save();
	settings.save();
	users.save();

	// Remove the images directory
	try {
		var profile = Cc['@mozilla.org/file/directory_service;1'].getService(
			Ci.nsIProperties).get('ProfD', Ci.nsIFile);
		profile.append('images');
		profile.remove(true);
	} catch (err) {}

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