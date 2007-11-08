var users = {

	// Placeholders for current user info
	//   These are especially convenient for the API callbacks
	//   For bandwidth and sets, -1 indicates an unlimited amount remains
	frob: null,
	username: null,
	nsid: null,
	token: null,
	is_pro: null,
	bandwidth: null,
	filesize: null,
	sets: null,

	// List of authorized users
	list: {},

	// A one-time custom callback after login
	after_login: null,

	// Shortcut for the auth sequence
	login: function(fresh) {
		status.set(locale.getString('status.login'));
		if (users.token) {
			flickr.auth.checkToken(users.token);
		} else {
			flickr.auth.getFrob(fresh);
		}
	},
	_login: function() {
		users.update();
		settings.load();
		if (users.username) {

			// User specific API calls that must be made (and havent already been)
			flickr.people.getInfo(users.nsid);
			flickr.people.getUploadStatus();
			flickr.photosets.getList(users.nsid);

			// Update the UI
			document.getElementById('username').firstChild.nodeValue =
				locale.getFormattedString('username', [users.username]) + '  ';
			document.getElementById('switch').style.display = 'inline';
			document.getElementById('login').style.display = 'none';
			status.set(locale.getString('status.ready'));
			buttons.upload.enable();
			meta.login();

		} else {
			users.logout();
		}
		if ('function' == typeof users.after_login) {
			users.after_login();
			users.after_login = null;
		}
	},

	// Logout
	logout: function() {
		settings.save();
		users.frob = null;
		users.username = null;
		users.nsid = null;
		users.token = null;
		users.is_pro = null;
		users.bandwidth = null;
		users.filesize = null;
		users.sets = null;

		// Update the UI
		document.getElementById('username').firstChild.nodeValue =
			locale.getString('notloggedin') + '  ';
		document.getElementById('switch').style.display = 'none';
		document.getElementById('login').style.display = 'block';
		document.getElementById('bw_remaining').style.display = 'none';
		status.set(locale.getString('status.disconnected'));
		meta.logout();
		document.getElementById('buddyicon').src = 'http://flickr.com/images/buddyicon.jpg';
		document.getElementById('photostream_pro').style.display = 'none';

	},

	// Update the app for the newly logged in user
	update: function() {
		if (null == users.username) {
			return;
		}

		// Add the user to the list or update a user already in the list
		for each (var u in users.list) {
			u.current = false;
		}
		if (users.list[users.username]) {
			var u = users.list[users.username];
			u.token = users.token;
			u.is_pro = users.is_pro;
			u.bandwidth = users.bandwidth;
			u.filesize = users.filesize;
			u.sets = users.sets;
			u.current = true;
		} else {
			users.list[users.username] = new User(users.username, users.nsid, users.token,
				users.is_pro, users.bandwidth, users.filesize, users.sets);
		}

	},

	// Load users from a file
	load: function() {
		users.list = file.read('users.json');

		// Login as the current user
		for each (var u in users.list) {
			if (u.current) {
				users.username = u.username;
				users.nsid = u.nsid;
				users.token = u.token;
				users.is_pro = u.is_pro;
				users.bandwidth = u.bandwidth;
				users.filesize = u.filesize;
				users.sets = u.sets;
				users.login();
				break;
			}
		}

		// Force the bandwidth meter if there's no one logged in
		if (!users.username) {
			free.update();
		}

	},

	// Save users to a file
	save: function() {
		file.write('users.json', users.list);
	}

};

// A user encapsulated
var User = function(username, nsid, token, is_pro, bw, filesize, sets) {
	this.username = username;
	this.nsid = nsid;
	this.token = token;
	this.is_pro = is_pro;
	this.bandwidth = bw;
	this.filesize = filesize;
	this.sets = sets;
	this.current = true;
	this.settings = {
		is_public: 1,
		is_friend: 0,
		is_family: 0,
		content_type: 1,
		hidden: 1,
		safety_level: 1,
		resize: -1
	};
};