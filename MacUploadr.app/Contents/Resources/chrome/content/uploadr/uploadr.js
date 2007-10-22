const Cc = Components.classes;
const Ci = Components.interfaces;
const NS_HTML = 'http://www.w3.org/1999/xhtml';

var uploadr = {
	conf: {

		// Size of thumbnails
		thumbSize: 100,

		// Scrolling threshold for dragging (pixels);
		scroll: 20,

		// Upload mode
		//   Must be 'sync' or 'async'
		mode: 'async',

		// Upload timeout (milliseconds);
		timeout: 60000,

		// Upload progress-checking interval (milliseconds)
		check: 400,

		// How often should the app auto-save metadata? (seconds)
		auto_save: 60,

		// What version am I?
		version: '3.0.1',

		// Configure what types of API events should be written to the console
		console: {
			request: false,
			response: false,
			timeout: false
		},

		// Should we warn users when they're about to clobber data when leaving a batch?
		confirm_batch_save: false

	}
};

// Make the $ plain old getElementById and jQuery not conflict
/*
jQuery.noConflict();
var $ = function(id) {
	return document.getElementById(id);
};
*/