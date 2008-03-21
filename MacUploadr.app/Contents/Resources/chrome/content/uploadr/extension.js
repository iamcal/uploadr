/*
 * Flickr Uploadr
 *
 * Copyright (c) 2007-2008 Yahoo! Inc.  All rights reserved.  This library is
 * free software; you can redistribute it and/or modify it under the terms of
 * the GNU General Public License (GPL), version 2 only.  This library is
 * distributed WITHOUT ANY WARRANTY, whether express or implied. See the GNU
 * GPL for more details (http://www.gnu.org/licenses/gpl.html)
 */

// Centralized API for extensions to add event handlers
var extension = {

	// Dispatch a job to a background thread
	//   The parameter must implement nsIRunnable
	background: function(runnable) {
		threads.worker.dispatch(runnable, threads.worker.DISPATCH_NORMAL);
	},

	// Event handlers
	//   Please don't call these on your own.  Instead, check out the
	//   helloworld extension on http://code.flickr.com/ and play along.
	Handler: function() {
		this.list = [];
		this.add = function() { return extension._add.apply(this, arguments); };
		this.remove = function() { extension._remove.apply(this, arguments); };
		this.exec = function() { extension._exec.apply(this, arguments); };
	},
	_add: function(fn) {
		var id = this.list.length;
		this.list.push(fn);
		return id;
	},
	_remove: function(id) {
		if (this.list.length > id) { this.list[id] = null; }
	},
	_exec: function() {
		var ii = this.list.length;
		for (var i = 0; i < ii; ++i) {
			var fn = this.list[i];
			if ('function' == typeof fn) { fn.apply(null, arguments); }
		}
	}

};

// Create the event handlers
extension.after_login = new extension.Handler();
extension.after_add = new extension.Handler();
extension.after_thumb = new extension.Handler();
extension.before_remove = new extension.Handler();
extension.after_select = new extension.Handler();
extension.after_edit = new extension.Handler();
extension.after_reorder = new extension.Handler();
extension.before_upload = new extension.Handler();
extension.before_one_upload = new extension.Handler();
extension.after_one_upload = new extension.Handler();
extension.on_upload_progress = new extension.Handler();
extension.after_upload = new extension.Handler();