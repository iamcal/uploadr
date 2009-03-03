/*
 * Flickr Uploadr
 *
 * Copyright (c) 2007-2009 Yahoo! Inc.  All rights reserved.  This library is
 * free software; you can redistribute it and/or modify it under the terms of
 * the GNU General Public License (GPL), version 2 only.  This library is
 * distributed WITHOUT ANY WARRANTY, whether express or implied. See the GNU
 * GPL for more details (http://www.gnu.org/licenses/gpl.html)
 */

// The API key and secret are defined in flKey.cpp and included here
try {
	var key = Cc['@flickr.com/key;1'].createInstance(Ci.flIKey);
} catch (err) {
	Components.utils.reportError(new Date().toUTCString() +err);
}

function toOpenWindowByType(inType, uri) {
  var winopts = "chrome,extrachrome,menubar,resizable,scrollbars,status,toolbar";
  window.open(uri, "_blank", winopts);
}

// The standard API
var flickr = {

	auth: {

		checkToken: function(callback, token) {
			api.start({
				'method': 'flickr.auth.checkToken',
				'auth_token': token
			}, callback);
		},

		getFrob: function(callback, fresh) {
			api.start({
				'method': 'flickr.auth.getFrob'
			}, callback, null, null, null, fresh);
		},

		getToken: function(callback, frob) {
			if (frob) {
				api.start({
					'method': 'flickr.auth.getToken',
					'frob': frob
				}, callback);
			}
		}

	},

	people: {

		getInfo: function(callback, token, nsid) {
			api.start({
				'method': 'flickr.people.getInfo',
				'auth_token': token,
				'user_id': nsid
			}, callback, null, null, null, nsid);
		},

		getUploadStatus: function(callback, token) {
			api.start({
				'method': 'flickr.people.getUploadStatus',
				'auth_token': token
			}, callback);
		}

	},

	photos: {

		upload: {

			checkTickets: function(callback, token, tickets) {
				api.start({
					'method': 'flickr.photos.upload.checkTickets',
					'auth_token': token,
					'tickets': tickets.join(',')
				}, callback);
			}

		}

	},

	photosets: {

		addPhoto: function(callback, token, photoset_id, photo_id){
			api.start({
				'method': 'flickr.photosets.addPhoto',
				'auth_token': token,
				'photoset_id': photoset_id,
				'photo_id': photo_id
			}, callback, null, null, true);
		},

		create: function(callback, token, title, description,
			primary_photo_id) {
			api.start({
				'method': 'flickr.photosets.create',
				'auth_token': token,
				'title': title,
				'description': description,
				'primary_photo_id': primary_photo_id
			}, callback, null, null, true);
		},

		getList: function(callback, token, nsid) {
			api.start({
				'method': 'flickr.photosets.getList',
				'auth_token': token,
				'user_id': nsid
			}, callback);
		}

	},

	// Preferences are fetched from the site when no stored version can be found
	prefs: {

		getContentType: function(callback, token) {
			api.start({
				'method': 'flickr.prefs.getContentType',
				'auth_token': token
			}, callback);
		},

		getHidden: function(callback, token) {
			api.start({
				'method': 'flickr.prefs.getHidden',
				'auth_token': token
			}, callback);
		},

		getPrivacy: function(callback, token) {
			api.start({
				'method': 'flickr.prefs.getPrivacy',
				'auth_token': token
			}, callback);
		},

		getSafetyLevel: function(callback, token) {
			api.start({
				'method': 'flickr.prefs.getSafetyLevel',
				'auth_token': token
			}, callback);
		}

	},

	utils: {

		logUploadStats: function(callback, token, source, num_photos,
			upload_time, bytes, errors) {
			api.start({
				'method': 'flickr.utils.logUploadStats',
				'auth_token': token,
				'source': source,
				'photos': num_photos,
				'upload_time': upload_time,
				'bytes': bytes,
				'errors': errors
			}, callback, null, null, true);
		}

	}

};

