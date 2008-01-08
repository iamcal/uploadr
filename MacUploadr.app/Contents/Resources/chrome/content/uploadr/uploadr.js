/*
 * Flickr Uploadr
 *
 * Copyright (c) 2007 Yahoo! Inc.  All rights reserved.  This library is free
 * software; you can redistribute it and/or modify it under the terms of the
 * GNU General Public License (GPL), version 2 only.  This library is
 * distributed WITHOUT ANY WARRANTY, whether express or implied. See the GNU
 * GPL for more details (http://www.gnu.org/licenses/gpl.html)
 */

const Cc = Components.classes;
const Ci = Components.interfaces;
const NS_HTML = 'http://www.w3.org/1999/xhtml';

var uploadr = {
	conf: {

		// What version am I?
		version: '3.0.2',

		// What types of API events should be written to the console?
		console: {
			request: false,
			response: false,
			error: true,
			timeout: true,
			retry: true
		},

		// Size of thumbnails
		thumbSize: 100,

		// Scrolling threshold for dragging (pixels);
		scroll: 20,

		// Upload timeout (milliseconds);
		timeout: 60000,

		// Upload progress-checking interval (milliseconds)
		check: 400,

		// How often should the app auto-save metadata? (seconds)
		auto_save: 60,

		// Should we warn users when they're about to clobber data when leaving a batch?
		confirm_batch_save: false,

		// Should we auto-select images as they're added? (at least until the user clicks)
		auto_select: false,

		// Should we auto-select after rotating
		auto_select_after_rotate: false,

		// How many times (in a row) should we automatically retry a photo?
		//   This is PER PHOTO and will be reset after each successful upload
		auto_retry_count: 3,

		//
		// Not advised to change below here
		//

		// Upload mode
		//   Must be 'sync' or 'async'
		//   'sync' will not send the user to the after-upload page correctly
		mode: 'async',

		// Scrollbar width (pixels)
		scrollbar_width: 14,

	}
};
