events.tools = {

	// Add photos
	add: function() {
		photos.add();
	},

	// Remove selected photos
	remove: function() {

		// Nothing to do if somehow there are no selected photos
		var ii = photos.selected.length;
		if (0 == ii) {
			return;
		}

		// Remove selected photos
		for (var i = 0; i < ii; ++i) {
			var id = photos.selected[i];
			var li = document.getElementById('photo' + id);
			li.parentNode.removeChild(li);

			// Free the size of this file
			if (users.username && !users.is_pro) {
				var size = uploadr.fsize(photos.list[id].path);
				photos.batch_size -= size;
				if (users.bandwidth.remaining - photos.batch_size) {
					status.clear();
				}
				free.update();
			}

			photos.list[id] = null;
			--photos.count;
			photos.unsaved = true;
		}

		// Clear the selection
		photos.selected = [];
		events.photos.click({'target': {}});

		// Allow upload only if there are photos
		if (photos.count) {
			document.getElementById('button_upload').disabled = false;
		} else {
			photos.unsaved = false;
			document.getElementById('button_upload').disabled = true;
		}

	},

	// Rotate selected photos
	rotate_l: function() {
		photos.rotate(-90);
	},
	rotate_r: function() {
		photos.rotate(90);
	},

	// Show the settings page
	settings: function() {
		pages.go('settings');
		buttons.show(['back', 'ok']);	
	}

};

events.buttons = {

	// Back button for the settings and users pages, perhaps more uses later
	back: function() {
		var current = pages.current();
		if ('users' == current) {
			//
		} else if ('settings' == current) {
			settings.abandon();
		}
		pages.go('photos');
		if (users.username) {
			buttons.show('upload');
		} else {
			buttons.show('login');
		}
	},

	// OK button for the settings and users pages, perhaps more uses later
	ok: function() {

		// Change the logged-in user
		var username = document.getElementById('u_user').value;
		if ('users' == pages.current() && '' != username) {
			users.list[users.username].current = false;
			var u = users.list[username];
			users.username = u.username;
			users.nsid = u.nsid;
			users.token = u.token;
			users.list[users.username].current = true;
			users.login();
		}

		settings.update();
		pages.go('photos');
		if (users.username) {
			buttons.show('upload');
		} else {
			buttons.show('login');
		}
	},

	// Login button, shown on the photos page until logged in
	login: function() {
		if (users.username) {
			pages.go('users');
			buttons.show(['back', 'ok']);
		} else {
			users.login();
		}
	},

	// Upload button, shown on the photos page after logged in
	upload: function() {

		// Save the selected photo before uploading
		events.photos.click({'target': {}});
		settings.update();

		photos.upload();
	},

	// Cancel an upload batch
	cancel: function() {
		if (confirm(locale.getString('progress.cancel'),
			locale.getString('progress.cancel.title'))) {
			upload_cancel = true;
		}
	},

	// Launch a web browser to buy a Pro account
	go_pro: function() {
		var io = Cc['@mozilla.org/network/io-service;1'].getService(Ci.nsIIOService);
		var uri = io.newURI('http://flickr.com/upgrade/', null, null);
		var eps = Cc['@mozilla.org/uriloader/external-protocol-service;1'].getService(
			Ci.nsIExternalProtocolService);
		eps.loadURI(uri, null);
		alert(locale.getString('go_pro'), locale.getString('go_pro.title'));
	}

};

events.arrows = {

	up: function(e) {
		events.arrows._arrow(e, findr.width());
	},

	right: function(e) {
		events.arrows._arrow(e, -1);
	},

	down: function(e) {
		events.arrows._arrow(e, -findr.width());
	},

	left: function(e) {
		events.arrows._arrow(e, 1);
	},

	// Abstract away the actual arrow key actions
	_arrow: function(e, inc) {
		if ('photos' != pages.current() || null == photos.last) {
			return;
		}
		var i = photos.last + inc;
		var next = photos.list[i];
		i = photos.last + inc;
		var ii = photos.list.length;
		while (null == next && i >= 0 && i < ii) {
			next = photos.list[i];
			i = photos.last + inc;
		}
		if (null != next) {
			events.photos.click({
				'target': document.getElementById('photo' + next.id).getElementsByTagName('img')[0],
				'shiftKey': e.shiftKey,
				'ctrlKey': e.ctrlKey,
				'metaKey': e.metaKey
			});
		}
	}

};