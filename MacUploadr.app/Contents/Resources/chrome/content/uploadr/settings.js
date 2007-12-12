/*
 * Flickr Uploadr
 *
 * Copyright (c) 2007 Yahoo! Inc.  All rights reserved.  This library is free
 * software; you can redistribute it and/or modify it under the terms of the
 * GNU General Public License (GPL), version 2 only.  This library is
 * distributed WITHOUT ANY WARRANTY, whether express or implied. See the GNU
 * GPL for more details (http://www.gnu.org/licenses/gpl.html)
 */

// Settings key for the API
//   is_public: 1 = yes, 0 = no
//   is_friend: 1 = yes, 0 = no (if is_public = 0)
//   is_family: 1 = yes, 0 = no (if is_public = 0)
//   content_type: 1 = photo, 2 = screenshot, 3 = other
//   hidden: 1 = no, 2 = yes
//   safety_level: 1 = safe, 2 = moderate, 3 = restricted

var settings = {

	// The settings themselves
	is_public: null,
	is_friend: null,
	is_family: null,
	content_type: null,
	hidden: null,
	safety_level: null,
	resize: -1,

	// Load settings from the current user, which were loaded from the users.json file and
	// get anything not set there from the web
	load: function() {

		// Get prefs stored locally with the user
		var u = users.list[users.username].settings;
		settings.is_public = u.is_public;
		settings.is_friend = u.is_friend;
		settings.is_family = u.is_family;
		settings.content_type = u.content_type;
		settings.hidden = u.hidden;
		settings.safety_level = u.safety_level;
		settings.resize = u.resize;

		// Show the default settings in the metadata fields
		meta.defaults({
			is_public: settings.is_public,
			is_friend: settings.is_friend,
			is_family: settings.is_family,
			content_type: settings.content_type,
			hidden: settings.hidden,
			safety_level: settings.safety_level
		});

		// Fetch anything available by API that wasn't found locally
		if (isNaN(settings.is_public) || null == settings.is_public ||
			isNaN(settings.is_friend) || null == settings.is_friend ||
			isNaN(settings.is_family) || null == settings.is_family) {
			flickr.prefs.getPrivacy();
		}
		if (isNaN(settings.content_type) || null == settings.content_type) {
			flickr.prefs.getContentType();
		}
		if (isNaN(settings.hidden) || null == settings.hidden) {
			flickr.prefs.getHidden();
		}
		if (isNaN(settings.safety_level) || null == settings.safety_level) {
			flickr.prefs.getSafetyLevel();
		}

	},

	// Save settings back to the current user
	save: function() {

		// Store settings locally
		if (users.username) {
			var u = users.list[users.username].settings;
			u.is_public = isNaN(settings.is_public) ? 1 : settings.is_public;
			u.is_friend = isNaN(settings.is_friend) ? 1 : settings.is_friend;
			u.is_family = isNaN(settings.is_family) ? 1 : settings.is_family;
			u.content_type = isNaN(settings.content_type) ? 1 : settings.content_type;
			u.hidden = isNaN(settings.hidden) ? 1 : settings.hidden;
			u.safety_level = isNaN(settings.safety_level) ? 1 : settings.safety_level;
			u.resize = null == settings.resize ? -1 : settings.resize;
		}

	},

	// Show the settings dialog
	show: function() {

		// Open the settings dialog, passing a copy of the users list,
		// the current username and the maximum file size string
		var u = eval(users.list.toSource());
		var result = {};
		window.openDialog('chrome://uploadr/content/settings.xul', 'dialog_settings',
			'chrome,modal', users.username, u, locale.getFormattedString(
			'settings.resize.prompt.' + (users.is_pro ? 'pro' : 'free'),
			[users.filesize >> 10]), result);

		// If we're adding a new user, auth and re-open the dialog
		if (result.add_user) {
			users.after_login = settings.show;
			users.logout(true);
			users.login(true);
		}

		// Otherwise, save changes to settings and users
		else if (result.ok) {

			// Replace old users object with new one
			users.list = u;

			// Login as a different user if needed
			var logged_out = true;
			for each (var user in users.list) {
				if (user.current) {
					logged_out = false;
					if (user.username != users.username) {
						users.logout(false);
						users.token = user.token;
						users.login(false);
					}
					break;
				}
			}
			if (logged_out) {
				users.logout(false);
			}

			// Apply new settings
			var s = users.list[user.username].settings;
			settings.is_public = s.is_public;
			settings.is_friend = s.is_friend;
			settings.is_family = s.is_family;
			settings.content_type = s.content_type;
			settings.hidden = s.hidden;
			settings.safety_level = s.safety_level;
			settings.resize = s.resize;
			meta.defaults({
				is_public: s.is_public,
				is_friend: s.is_friend,
				is_family: s.is_family,
				content_type: s.content_type,
				hidden: s.hidden,
				safety_level: s.safety_level
			});

			// Get permission to overwrite any changes that were made
			if (0 < photos.count &&
				!confirm(locale.getFormattedString('settings.overwrite.text', [photos.count]),
					locale.getString('settings.overwrite.title'),
					locale.getString('settings.overwrite.ok'),
					locale.getString('settings.overwrite.cancel'))) {
				return;
			}

			// Save metadata
			if (1 == photos.selected.length) {
				meta.save(photos.selected[0]);
			} else if (1 < photos.selected.length) {
				meta.save();
			}

			// Update all photos
			var ii = photos.list.length;
			for (var i = 0; i < ii; ++i) {
				var photo = photos.list[i];
				if (null != photo) {
					for each (var k in ['is_public', 'is_friend', 'is_family']) {
						photo[k] = settings[k];
					}
					photo.content_type = settings.content_type;
					photo.hidden = settings.hidden;
					photo.safety_level = settings.safety_level;
				}
			}

			// Refresh visible photo metadata if necessary
			if (1 == photos.selected.length) {
				meta.load(photos.selected[0]);
				meta.enable();
			} else if (1 < photos.selected.length) {
				meta.load();
				meta.batch();
			}

		}

	}

};