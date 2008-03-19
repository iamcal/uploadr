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

	after_login: {
		list: [],
		add: function(fn) {
			return extension._add('after_login', fn);
		},
		remove: function(id) {
			extension._remove('after_login', id);
		},
		exec: function(user) {
			extension._exec('after_login', [user]);
		}
	},

	after_add: {
		list: [],
		add: function(fn) {
			return extension._add('after_add', fn);
		},
		remove: function(id) {
			extension._remove('after_add', id);
		},
		exec: function(list) {
			extension._exec('after_add', [list]);
		}
	},

	before_upload: {
		list: [],
		add: function(fn) {
			return extension._add('before_upload', fn);
		},
		remove: function(id) {
			extension._remove('before_upload', id);
		},
		exec: function(list) {
			extension._exec('before_upload', [list]);
		}
	},

	after_upload: {
		list: [],
		add: function(fn) {
			return extension._add('after_upload', fn);
		},
		remove: function(id) {
			extension._remove('after_upload', id);
		},
		exec: function(ok, fail) {
			extension._exec('after_upload', [ok, fail]);
		}
	},

	// Don't call these on your own, use the nice hooks above
	_add: function(e, fn) {
		var id = extension[e].list.length;
		extension[e].list.push(fn);
		return id;
	},
	_remove: function(e, id) {
		if (extension[e].list.length > id) {
			extension[e].list[id] = null;
		}
	},
	_exec: function(e, args) {
		var ii = extension[e].list.length;
		for (var i = 0; i < ii; ++i) {
			var fn = extension[e].list[i];
			if ('function' == typeof fn) { fn.apply(null, args); }
		}
	}

};