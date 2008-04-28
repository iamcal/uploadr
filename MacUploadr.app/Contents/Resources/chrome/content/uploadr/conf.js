/*
 * Flickr Uploadr
 *
 * Copyright (c) 2007-2008 Yahoo! Inc.  All rights reserved.  This library is
 * free software; you can redistribute it and/or modify it under the terms of
 * the GNU General Public License (GPL), version 2 only.  This library is
 * distributed WITHOUT ANY WARRANTY, whether express or implied. See the GNU
 * GPL for more details (http://www.gnu.org/licenses/gpl.html)
 */

const Cc = Components.classes;
const Ci = Components.interfaces;
const NS_HTML = 'http://www.w3.org/1999/xhtml';

// Grab the API endpoint from the prefs
var SITE_HOST = '', REST_HOST = '', UPLOAD_HOST = '';
(function() {
	var prefs = Cc['@mozilla.org/preferences-service;1']
		.getService(Ci.nsIPrefBranch);
	try { SITE_HOST = prefs.getCharPref('flickr.site_host'); }
	catch (err) { SITE_HOST = 'www.flickr.com'; }
	try { REST_HOST = prefs.getCharPref('flickr.rest_host'); }
	catch (err) { REST_HOST = 'api.flickr.com'; }
	try { UPLOAD_HOST = prefs.getCharPref('flickr.upload_host'); }
	catch(err) { UPLOAD_HOST = 'up.flickr.com'; }
})();

var conf = {

	// What version am I?
	version: '3.x',

	app_ini: {},

	// What types of API events should be written to the console?
	console: {
		thumb: false,
		request: false,
		response: false,
		upload: false,
		error: true,
		timeout: true,
		retry: true
	},

	// Scrolling threshold for dragging (pixels);
	scroll: 20,

	// Upload timeout (milliseconds);
	timeout: 60000,

	// Upload progress-checking interval (milliseconds)
	check: 200,

	// How often should the app auto-save metadata? (seconds)
	auto_save: 60,

	// Should we warn users when they're about to clobber data when
	// leaving a batch?
	confirm_batch_save: false,

	// Should we auto-select images as they're added? (at least until
	// the user clicks)
	auto_select: false,

	// Should we auto-select after rotating
	auto_select_after_rotate: false,

	// How many times (in a row) should we automatically retry a photo?
	//   This is PER PHOTO and will be reset after each successful upload
	auto_retry_count: 3,

	// How many times should checkTickets retry before giving up?
	tickets_retry_count: 10,



	//
	// Feature switches
	//

	// Should we use the new socket uploadr?
	//   Using XHR for uploads (socket_uploadr: false) is deprecated
	socket_uploadr: true,



	//
	// Not advised to change below here
	//

	// Size of thumbnails
	//   Changing this will require CSS tweaks
	thumb_size: 100,

	// Maximum size of a video upload (kilobytes)
	//   This is used as a fallback if no one is logged in
	videosize: 150 << 10,

	// Upload mode
	//   Must be 'sync' or 'async'
	//   'sync' is very very deprecated
	mode: 'async',

	// Scrollbar width (pixels)
	scrollbar_width: 14,

	// Load are parse the application.ini file
	load_ini: function(){

		var f = Components.classes["@mozilla.org/file/directory_service;1"]
			.getService(Components.interfaces.nsIProperties)
			.get('resource:app', Components.interfaces.nsILocalFile);

		f.append('application.ini');

		var data = '';
		var fstream = Cc['@mozilla.org/network/file-input-stream;1']
			.createInstance(Ci.nsIFileInputStream);
		var sstream = Cc['@mozilla.org/scriptableinputstream;1']
			.createInstance(Ci.nsIScriptableInputStream);
		fstream.init(f, -1, 0, 0);
		sstream.init(fstream); 
		var str = sstream.read(4096);
		while (str.length > 0) {
			data += str;
			str = sstream.read(4096);
		}
		sstream.close();
		fstream.close();

		var lines = data.split("\n");
		var section = 'UNKNOWN';

		for (var i=0; i<lines.length; i++){

			if (/^[;#]/.test(lines[i])) continue;

			var ret = null;

			if (ret = /^([a-zA-Z]+)=(.*)$/.exec(lines[i])){
				if (!this.app_ini[section]){
					this.app_ini[section] = {};
				}
				this.app_ini[section][ret[1]] = ret[2];
			}
			if (ret = /^\[(.*)\]$/.exec(lines[i])){
				section = ret[1];
			}
		}


		// use some of the parsed options

		this.version = this.app_ini.App.Version.replace(/a/, ' alpha ').replace(/b/, ' beta ');
	},
};
