/*
 * Flickr Uploadr
 *
 * Copyright (c) 2007-2008 Yahoo! Inc.  All rights reserved.  This library is
 * free software; you can redistribute it and/or modify it under the terms of
 * the GNU General Public License (GPL), version 2 only.  This library is
 * distributed WITHOUT ANY WARRANTY, whether express or implied. See the GNU
 * GPL for more details (http://www.gnu.org/licenses/gpl.html)
 */

var file = {

	// Read a JSON file and return the object
	read: function(name) {
		try {
			var profile = Cc['@mozilla.org/file/directory_service;1']
				.getService(Ci.nsIProperties).get('ProfD', Ci.nsIFile);
			profile.append(name);
			var data = '';
			var fstream = Cc['@mozilla.org/network/file-input-stream;1']
				.createInstance(Ci.nsIFileInputStream);
			var sstream = Cc['@mozilla.org/scriptableinputstream;1']
				.createInstance(Ci.nsIScriptableInputStream);
			fstream.init(profile, -1, 0, 0);
			sstream.init(fstream); 
			var str = sstream.read(4096);
			while (str.length > 0) {
				data += str;
				str = sstream.read(4096);
			}
			sstream.close();
			fstream.close();
			if (/\.js(?:on)?$/.test(name)) { return eval(data); }
			else { return data };
		} catch (err) {
			if (/\.js(?:on)?$/.test(name)) { return {}; }
			else { return '' };
		}
	},

	// Write an object into a file as JSON
	write: function(name, data) {
		var profile = Cc['@mozilla.org/file/directory_service;1']
			.getService(Ci.nsIProperties).get('ProfD', Ci.nsIFile);
		profile.append(name);
		var _stream = Cc['@mozilla.org/network/file-output-stream;1']
			.createInstance(Ci.nsIFileOutputStream);
		_stream.init(profile, 0x02 /* Write-only */ | 0x08 /* Create */
			| 0x20 /* Truncate */, 0666, 0);
		var stream = Cc['@mozilla.org/intl/converter-output-stream;1']
			.createInstance(Ci.nsIConverterOutputStream);
		stream.init(_stream, 'UTF-8', 0, '?'.charCodeAt(0));
		if ('string' == typeof data) {
			stream.writeString(data);
		} else {
			stream.writeString(data.toSource());
		}
		stream.close();
		_stream.close();
	},

	// File size in kilobytes
	size: function(path) {
		try {
			var file = Cc['@mozilla.org/file/local;1']
				.createInstance(Ci.nsILocalFile);
			file.initWithPath(path);
			return 1 + Math.round(file.fileSize >> 10);
		} catch (err) {
			Components.utils.reportError(err);
			return 0;
		}
	},

    // Delete
    remove: function(name) {
        try {
            var file = Cc['@mozilla.org/file/directory_service;1']
				.getService(Ci.nsIProperties).get('ProfD', Ci.nsIFile);
			file.append(name);
			if (file.exists()) {
			    file.remove(false);
			}
        } catch (err) {
            Components.utils.reportError(err);
        }
    }
};