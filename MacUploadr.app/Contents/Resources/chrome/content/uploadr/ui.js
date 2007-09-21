var pages = {

	_list: ['photos', 'users', 'settings', 'progress', 'complete'],
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

		// Only show the toolbar on the photos page
		if ('photos' == id) {
			document.getElementById('tools').style.display = '-moz-box';
			document.getElementById('no_tools').style.display = 'none';
		} else {
			document.getElementById('tools').style.display = 'none';
			document.getElementById('no_tools').style.display = '-moz-box';
		}

	},

	// Return the current page name
	current: function() {
		return pages._list[pages._current];
	}

};

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
						var size = uploadr.fsize(p.path);
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

			var used = Math.min(94, Math.round(94 * users.bandwidth.used / users.bandwidth.total));
			var batch = Math.max(0, Math.round(94 * photos.batch_size / users.bandwidth.total));
			var remaining = Math.max(0,
				Math.round(94 * users.bandwidth.remaining / users.bandwidth.total));
			batch = Math.min(batch, remaining);
			remaining += 94 - (used + batch + remaining);
			document.getElementById('bw_used').style.width = used + 'px';
			var bw_batch = document.getElementById('bw_batch');
			bw_batch.style.width = batch + 'px';
			bw_batch.style.backgroundPosition = '-' + used + 'px -34px';
			var bw_remaining = document.getElementById('bw_remaining');
			bw_remaining.style.width = remaining + 'px';
			bw_remaining.style.backgroundPosition = '-' + (used + batch) + 'px -17px';
			document.getElementById('free').style.display = '-moz-box';
		}

		// And show the proper maximum size in the settings window
		document.getElementById('s_resize_note').firstChild.nodeValue =
			locale.getFormattedString('settings.resize.note', [users.filesize >> 10]);

	},

	hide: function() {
		document.getElementById('free').style.display = 'none';
	}

};

var buttons = {

	_list: ['login', 'back', 'ok', 'upload'],

	// Show specified buttons
	show: function(list) {
		if ('string' == typeof list) {
			list = [list];
		}
		buttons.hideAll();
		for each (l in list) {
			document.getElementById('button_' + l).style.display = '-moz-box';
		}
	},

	// Hide all buttons
	hideAll: function() {
		for each (l in buttons._list) {
			document.getElementById('button_' + l).style.display = 'none';
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
		//var r = status.label;
		status.label = '';
		//return r;
	}

};

// Functions to find photos above and below a given photo
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
		const OFFSET_X = uploadr.conf.OFFSET_X;
		const OFFSET_Y = uploadr.conf.OFFSET_Y;

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
			document.getElementById('photos').className = 'drag oldest';
		},
		onDragExit: function(e, flavor, session) {
			document.getElementById('photos').className = 'no_drag oldest';
		},
		onDrop: function(e, data) {

			// Add the files
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
			threads.worker.dispatch(new Sort(), threads.worker.DISPATCH_NORMAL);

			// Enable the upload button?
			if (photos.count) {
				document.getElementById('button_upload').disabled = false;
			} else {
				document.getElementById('button_upload').disabled = true;
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
var block_exit = false;

// Why is exiting such a pain?
var exit = function() {

	// Don't exit if exit is blocked
	if (block_exit) {
		return;
	}

	// If there are unsaved photos, don't exit without confirmation
	if (photos.unsaved && !confirm(locale.getString('unsaved'),
		locale.getString('unsaved.title'))) {
		return false;
	}

	// Save user info
	settings.save();
	users.save();

	// Remove the thumbs directory
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