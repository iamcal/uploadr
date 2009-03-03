/*
 * Flickr Uploadr
 *
 * Copyright (c) 2007-2009 Yahoo! Inc.  All rights reserved.  This library is
 * free software; you can redistribute it and/or modify it under the terms of
 * the GNU General Public License (GPL), version 2 only.  This library is
 * distributed WITHOUT ANY WARRANTY, whether express or implied. See the GNU
 * GPL for more details (http://www.gnu.org/licenses/gpl.html)
 */

var buttons = {

	login: {
		click: function() {
			if ('small button' != document.getElementById('login').className) {
				return;
			}
			if (users.nsid) {
				settings.show();
			} else {
				users.login();
			}
		},
		enable: function() {
			document.getElementById('login').className = 'small button';
			document.getElementById('big_login').className = 'button';
		},
		disable: function() {
			document.getElementById('login').className = 'small disabled_button';
			document.getElementById('big_login').className = 'disabled_button';
		}
	},

	auth: {
		click: function() {
			wrap.auth.getToken(users.frob);
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
			if (users.nsid && 'boolean' == typeof users.is_pro &&
				0 < photos.count) {
				document.getElementById('button_upload').className = 'button';
				document.getElementById('button_upload').style.display = 'block';
				document.getElementById('menu_upload').disabled = false;
			}
		},
		disable: function() {
			document.getElementById('button_upload').className = 'disabled_button';
			document.getElementById('button_upload').style.display = 'none';
			document.getElementById('menu_upload').disabled = true;
		},
		click: function() {

			// Save the selected photo before uploading
			mouse.click({target: {}});
            ui.cancel = false;
			photos.upload();
		}
	},

	cancel: {
		click: function() {
			if (confirm(locale.getString('upload.cancel.text'),
				locale.getString('upload.cancel.title'),
				locale.getString('upload.cancel.ok'),
				locale.getString('upload.cancel.cancel'))) {
				ui.cancel = true;
				upload.cancel = true;
				upload._start(upload.genErr(), upload.progress_id);
			}
		}
	}

};