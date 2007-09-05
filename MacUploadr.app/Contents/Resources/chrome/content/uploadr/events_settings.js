events.settings = {

	// Add a new set
	add_set: function() {

		// Do we have any sets to give?
		if (-1 == users.sets || 0 < users.sets) {
			var name = prompt(locale.getString('settings.set.add'),
				locale.getString('settings.set.add.title'));
			if (null == name) {
				return;
			}
			settings.set = name;
			var dropdown = document.getElementById('s_set');
			dropdown.removeItemAt(0);
			dropdown.insertItemAt(0, locale.getString('settings.set.dont'), '');
			dropdown.insertItemAt(1, name, name, '');
			dropdown.selectedIndex = 1;
			dropdown.disabled = false;
		}

		// No sets remaining
		else {
			alert(locale.getString('settings.set.exhausted'),
				locale.getString('settings.set.exhausted,title'));
		}

	},

	// Properly enable/disable the checkboxes available for private photos to be shared with
	// friends and/or family
	is_public: function(value) {
		if (1 == parseInt(value)) {
			document.getElementById('s_is_friend').checked = false;
			document.getElementById('s_is_family').checked = false;
			document.getElementById('s_is_friend').disabled = true;
			document.getElementById('s_is_family').disabled = true;
		} else {
			document.getElementById('s_is_friend').disabled = false;
			document.getElementById('s_is_family').disabled = false;
		}
	}

};