var api = {

	// Hashes of timeouts and XHRs being used to track running API calls
	timeouts: {},

	// Escape and sign a set of parameters, returning the new version
	escape_and_sign: function(params, post) {
		params['api_key'] = key.key();
		var sig = [];
		var esc_params = {api_key: '', api_sig: ''};
		for (var p in params) {
			if ('object' == typeof params[p]) {
				esc_params[p] = params[p];
			} else {
				sig.push(p);
				esc_params[p] = escape_utf8('' + params[p], !post)
					.replace(/(^\s+|\s+$)/g, '');
			}
		}
		sig.sort();
		var calc = [];
		var ii = sig.length;
		for (var i = 0; i < ii; ++i) {
			calc.push(sig[i] + (post ? esc_params[sig[i]] : escape_utf8('' +
				params[sig[i]], false)));
		}
		esc_params['api_sig'] = key.sign(calc.join(''));
		return esc_params;
	},

	// The guts of the API object - this actually makes the XHR calls and
	// calls back
	start: function(params, callback, url, browser, post, id) {
		if (null == url) {
			url = 'http://' + REST_HOST + '/services/rest/';
		}
		if (null == browser) { browser = false; }
		if (null == post) { post = false; }
		if (conf.console.request) {
		    logStringMessage('API REQUEST: ' + params.toSource() +
				', ' + url);
		}

		// Escape params and sign the call
		params = api.escape_and_sign(params, post);

		// Build either a POST payload or a GET URL
		//   There is an assumption here that no one will be sending a
		//   file over GET
		var mstream = '';
		var boundary = '------deadbeef---deadbeef---' + Math.random();
		if (post) {
			mstream = Cc['@mozilla.org/io/multiplex-input-stream;1']
				.createInstance(Ci.nsIMultiplexInputStream);
			var sstream;
			for (var p in params) {
				sstream = Cc['@mozilla.org/io/string-input-stream;1']
					.createInstance(Ci.nsIStringInputStream);
				sstream.setData('--' + boundary +
					'\r\nContent-Disposition: form-data; name="' +
					p + '"', -1);
				mstream.appendStream(sstream);
				if ('object' == typeof params[p] && null != params[p]) {
					sstream = Cc['@mozilla.org/io/string-input-stream;1']
						.createInstance(Ci.nsIStringInputStream);
					sstream.setData('; filename="' + params[p].filename +
						'"\r\nContent-Type: application/octet-stream\r\n\r\n',
						-1);
					mstream.appendStream(sstream);
					var file = Cc['@mozilla.org/file/local;1']
						.createInstance(Ci.nsILocalFile);
					file.initWithPath(params[p].path);
					var fstream =
						Cc['@mozilla.org/network/file-input-stream;1']
						.createInstance(Ci.nsIFileInputStream);
					fstream.init(file, 1, 1,
						Ci.nsIFileInputStream.CLOSE_ON_EOF);
					var bstream =
						Cc['@mozilla.org/network/buffered-input-stream;1']
						.createInstance(Ci.nsIBufferedInputStream);
					bstream.init(fstream, 4096);
					mstream.appendStream(bstream);
					sstream = Cc['@mozilla.org/io/string-input-stream;1']
						.createInstance(Ci.nsIStringInputStream);
					sstream.setData('\r\n', -1);
					mstream.appendStream(sstream);
				} else {
					sstream = Cc['@mozilla.org/io/string-input-stream;1']
						.createInstance(Ci.nsIStringInputStream);
					sstream.setData('\r\n\r\n' + params[p] + '\r\n', -1);
					mstream.appendStream(sstream);
				}
			}
			sstream = Cc['@mozilla.org/io/string-input-stream;1']
				.createInstance(Ci.nsIStringInputStream);
			sstream.setData('--' + boundary + '--', -1);
			mstream.appendStream(sstream);
			upload.progress_total = mstream.available() >> 10;
		} else {
			var args = [];
			for (var p in params) {
				args.push(p + '=' + params[p]);
			}
			url += '?' + args.join('&');
		}

		// Open a browser
		//   Only GET requests are supported here
		if (browser) {
			return launch_browser(url);
		}

		// Use XHR
		//   GET and POST are supported here
		else {

			// Callback
			var xhr = new XMLHttpRequest();
			xhr.onreadystatechange = function() {
			    if (4 == xhr.readyState && 200 != xhr.status) {
			        if (conf.console.error){
                        Components.utils.reportError(new Date().toUTCString() +'STATUS: ' + xhr.status +
			                ', responseText: ' + xhr.responseText + 
			                ', calling: ' + params.toSource());
                    }
			    }
				if (4 == xhr.readyState && 200 == xhr.status) {
					try {
						var rsp = xhr.responseXML ? xhr.responseXML.documentElement : upload.genErr();
						if (conf.console.error && (
							'object' != typeof rsp
							|| 'ok' != rsp.getAttribute('stat'))) {
							Components.utils.reportError(new Date().toUTCString() +'API ERROR: ' +
								xhr.responseText);
						} else if (conf.console.response) {
							logStringMessage('API RESPONSE: ' +
								xhr.responseText);
						}

						// If this is a normal method call
						if (params.method) {

							// It returned normally, don't timeout
							window.clearTimeout(
								api.timeouts[params['api_sig']]);
							delete api.timeouts[params['api_sig']];

							if ('function' == typeof callback) {
								if (id) { callback(rsp, id); }
								else { callback(rsp); }
							}
						}

						// If this is an upload
						else {
							upload._start(rsp, id);
						}

					} catch (err) {
						Components.utils.reportError(new Date().toUTCString() + err + (params.method ? (" calling back from " + params.method) : ""));
					}
				}
			};

			// Send the request
			xhr.open(post ? 'POST' : 'GET', url, true);
			xhr.onerror = function() {
			    if (conf.console.error){
			        Components.utils.reportError(new Date().toUTCString() +' Error calling: ' + params.toSource());
			    }
			    xhr.abort();
			};
			if (post) {
				xhr.setRequestHeader('Content-Type',
					'multipart/form-data; boundary=' + boundary);
			} else {
				xhr.setRequestHeader('Content-Type',
					'application/x-www-form-urlencoded');
			}
			xhr.send(mstream);

			// Setup upload progress indicator
			if (post && id && !params.method) {
				upload.progress_handle = window.setInterval(function() {
					upload.progress(mstream, id);
				}, conf.check);
			}

			// Setup timeout guard on everything else
			else if (params.method) {
				api.timeouts[params['api_sig']] = window.setTimeout(
				function() {
				    //we decide to timeout to try again later. Abort this otherwise, we'll hit the browser limitation of # of open requests
				    xhr.abort();
				    delete xhr;
					if (conf.console.timeout) {
						Components.utils.reportError(new Date().toUTCString() +'API TIMEOUT: ' +
							params.toSource());
					}
					if ('function' == typeof callback) {
						if (id) { callback(false, id); }
						else {callback('undefined' === typeof rsp ? false : rsp); }
					}
				}, conf.timeout);
			}

		}

	}

};

