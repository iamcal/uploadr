// Settings key for the API
//   is_public: 1 = yes, 0 = no
//   is_friend: 1 = yes, 0 = no (if is_public = 0)
//   is_family: 1 = yes, 0 = no (if is_public = 0)
//   content_type: 1 = photo, 2 = screenshot, 3 = other
//   hidden: 1 = no, 2 = yes
//   safety_level: 1 = safe, 2 = moderate, 3 = restricted

var settings = {

	// The settings themselves
	tags: '',
	set: null,
	is_public: null,
	is_friend: null,
	is_family: null,
	content_type: null,
	hidden: null,
	safety_level: null,
	resize: null,

	// Update settings
	//   This is smart about pushing data from DOM to JS or vice-versa, gets user permission
	//   to overwrite data, and updates all photos
	update: function() {
		var page = pages.current();

		// Kills nulls and NaNs before they kill us
		//   This is basically crash-recovery code
		if (isNaN(settings.is_public) || null == settings.is_public) {
			settings.is_public = 1;
		}
		if (isNaN(settings.is_friend) || null == settings.is_friend) {
			settings.is_friend = 1;
		}
		if (isNaN(settings.is_family) || null == settings.is_family) {
			settings.is_family = 1;
		}
		if (isNaN(settings.content_type) || null == settings.content_type) {
			settings.content_type = 1;
		}
		if (isNaN(settings.hidden) || null == settings.hidden) {
			settings.hidden = 1;
		}
		if (isNaN(settings.safety_level) || null == settings.safety_level) {
			settings.safety_level = 1;
		}
		if ('' == settings.resize || null == settings.resize) {
			settings.resize = -1;
		}

		// On the settings page, update settings object and photos
		if ('settings' == page) {

			// Decide what's changed
			var changed_privacy = 'settings' == page && (
				settings.is_public != parseInt(document.getElementById('s_is_public').value) ||
				settings.is_friend != document.getElementById('s_is_friend').checked ? 1 : 0 ||
				settings.is_family != document.getElementById('s_is_family').checked ? 1 : 0
			);
			var changed_melons = 'settings' == page && (
				settings.content_type !=
					document.getElementById('s_content_type').selectedIndex + 1 ||
				settings.hidden != document.getElementById('s_hidden').selectedIndex + 1 ||
				settings.safety_level !=
					document.getElementById('s_safety_level').selectedIndex + 1
			);
	
			// Get permission to overwrite any changes that were made
			if (0 < photos.list.length && (changed_privacy || changed_melons) &&
				!confirm(locale.getString('settings.overwrite'),
				locale.getString('settings.overwrite.title'))) {
				return;
			}
	
			// Save back to the settings object
			settings.tags = document.getElementById('s_tags').value;
			settings.set = document.getElementById('s_set').value;
			if (changed_privacy) {
				settings.is_public = parseInt(document.getElementById('s_is_public').value);
				settings.is_friend = document.getElementById('s_is_friend').checked ? 1 : 0;
				settings.is_family = document.getElementById('s_is_family').checked ? 1 : 0;
			}
			if (changed_melons) {
				settings.content_type = document.getElementById('s_content_type').selectedIndex + 1;
				settings.hidden = document.getElementById('s_hidden').selectedIndex + 1;
				settings.safety_level = document.getElementById('s_safety_level').selectedIndex + 1;
			}
			settings.resize = parseInt(document.getElementById('s_resize').value);

		}

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

		// Copy changes from settings object into the UI
		//   This actually works since abandon copies the settings object back to the UI
		if ('settings' != page) {
			settings.abandon();
		}

	},

	// Copy settings from the settings object back to the UI
	//   This is useful for either abandoning changes to the UI or updating the UI when
	//   the object changes
	abandon: function() {
		document.getElementById('s_tags').value = settings.tags;
		document.getElementById('s_set').value = settings.set;
		document.getElementById('s_is_public').value = settings.is_public;
		document.getElementById('s_is_friend').checked = 1 == settings.is_friend;
		document.getElementById('s_is_family').checked = 1 == settings.is_family;
		document.getElementById('s_content_type').selectedIndex = settings.content_type - 1;
		document.getElementById('s_hidden').selectedIndex = settings.hidden - 1;
		document.getElementById('s_safety_level').selectedIndex = settings.safety_level - 1;
		document.getElementById('s_resize').value = settings.resize;
		events.settings.is_public(document.getElementById('s_is_public').value);
	},

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
		if (null == settings.content_type) {
			flickr.prefs.getContentType();
		}
		if (null == settings.hidden) {
			flickr.prefs.getHidden();
		}
		if (null == settings.safety_level) {
			flickr.prefs.getSafetyLevel();
		}

		// Update the UI
		settings.update();
		events.settings.is_public(settings.is_public);

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

	}

};