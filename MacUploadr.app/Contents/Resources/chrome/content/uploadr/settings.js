/*
 * Flickr Uploadr
 *
 * Copyright (c) 2007-2008 Yahoo! Inc.  All rights reserved.  This library is
 * free software; you can redistribute it and/or modify it under the terms of
 * the GNU General Public License (GPL), version 2 only.  This library is
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

		// For fresh users, go straight to the website
		if (users.list[users.nsid].fresh) {
			users.list[users.nsid].fresh = false;
			wrap.prefs.getPrivacy(users.token);
			wrap.prefs.getContentType(users.token);
			wrap.prefs.getHidden(users.token);
			wrap.prefs.getSafetyLevel(users.token);
		}

		// For everyone else, start by trying to use locally stored prefs
		else {
			var u = users.list[users.nsid].settings;
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
				wrap.prefs.getPrivacy(users.token);
			}
			if (isNaN(settings.content_type) || null == settings.content_type) {
				wrap.prefs.getContentType(users.token);
			}
			if (isNaN(settings.hidden) || null == settings.hidden) {
				wrap.prefs.getHidden(users.token);
			}
			if (isNaN(settings.safety_level) || null == settings.safety_level) {
				wrap.prefs.getSafetyLevel(users.token);
			}

		}

	},

	// Save settings back to the current user
	save: function() {

		// Store settings locally
		if (users.nsid) {
			var u = users.list[users.nsid].settings;
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
		// the current NSID and the maximum file size string
		var u = eval(users.list.toSource());
		var result = {};
		
 		window.openDialog('chrome://uploadr/content/settings.xul', 'dialog_settings',
 			'chrome', users.nsid, u, locale.getFormattedString(
 			'settings.resize.prompt.' + (users.is_pro ? 'pro' : 'free'),
 			[users.filesize >> 10]), result);

		// If we're adding a new user, auth// and re-open the dialog
		if (result.add_user) {
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
					if (user.nsid != users.nsid) {
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
			if (user && user.nsid) {
				var s = users.list[user.nsid].settings;
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
			} else {
				settings.is_public = 1;
				settings.is_friend = 0;
				settings.is_family = 0;
				settings.content_type = 1;
				settings.hidden = 1;
				settings.safety_level = 1;
				settings.resize = -1;
				meta.defaults({
					is_public: 1,
					is_friend: 0,
					is_family: 0,
					content_type: 1,
					hidden: 1,
					safety_level: 1
				});
			}

			// If they've changed to a free account and have videos, warn them
			if (user && 'boolean' == typeof users.list[user.nsid].is_pro &&
				!users.list[user.nsid].is_pro) {
				var v_count = 0;
				for each (var p in photos.list) {
					if (null != p && photos.is_video(p.path)) {
						++v_count;
					}
				}
				if (v_count) {
					alert(locale.getString('video.free.text'),
						locale.getString('video.free.title'));
				}
			}

			// Get permission to overwrite any changes that were made
			if (0 < photos.count &&
				!confirm(locale.getFormattedString('settings.overwrite.text',
					[photos.count]),
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
				meta.load();
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

			// Videos can't be restricted so either update them or delete them
			if (3 == settings.safety_level) {

				// Tally up videos
				var p_count = 0;
				var v_count = 0;
				for each (var p in photos.list) {
					if (null == p) {
						continue;
					}
					if (photos.is_photo(p.path)) {
						++p_count;
					} else if (photos.is_video(p.path)) {
						++v_count;
					}
				}

				// If there are videos, bother them
				if (v_count) {
					var result = {};

					// Decide the plurality string
					//   Each dialog has identical strings but they're coded
					//   as follows for varied pluralities:
					//     XXX.sz.XXX: singular video, zero photos
					//     XXX.sz.XXX: plural videos, zero photos
					//     XXX.pp.XXX: singular video, plural photos
					//     XXX.pp.XXX: plural videos, plural photos
					//   Some strings appear in more than one place and use
					//   'a' to indicate they're reused (not yet, but maybe)
					var pl = (1 == v_count ? 's' : 'p') + (0 == p_count ? 'z' : 'p');

					// Aforementioned bothering
					window.openDialog(
						'chrome://uploadr/content/video_restricted.xul',
						'dialog_video_restricted', 'chrome,modal',
						locale.getString('video.edit.restricted.' + pl + '.title'),
						locale.getString('video.edit.restricted.' + pl + '.explain'),
						locale.getString('video.edit.restricted.' + pl + '.action'),
						locale.getString('video.edit.restricted.' + pl + '.note'),
						locale.getString('video.edit.restricted.' + pl + '.guidelines'),
						locale.getString('video.edit.restricted.' + pl + '.ok'),
						locale.getString('video.edit.restricted.' + pl + '.cancel'),
						'', result);

					// Remove selected videos
					if ('cancel' == result.result) {
						var ii = photos.list.length;
						for (var i = 0; i < ii; ++i) {
							if (null == photos.list[i]) {
								continue;
							}
							if (photos.is_video(photos.list[i].path)) {
								var li = document.getElementById('photo' + i);
								li.parentNode.removeChild(li);
								photos.batch_size -= photos.list[i].size;
								if (users.nsid && !users.is_pro &&
									0 < users.bandwidth.remaining - photos.batch_size) {
									status.clear();
								}
								photos.list[i] = null;
								--photos.count;
							}
						}
						ui.bandwidth_updated();

						// If remove is blocked then we know photos.normalize
						// will be called as it is unblocked
						//   We're breaking the rules a bit here but the rules
						//   are just for the UI
						if (0 == _block_remove) {
							photos.normalize();
						}

					}

					// Set a different safety level for videos
					else if ('ok' == result.result && result.safety_level) {
						var ii = photos.list.length;
						for (var i = 0; i < ii; ++i) {
							if (null != photos.list[i] &&
								photos.is_video(photos.list[i].path)) {
								photos.list[i].safety_level = result.safety_level;
							}
						}
					}

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