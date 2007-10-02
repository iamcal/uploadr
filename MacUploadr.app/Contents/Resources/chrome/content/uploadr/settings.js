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
	show: function(preserve) {
		if (null == preserve) {
			preserve = false;
		}

		// Current settings and users to send along to the dialog
		var s = {};
		var u = [];
		if (!preserve) {
			s = {
				is_public: settings.is_public,
				is_friend: settings.is_friend,
				is_family: settings.is_family,
				content_type: settings.content_type,
				hidden: settings.hidden,
				safety_level: settings.safety_level,
				resize: settings.resize
			};
			u = [];
			for (var uname in users.list) {
				u.push({
					username: uname,
					current: uname == users.username
				});
			}
		}

		// Open the dialog
		var result = {};
		window.openDialog('chrome://uploadr/content/settings.xul', 'dialog_settings',
			'chrome,modal', s, u, locale.getFormattedString('settings.resize.note',
			[users.filesize >> 10]), result);

		// If we're adding a new user, auth and re-open the dialog
		if (result.add_user) {
			users.after_login = settings.show;
			users.logout();
			users.login();
		}

		// Otherwise, save changes to settings and users
		else {

			// Remove removed users
			var list = [];
			for each (var user in u) {
				list.push(user.username);
			}
			var deleted_current = false;
			for (var username in users.list) {
				if (-1 == list.indexOf(username)) {
					deleted_current |= users.list[username].current;
					delete users.list[username];
				}
			}
			if (0 == list.length) {
				users.username = null;
				users.logout();
			}

			// Change users if necessary
			if ('undefined' != typeof result.change_user &&
				result.change_user != users.username) {
				if (deleted_current) {
					users.username = null;
				}
				users.logout();
				if ('' != result.change_user) {
					users.token = users.list[result.change_user].token;
					users.login();
				}
			}				

			// Decide what's changed
			var changed_privacy = 
				settings.is_public != s.is_public ||
				settings.is_friend != s.is_friend ||
				settings.is_family != s.is_family;
			var changed_melons =
				settings.content_type != s.content_type ||
				settings.hidden != s.hidden ||
				settings.safety_level != s.safety_level;

			// Get permission to overwrite any changes that were made
			if (0 < photos.count && (changed_privacy || changed_melons) &&
				!confirm(locale.getString('settings.overwrite'),
					locale.getString('settings.overwrite.title'))) {
				return;
			}

			// Save back to the settings object
			if (changed_privacy) {
				settings.is_public = s.is_public;
				settings.is_friend = s.is_friend;
				settings.is_family = s.is_family;
			}
			if (changed_melons) {
				settings.content_type = s.content_type;
				settings.hidden = s.hidden;
				settings.safety_level = s.safety_level;
			}
			settings.resize = s.resize;

			// Save metadata for a single photo
			if (1 == photos.selected.length) {
				meta.save(photos.selected[0]);
			}

			// Update all photos
			var ii = photos.list.length;
			var privacy_keys = ['is_public', 'is_friend', 'is_family'];
			var melons_keys = ['content_type', 'hidden', 'safety_level'];
			for (var i = 0; i < ii; ++i) {
				var photo = photos.list[i];
				if (null != photo) {
					for each (var k in privacy_keys) {
						if (changed_privacy || null == photo[k]) {
							photo[k] = settings[k];
						}
					}
					for each (var k in melons_keys) {
						if (changed_melons || null == photo[k]) {
							photo[k] = settings[k];
						}
					}
				}
			}

			// Refresh the single-photo metadata if necessary
			if (1 == photos.selected.length) {
				meta.load(photos.selected[0]);
				meta.enable();
			}

		}

	}

};