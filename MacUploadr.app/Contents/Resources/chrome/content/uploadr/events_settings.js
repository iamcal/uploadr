events.settings = {

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