/*
 * Flickr Uploadr
 *
 * Copyright (c) 2007 Yahoo! Inc.  All rights reserved.  This library is free
 * software; you can redistribute it and/or modify it under the terms of the
 * GNU General Public License (GPL), version 2 only.  This library is
 * distributed WITHOUT ANY WARRANTY, whether express or implied. See the GNU
 * GPL for more details (http://www.gnu.org/licenses/gpl.html)
 */

var settings = {

	load: function() {

		// Show everything for logged in users
		if (window.arguments[0]) {
			document.getElementById('notloggedin').style.display = 'none';
			document.getElementById('loggedin').style.display = '-moz-box';

			// Update the UI for the passed-in settings
			var s = window.arguments[1];
			if ({} != s) {
				document.getElementById('is_public').value = s.is_public;
				document.getElementById('is_friend').checked = 1 == s.is_friend;
				document.getElementById('is_family').checked = 1 == s.is_family;
				settings.is_public(s.is_public);
				document.getElementById('content_type').value = s.content_type;
				document.getElementById('hidden').checked = 2 == s.hidden;
				document.getElementById('safety_level').value = s.safety_level;
				document.getElementById('resize').value = s.resize;
			}
			document.getElementById('resize_prompt').firstChild.nodeValue = window.arguments[3];

			// Users
			var u = window.arguments[2];
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

		}

		// Show a login message for non-logged-in users
		else {
			document.getElementById('notloggedin').style.display = '-moz-box';
			document.getElementById('loggedin').style.display = 'none';
		}

		moveToAlertPosition();
	},

	cancel: function() {
	},

	ok: function() {

		// Settings
		var s = window.arguments[1];
		s.is_public = parseInt(document.getElementById('is_public').value);
		s.is_friend = document.getElementById('is_friend').checked ? 1 : 0;
		s.is_family = document.getElementById('is_family').checked ? 1 : 0;
		s.content_type = document.getElementById('content_type').value;
		s.hidden = document.getElementById('hidden').checked ? 2 : 1;
		s.safety_level = document.getElementById('safety_level').value;
		s.resize = parseInt(document.getElementById('resize').value);

		// Users
		window.arguments[4].list = [];
		var item = document.getElementById('user').getElementsByTagName(
			'menupopup')[0].getElementsByTagName('menuitem');
		var ii = item.length;
		for (var i = 0; i < ii; ++i) {
			window.arguments[4].list.push(item[i].value);
		}
		window.arguments[4].change_user = document.getElementById('user').value;

	},

	// Remove a user from the list, which will be made permanent by pressing OK
	remove_user: function() {
		var dropdown = document.getElementById('user');
		dropdown.removeItemAt(dropdown.selectedIndex);
		dropdown.selectedIndex = 0;
	},

	// Close this dialog to start the auth process for a new user, after which we'll return here
	add_user: function() {
		window.arguments[4].add_user = true;
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