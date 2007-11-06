// Full-screen pages in the UI
var pages = {

	_list: ['photos', 'auth', 'help'],
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

		// Only the photos page has the toolbar
		if ('photos' == id) {
			document.getElementById('tools').style.display = '-moz-box';
		} else {
			document.getElementById('tools').style.display = 'none';
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

	tips: function() {
		pages.go('help');
	},

	faq: function() {
		launch_browser('http://flickr.com/help/faq/');
	},

	// Sneaky reformatting of help text
	_pretty: function() {
		for each (var id in ['help_offline', 'help_drag']) {
			var node = document.getElementById(id);
			var pink = node.firstChild.nodeValue.match(/\{(.+)\}/);
			var black = node.firstChild.nodeValue.split(pink[0]);
			node.removeChild(node.firstChild);
			node.appendChild(document.createTextNode(black[0]));
			var span = document.createElementNS(NS_HTML, 'span');
			span.style.color = '#ff0084';
			span.appendChild(document.createTextNode(pink[1]));
			node.appendChild(span);
			node.appendChild(document.createTextNode(black[1]));
		}
		var node = document.getElementById('help_faq');
		var link = node.firstChild.nodeValue.match(/\{(.+)\}/);
		var black = node.firstChild.nodeValue.split(link[0]);
		node.removeChild(node.firstChild);
		node.appendChild(document.createTextNode(black[0]));
		var span = document.createElementNS(NS_HTML, 'span');
		span.className = 'link';
		span.onclick = help.faq;
		span.appendChild(document.createTextNode(link[1]));
		node.appendChild(span);
		node.appendChild(document.createTextNode(black[1]));
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
		document.getElementById(this.id).className = 'done';
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

// Free account capacity indicator
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

			var remaining = document.getElementById('bw_remaining_mb');
			remaining.firstChild.nodeValue =
				locale.getFormattedString('bandwidth.mb',
				[Math.max(0, users.bandwidth.remaining >> 10)]);
			if (0 >= users.bandwidth.remaining) {
				remaining.className = 'exhausted';
			} else if (6 << 10 > users.bandwidth.remaining) {
				remaining.className = 'almost';
			} else {
				remaining.className = '';
			}
			document.getElementById('bw_remaining').style.display = '-moz-box';
			var batch = document.getElementById('bw_batch_mb');
			batch.firstChild.nodeValue =
				locale.getFormattedString('bandwidth.mb', [photos.batch_size >> 10]);
			if (photos.batch_size > users.bandwidth.remaining) {
				batch.className = 'exhausted';
			} else if (photos.batch_size + (6 << 10) > users.bandwidth.remaining) {
				batch.className = 'almost';
			} else {
				batch.className = '';
			}
			document.getElementById('bw_batch').style.display = '-moz-box';
		}

	},

	hide: function() {
		document.getElementById('bw_remaining').style.display = 'none';
		document.getElementById('bw_batch').style.display = 'none';
		//document.getElementById('bandwidth').style.visibility = 'hidden';
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

// Make sure we don't resize too small
var resize = function() {
/*
var arr = [];
for (var a in window) arr.push(a);
Components.utils.reportError(arr.toSource());
*/
//Components.utils.reportError('width: ' + window.outerWidth + ', height: ' + window.outerHeight);
	if (uploadr.conf.min_width > window.outerWidth) {
		window.outerWidth = uploadr.conf.min_width;
	}
	if (uploadr.conf.min_height > window.outerHeight) {
		window.outerHeight = uploadr.conf.min_height;
	}
};

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
	if (0 == _block_remove && photos.selected.length) {
		var b = document.getElementById('t_remove');
		b.disabled = false;
		b.className = 'button';
	}
};

// Allow functions to block sorting
var _block_sort = 0;
var block_sort = function() {
	++_block_sort;
};
var unblock_sort = function() {
	--_block_sort;
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
	if (!force && 0 < _block_exit && !confirm(locale.getString('dialog.exit.text'),
		locale.getString('dialog.exit.title'),
		locale.getString('dialog.exit.ok'),
		locale.getString('dialog.exit.cancel'))) {
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
var alert = function(msg, title, ok) {
	window.openDialog('chrome://uploadr/content/alert.xul', 'dialog_alert',
		'chrome,modal', msg, title, ok);
};
var confirm = function(msg, title, ok, cancel) {
	var result = {result: false};
	window.openDialog('chrome://uploadr/content/confirm.xul', 'dialog_confirm',
		'chrome,modal', msg, title, ok, cancel, result);
	return result.result;
};
var prompt = function(msg, title, ok, cancel) {
	var result = {result: false};
	window.openDialog('chrome://uploadr/content/prompt.xul', 'dialog_prompt',
		'chrome,modal', msg, title, ok, cancel, result);
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