// Events for pressed buttons
events.buttons = {

	// Login button, shown on the photos page until logged in
	login: function() {
		if (users.username) {
			settings.show();
		} else {
			users.login();
		}
	},

	// Upload button, shown on the photos page after logged in
	upload: function() {

		// Save the selected photo before uploading
		events.photos.click({target: {}});

		photos.upload();
	},

	// Cancel an upload batch
	cancel: function() {
		if (confirm(locale.getString('progress.cancel'),
			locale.getString('progress.cancel.title'))) {
			upload.cancel = true;
		}
	},

	// Launch a web browser to buy a Pro account
	go_pro: function() {
		launch_browser('http://flickr.com/upgrade/');
		alert(locale.getString('go_pro'), locale.getString('go_pro.title'));
	}

};

// Events for pressed arrow keys
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
				target: document.getElementById('photo' + next.id).getElementsByTagName('img')[0],
				shiftKey: e.shiftKey,
				ctrlKey: e.ctrlKey,
				metaKey: e.metaKey
			});
		}
	}

};