var buttons = {

	login: {
		click: function() {
			if (users.username) {
				settings.show();
			} else {
				users.login();
			}
		}
	},

	auth: {
		click: function() {
			flickr.auth.getToken(users.frob);
			pages.go('photos');
		}
	},

	go_pro: {
		click: function() {
			launch_browser('http://flickr.com/upgrade/');
			alert(locale.getString('go_pro'), locale.getString('go_pro.title'));
		}
	},

	remove: {
		enable: function() {
			document.getElementById('t_remove').className = 'button';
		},
		disable: function() {
			document.getElementById('t_remove').className = 'disabled_button';
		}
	},

	upload: {
		enable: function() {
			if (users.username && 0 < photos.count) {
				document.getElementById('button_upload').className = 'button';
				document.getElementById('menu_upload_upload').disabled = false;
			}
		},
		disable: function() {
			document.getElementById('button_upload').className = 'disabled_button';
			document.getElementById('menu_upload_upload').disabled = true;
		},
		click: function() {

			// Save the selected photo before uploading
			mouse.click({target: {}});

			photos.upload();
		}
	},

	cancel: {
		click: function() {
			if (confirm(locale.getString('progress.cancel'),
				locale.getString('progress.cancel.title'))) {
				upload.cancel = true;
			}
		}
	}

};