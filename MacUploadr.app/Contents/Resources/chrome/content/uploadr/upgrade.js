/*
 * Flickr Uploadr
 *
 * Copyright (c) 2007 Yahoo! Inc.  All rights reserved.  This library is free
 * software; you can redistribute it and/or modify it under the terms of the
 * GNU General Public License (GPL), version 2 only.  This library is
 * distributed WITHOUT ANY WARRANTY, whether express or implied. See the GNU
 * GPL for more details (http://www.gnu.org/licenses/gpl.html)
 */

var upgrade = {

	// Check for available upgrades
	//   This will break for version strings with any component having more than 2 digits
	check: function() {
		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function() {
			if (4 == xhr.readyState && 200 == xhr.status && xhr.responseXML) {
				var version = xhr.responseXML.documentElement;

				// Decimalize version strings
				var c = upgrade.decimalize(uploadr.conf.version);
				var u = version.getElementsByTagName('upgrade')[0];
				if (u) {
					u = upgrade.decimalize(u.firstChild.nodeValue);
				}
				var f = version.getElementsByTagName('force')[0];
				if (f) {
					f = upgrade.decimalize(f.firstChild.nodeValue);
				}

				// Force upgrade
				if (f && f > c) {
					launch_browser('http://flickr.com/tools/');
					alert(locale.getString('dialog.force.text'),
						locale.getString('dialog.force.title'),
						locale.getString('dialog.force.ok'));
					exit(true);
				}

				// Offered upgrade
				else if (u && u > c && confirm(locale.getString('dialog.upgrade.text'),
					locale.getString('dialog.upgrade.title'),
					locale.getString('dialog.upgrade.ok'),
					locale.getString('dialog.upgrade.cancel'))) {
					launch_browser('http://flickr.com/tools/');
					exit(true);
				}

			}
		};
		xhr.open('GET', 'http://flickr.com/tools/uploader_version.gne', true);
		xhr.send(null);
	},

	// Decimalize a version string
	decimalize: function(s) {
		var a = s.split('.');
		var ii = a.length;
		var d = 0;
		for (var i = 0; i < ii; ++i) {
			d += parseInt(a[i]) / Math.pow(10, 2 * i);
		}
		return d;
	}

};