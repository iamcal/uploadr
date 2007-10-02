const Cc = Components.classes;
const Ci = Components.interfaces;
const NS_HTML = 'http://www.w3.org/1999/xhtml';

// A placeholder, because the events_*.js files all create objects within events
var events = {};

var uploadr = {

	// Configuration
	conf: {

		// Size of thumbnails
		thumbSize: 100,

		// Scrolling threshold for dragging (pixels);
		scroll: 20,

		// Upload mode
		//   Must be 'sync' or 'async'
		mode: 'async',

		// How often should the app auto-save metadata? (seconds)
		auto_save: 60

	}

};