events.users = {

	// Remove a user from the list
	remove: function() {
		var selected = document.getElementById('u_user').value;
		delete users.list[selected];
		users.update();
		if (selected == users.username) {
			users.logout();
		}
	},

	// Start the login process for a new user
	add: function() {
		users.logout();
		users.login();
	}

};