var buttons = {

	login: {
		click: function() {
			if ('small button' != document.getElementById('login').className) {
				Components.utils.reportError('foo');
				return;
			}
			if (users.username) {
				settings.show();
			} else {
				users.login();
				buttons.login.disable();
			}
		},
		enable: function() {
			document.getElementById('login').className = 'small button';
		},
		disable: function() {
			document.getElementById('login').className = 'small disabled_button';
		}
	},

	auth: {
		click: function() {
			flickr.auth.getToken(users.frob);
			pages.go('photos');
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
			if (confirm(locale.getString('upload.cancel.text'),
				locale.getString('upload.cancel.title'),
				locale.getString('upload.cancel.ok'),
				locale.getString('upload.cancel.cancel'))) {
				upload.cancel = true;
			}
		}
	}

};