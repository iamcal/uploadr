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

			/*
			var f = document.getElementById('free');
			f.firstChild.nodeValue = locale.getFormattedString('free.status', [
				Math.round(100 * users.bandwidth.used / users.bandwidth.total),
				Math.round(users.bandwidth.total / 102.4) / 10,
				Math.round(users.bandwidth.remaining / 102.4) / 10,
				photos.count,
				Math.round(photos.batch_size / 102.4) / 10
			]);
			f.style.display = 'block';
			*/
			var used = Math.min(100, Math.round(100 * users.bandwidth.used /
				users.bandwidth.total));
			var batch = Math.max(0, Math.round(100 * photos.batch_size / users.bandwidth.total));
			var remaining = Math.max(0,
			Math.round(100 * users.bandwidth.remaining / users.bandwidth.total));
			batch = Math.min(batch, remaining);
			remaining += 100 - (used + batch + remaining);
			document.getElementById('bw_used').style.width = used + 'px';
			var bw_batch = document.getElementById('bw_batch');
			bw_batch.style.width = batch + 'px';
			bw_batch.style.backgroundPosition = '-' + used + 'px -34px';
			var bw_remaining = document.getElementById('bw_remaining');
			bw_remaining.style.width = remaining + 'px';
			bw_remaining.style.backgroundPosition = '-' + (used + batch) + 'px -17px';
			document.getElementById('bandwidth').style.visibility = 'visible';
		}

	},

	hide: function() {
		document.getElementById('bandwidth').style.visibility = 'hidden';
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