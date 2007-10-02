events.settings = {

	load: function() {

		// Settings
		var s = window.arguments[0];
		if ({} != s) {
			document.getElementById('is_public').value = s.is_public;
			document.getElementById('is_friend').checked = 1 == s.is_friend;
			document.getElementById('is_family').checked = 1 == s.is_family;
			events.settings.is_public();
			document.getElementById('content_type').selectedIndex = s.content_type - 1;
			document.getElementById('hidden').selectedIndex = s.hidden - 1;
			document.getElementById('safety_level').selectedIndex = s.safety_level - 1;
			document.getElementById('resize').value = s.resize;
		}
		document.getElementById('resize_note').firstChild.nodeValue = window.arguments[2];

		// Users
		var u = window.arguments[1];
		if ([] != u) {
			var dropdown = document.getElementById('user');
			dropdown.removeAllItems();
			u.sort(function(a, b) {
				return a.username < b.username;
			});
			var ii = u.length;
			for (var i = 0; i < ii; ++i) {
				dropdown.appendItem(u[i].username, u[i].username);
				if (u[i].current) {
					dropdown.selectedIndex = i;
				}
			}
		}

		centerWindowOnScreen();
	},

	cancel: function() {
	},

	ok: function() {

		// Settings
		var s = window.arguments[0];
		s.is_public = parseInt(document.getElementById('is_public').value);
		s.is_friend = document.getElementById('is_friend').checked ? 1 : 0;
		s.is_family = document.getElementById('is_family').checked ? 1 : 0;
		s.content_type = document.getElementById('content_type').selectedIndex + 1;
		s.hidden = document.getElementById('hidden').selectedIndex + 1;
		s.safety_level = document.getElementById('safety_level').selectedIndex + 1;
		s.resize = parseInt(document.getElementById('resize').value);

		// Users
		window.arguments[3].change_user = document.getElementById('user').value;

	},

	// Remove a user from the list, which will be made permanent by pressing OK
	remove_user: function() {
		var dropdown = document.getElementById('user');
		var u = window.arguments[1];
		var i = 0;
		for each (var user in u) {
			if (dropdown.value == user.username) {
				delete u[i];
				break;
			}
			++i;
		}
		dropdown.removeItemAt(dropdown.selectedIndex);
		dropdown.selectedIndex = 0;
	},

	// Close this dialog to start the auth process for a new user, after which we'll return here
	add_user: function() {
		window.arguments[3].add_user = true;
		window.close();
	},

	// Properly enable/disable the checkboxes available for private photos to be shared with
	// friends and/or family
	is_public: function(value) {
		if (1 == parseInt(value)) {
			document.getElementById('is_friend').checked = false;
			document.getElementById('is_family').checked = false;
			document.getElementById('is_friend').disabled = true;
			document.getElementById('is_family').disabled = true;
		} else {
			document.getElementById('is_friend').disabled = false;
			document.getElementById('is_family').disabled = false;
		}
	}

};