// Used when preparing the params and the signature
//   The URL parameter controls whether data is escaped for inclusion
//   in a URL or not
var escape_utf8 = function(data, url) {
	if (null == url) {
		url = true;
	}
	if ('' == data || null == data || undefined == data) {
		return '';
	}
	var chars = '0123456789abcdef';
	data = data.toString();
	var buffer = [];
	var ii = data.length;
	for (var i = 0; i < ii; ++i) {
		var c = data.charCodeAt(i);
		var bs = new Array();
		if (c > 0x10000) {
			bs[0] = 0xf0 | ((c & 0x1c0000) >>> 18);
			bs[1] = 0x80 | ((c & 0x3f000) >>> 12);
			bs[2] = 0x80 | ((c & 0xfc0) >>> 6);
			bs[3] = 0x80 | (c & 0x3f);
		} else if (c > 0x800) {
			bs[0] = 0xe0 | ((c & 0xf000) >>> 12);
			bs[1] = 0x80 | ((c & 0xfc0) >>> 6);
			bs[2] = 0x80 | (c & 0x3f);
		} else if (c > 0x80) {
			bs[0] = 0xc0 | ((c & 0x7c0) >>> 6);
			bs[1] = 0x80 | (c & 0x3f);
		} else {
			bs[0] = c;
		}
		var jj = bs.length
		if (1 < jj) {
			if (url) {
				for (var j = 0; j < jj; ++j) {
					var b = bs[j];
					buffer.push('%' + chars.charAt((b & 0xf0) >>> 4) +
						chars.charAt(b & 0x0f));
				}
			} else {
				for (var j = 0; j < jj; ++j) {
					buffer.push(String.fromCharCode(bs[j]));
				}
			}
		} else {
			if (url) {
				buffer.push(encodeURIComponent(String.fromCharCode(bs[0])));
			} else {
				buffer.push(String.fromCharCode(bs[0]));
			}
		}
	}
	return buffer.join('');
};