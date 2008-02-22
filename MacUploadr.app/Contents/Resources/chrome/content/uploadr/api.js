/*
 * Flickr Uploadr
 *
 * Copyright (c) 2007-2008 Yahoo! Inc.  All rights reserved.  This library is
 * free software; you can redistribute it and/or modify it under the terms of
 * the GNU General Public License (GPL), version 2 only.  This library is
 * distributed WITHOUT ANY WARRANTY, whether express or implied. See the GNU
 * GPL for more details (http://www.gnu.org/licenses/gpl.html)
 */

// A note about the authentication API:
//   Because authentication is rather involved, involving a bunch of API calls in sequence,
//   authentication should be kicked off using users.login() in users.js.  The login sequence
//   here is chained together in such a way that after users.login()'s callback returns, the
//   users object is setup and ready for use.

// The API key and secret are defined in flKey.cpp and included here
var key;
try {
	key = Cc['@flickr.com/key;1'].createInstance(Ci.flIKey);
} catch (err) {
	Components.utils.reportError(err);
}

// The standard API
var flickr = {

	// Authentication - again, don't use this directly, use users.login()
	auth: {

		checkToken: function(token) {
			api.start({
				'method': 'flickr.auth.checkToken',
				'auth_token': token
			});
		},
		_checkToken: function(rsp) {
			if ('object' != typeof rsp || 'ok' != rsp.getAttribute('stat')) {
				users.logout(false);
			} else {
				users.token = rsp.getElementsByTagName('token')[0].firstChild.nodeValue;
				var user = rsp.getElementsByTagName('user')[0];
				users.nsid = user.getAttribute('nsid');
				users.username = user.getAttribute('username');

				// Complete the login process
				users._login();

			}
			buttons.login.enable();
		},

		getFrob: function(fresh) {
			api.start({
				'method': 'flickr.auth.getFrob'
			}, null, null, null, fresh);
		},
		_getFrob: function(rsp, fresh) {
			if ('object' != typeof rsp || 'ok' != rsp.getAttribute('stat')) {

				// Explain what's going on
				alert(locale.getString('auth.error.text'),
					locale.getString('auth.error.title'));

				users.logout(false);
			} else {
				users.frob = rsp.getElementsByTagName('frob')[0].firstChild.nodeValue;
				if (!confirm(locale.getString('auth.prompt.text'),
					locale.getString('auth.prompt.title'),
					locale.getString('auth.prompt.ok'),
					locale.getString('auth.prompt.cancel'))) {
					buttons.login.enable();
					return;
				}
				var url = api.start({
					'perms': 'write',
					'frob': users.frob,
//				}, 'http://api.flickr.com/services/auth/' + (fresh ? 'fresh/' : ''), true);
				}, 'http://api.dev.flickr.com/services/auth/' + (fresh ? 'fresh/' : ''), true);
				document.getElementById('auth_url').value = url;
				pages.go('auth');
			}
			buttons.login.enable();
		},

		getToken: function(frob) {
			if (frob) {
				api.start({
					'method': 'flickr.auth.getToken',
					'frob': frob
				});
			}
		},
		_getToken: function(rsp) {
			if ('object' != typeof rsp || 'ok' != rsp.getAttribute('stat')) {
				users.logout(false);
			} else {
				users.token = rsp.getElementsByTagName('token')[0].firstChild.nodeValue;
				var user = rsp.getElementsByTagName('user')[0];
				users.nsid = user.getAttribute('nsid');
				users.username = user.getAttribute('username');

				// Complete the login process
				users._login();

			}
		}

	},

	// Like the auth section, this is used by users.login() and won't need to be called
	people: {

		// Sets up the photostream header
		getInfo: function(user_id) {
			api.start({
				'method': 'flickr.people.getInfo',
				'auth_token': users.token,
				'user_id': user_id
			}, null, null, null, user_id);
		},
		_getInfo: function(rsp, id) {
			if ('object' == typeof rsp && 'ok' == rsp.getAttribute('stat')) {
				var p = rsp.getElementsByTagName('person')[0];
				var s = p.getAttribute('iconserver');
				if (0 != parseInt(s)) {
					document.getElementById('buddyicon').src =
						'http://farm' + p.getAttribute('iconfarm') + '.static.flickr.com/' +
						s + '/buddyicons/' + id + '.jpg';
				} else {
					document.getElementById('buddyicon').src =
						'http://flickr.com/images/buddyicon.jpg';
				}
				if (1 == parseInt(p.getAttribute('ispro'))) {
					document.getElementById('photostream_pro').style.display = 'inline';
				} else {
					document.getElementById('photostream_pro').style.display = 'none';
				}
			}
		},

		getUploadStatus: function() {
			api.start({
				'method': 'flickr.people.getUploadStatus',
				'auth_token': users.token
			});
		},
		_getUploadStatus: function(rsp) {
			if ('object' != typeof rsp || 'ok' != rsp.getAttribute('stat')) {

				// This can cause infinite looping, so stoppit
				//flickr.people.getUploadStatus();

			} else {
				var user = rsp.getElementsByTagName('user')[0];
				users.is_pro = 1 == parseInt(user.getAttribute('ispro'));
				var bw = user.getElementsByTagName('bandwidth')[0];
				if (1 == parseInt(bw.getAttribute('unlimited'))) {
					users.bandwidth = null;
				} else {
					users.bandwidth = {
						total: parseInt(bw.getAttribute('maxkb')),
						used: parseInt(bw.getAttribute('usedkb')),
						remaining: parseInt(bw.getAttribute('remainingkb'))
					};
				}
				users.filesize = parseInt(user.getElementsByTagName(
					'filesize')[0].getAttribute('maxkb'));
				sets = user.getElementsByTagName('sets')[0].getAttribute('remaining');
				if ('lots' == sets) {
					users.sets = -1;
				} else {
					users.sets = parseInt(sets);
				}
				ui.users_updated();
				users.update();
			}
		}

	},

	photos: {

		upload: {

			checkTickets: function(tickets) {
				block_exit();
				api.start({
					'method': 'flickr.photos.upload.checkTickets',
					'auth_token': users.token,
					'tickets': tickets.join(',')
				});
			},
			_checkTickets: function(rsp) {
				var again = false;
				if ('object' == typeof rsp && 'ok' == rsp.getAttribute('stat')) {
					upload.tickets_retry = 0;
					var tickets = rsp.getElementsByTagName('uploader')[0].getElementsByTagName(
						'ticket');
					var ii = tickets.length;
					for (var i = 0; i < ii; ++i) {
						var ticket_id = tickets[i].getAttribute('id');
						var complete = parseInt(tickets[i].getAttribute('complete'));
						if ('undefined' != typeof upload.tickets[ticket_id]) {

							// Error'd photo
							if (2 == complete) {
								--upload.tickets_count;
								upload._sync(false, upload.tickets[ticket_id]);
								delete upload.tickets[ticket_id];
							}

							// Completed photo
							else if (1 == complete) {
								--upload.tickets_count;

								// Check this photo against stored timestamps
								var imported = parseInt(tickets[i].getAttribute('imported'));
								if (0 == upload.timestamps.earliest ||
									imported < upload.timestamps.earliest) {
									upload.timestamps.earliest = imported;
								}
								if (0 == upload.timestamps.latest ||
									imported > upload.timestamps.latest) {
									upload.timestamps.latest = imported;
								}

								upload._sync(parseInt(tickets[i].getAttribute('photoid')),
									upload.tickets[ticket_id]);
								delete upload.tickets[ticket_id];
							}

							// Incomplete photos need to keep spinning
							else {
								again = true;
							}

						}
					}
				}

				// Error'd checkTickets need to keep spinning
				else {
					again = true;
				}

				if (again) {

					// Valid response or still have retries remaining
					if ('object' == typeof rsp) {
						upload._check_tickets();
					} else if (conf.tickets_retry_count > upload.tickets_retry_count) {
						++upload.tickets_retry_count;
						upload._check_tickets();
					}

					// Need to call it quits
					else {
						upload.cancel = true;
						upload.tickets_count = 0;
						upload.tickets = {};
						upload.done();
					}

				}
				unblock_exit();
			}

		}

	},

	photosets: {

		addPhoto: function(photoset_id, photo_id){
			block_exit();
			api.start({
				'method': 'flickr.photosets.addPhoto',
				'auth_token': users.token,
				'photoset_id': photoset_id,
				'photo_id': photo_id
			}, null, null, true, photoset_id);
		},
		_addPhoto: function(rsp, id) {
			if ('object' != typeof rsp || 'ok' != rsp.getAttribute('stat')) {
				photos.sets = false;
			}
			meta.sets_map[id].shift();
			if (0 != meta.sets_map[id].length) {
				flickr.photosets.addPhoto(id, meta.sets_map[id][0]);
			} else {
				upload.finalize();
			}
			unblock_exit();
		},

		create: function(title, description, primary_photo_id) {
			block_exit();
			api.start({
				'method': 'flickr.photosets.create',
				'auth_token': users.token,
				'title': title,
				'description': description,
				'primary_photo_id': primary_photo_id
			}, null, null, true, title);
		},
		_create: function(rsp, id) {
			meta.sets_map[id].shift();
			if ('object' != typeof rsp || 'ok' != rsp.getAttribute('stat')) {
				photos.sets = false;
				meta.sets_map[id] = [];
				upload.finalize();
			} else {

				// Update the map with this new set ID
				var list = meta.sets_map[id];
				var set_id = rsp.getElementsByTagName('photoset')[0].getAttribute('id');
				meta.sets_map[set_id] = list;
				delete meta.sets_map[id];

				// Remove this from the list of sets to be created
				var index = meta.created_sets.indexOf(id);
				meta.created_sets[index] = null;
				meta.created_sets_desc[index] = null;

				// Update remaining photos in case we fail
				var ii = photos.failed.length;
				for (var i = 0; i < ii; ++i) {
					var index = photos.failed[i].sets.indexOf(id);
					if (-1 != index) {
						photos.failed[i].sets[index] = set_id;
					}
				}
				var ii = photos.uploading.length;
				for (var i = 0; i < ii; ++i) {
					if (null != photos.uploading[i]) {
						var index = photos.uploading[i].sets.indexOf(id);
						if (-1 != index) {
							photos.uploading[i].sets[index] = set_id;
						}
					}
				}

				if (0 != meta.sets_map[set_id].length) {
					flickr.photosets.addPhoto(set_id, meta.sets_map[set_id][0]);
				} else {
					upload.finalize();
				}
			}
			unblock_exit();
		},

		getList: function(user_id) {
			api.start({
				'method': 'flickr.photosets.getList',
				'auth_token': users.token
			});
		},
		_getList: function(rsp) {
			if ('object' == typeof rsp && 'ok' == rsp.getAttribute('stat')) {
				meta.sets = {};
				var sets = rsp.getElementsByTagName('photosets')[0].getElementsByTagName('photoset');
				var ii = sets.length;
				var order = [];
				for (var i = 0; i < ii; ++i) {
					order.push([sets[i].getAttribute('id'),
						sets[i].getElementsByTagName('title')[0].firstChild.nodeValue]);
				}
				order.sort(function(a, b) {
					return a[1].toLowerCase() > b[1].toLowerCase();
				});
				for each (var name in meta.created_sets) {
					meta.sets[name] = name;
				}
				for (var i = 0; i < ii; ++i) {
					meta.sets[order[i][0]] = order[i][1];
				}
				var prefixes = ['single', 'batch'];
				for each (var prefix in prefixes) {
					var ul = document.getElementById(prefix + '_sets_add');
					while (ul.hasChildNodes()) {
						ul.removeChild(ul.firstChild);
					}
					if (0 == ii && 0 == meta.created_sets.length) {
						var li = document.createElementNS(NS_HTML, 'li');
						li.className = 'sets_none';
						li.appendChild(document.createTextNode(
							locale.getString('meta.sets.add.none')));
						ul.appendChild(li);
					} else {
						for (var set_id in meta.sets) {
							var li = document.createElementNS(NS_HTML, 'li');
							li.id = prefix + '_sets_add_' + set_id;
							li.className = 'sets_plus';
							li.appendChild(document.createTextNode(meta.sets[set_id]));
							ul.appendChild(li);
						}
					}
				}

				// Update a single selected photo
				if (1 == photos.selected.length) {
					var ul = document.getElementById('single_sets_added');
					var p = photos.list[photos.selected[0]];
					var ii = p.sets.length;
					if (0 != ii) {
						while (ul.hasChildNodes()) {
							ul.removeChild(ul.firstChild);
						}
						for (var i = 0; i < ii; ++i) {
							var li = document.createElementNS(NS_HTML, 'li');
							li.id = 'single_sets_' + p.sets[i];
							li.className = 'sets_trash';
							li.appendChild(document.createTextNode(meta.sets[p.sets[i]]));
							ul.appendChild(li);
						}
					}
				}

			}
			status.clear();
		}

	},

	// Preferences are fetched from the site when no stored version can be found
	prefs: {

		getContentType: function() {
			api.start({
				'method': 'flickr.prefs.getContentType',
				'auth_token': users.token
			});
		},
		_getContentType: function(rsp) {
			if ('object' == typeof rsp && 'ok' == rsp.getAttribute('stat')) {
				settings.content_type =
					parseInt(rsp.getElementsByTagName('person')[0].getAttribute('content_type'));
				settings.save();
				meta.defaults({content_type: settings.content_type});
			}
		},

		getHidden: function() {
			api.start({
				'method': 'flickr.prefs.getHidden',
				'auth_token': users.token
			});
		},
		_getHidden: function(rsp) {
			if ('object' == typeof rsp && 'ok' == rsp.getAttribute('stat')) {
				settings.hidden =
					parseInt(rsp.getElementsByTagName('person')[0].getAttribute('hidden'));
				settings.save();
				meta.defaults({hidden: settings.hidden});
			}
		},

		getPrivacy: function() {
			api.start({
				'method': 'flickr.prefs.getPrivacy',
				'auth_token': users.token
			});
		},
		_getPrivacy: function(rsp) {
			if ('object' == typeof rsp && 'ok' == rsp.getAttribute('stat')) {
				var privacy =
					parseInt(rsp.getElementsByTagName('person')[0].getAttribute('privacy'));
				settings.is_public = 1 == privacy ? 1 : 0;
				settings.is_friend = 2 == privacy || 4 == privacy ? 1 : 0;
				settings.is_family = 3 == privacy || 4 == privacy ? 1 : 0;
				settings.save();
				meta.defaults({
					is_public: settings.is_public,
					is_friend: settings.is_friend,
					is_family: settings.is_family
				});
			}
		},

		getSafetyLevel: function() {
			api.start({
				'method': 'flickr.prefs.getSafetyLevel',
				'auth_token': users.token
			});
		},
		_getSafetyLevel: function(rsp) {
			if ('object' == typeof rsp && 'ok' == rsp.getAttribute('stat')) {
				settings.safety_level =
					parseInt(rsp.getElementsByTagName('person')[0].getAttribute('safety_level'));
				settings.save();
				meta.defaults({safety_level: settings.safety_level});
			}
		}

	},

	utils: {

		logUploadStats: function(source, num_photos, upload_time, bytes, errors) {
			api.start({
				'method': 'flickr.utils.logUploadStats',
				'auth_token': users.token,
				'source': source,
				'photos': num_photos,
				'upload_time': upload_time,
				'bytes': bytes,
				'errors': errors
			});
		},
		_logUploadStats: function(rsp) {
			// Who cares!
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
			calc.push(sig[i] + (post ? esc_params[sig[i]] : escape_utf8('' + params[sig[i]], false)));
		}
		esc_params['api_sig'] = key.sign(calc.join(''));
		return esc_params;
	},

	// The guts of the API object - this actually makes the XHR calls and finds the callback
	//   Callbacks are named exactly like the API method but with an _ in front of the last
	//   part of the method name (for example flickr.foo.bar calls back to flickr.foo._bar)
	start: function(params, url, browser, post, id) {
		if (conf.console.request) {
			Cc['@mozilla.org/consoleservice;1']
				.getService(Ci.nsIConsoleService)
				.logStringMessage('API REQUEST: ' + params.toSource());
		}
		if (null == url) {
//			url = 'http://api.flickr.com/services/rest/';
			url = 'http://api.dev.flickr.com/services/rest/';
		}
		if (null == browser) {
			browser = false;
		}
		if (null == post) {
			post = false;
		}
		if (null == id) {
			id = -1;
		}

		// Escape params and sign the call
		params = api.escape_and_sign(params, post);

		// Build either a POST payload or a GET URL
		//   There is an assumption here that no one will be sending a file over GET
		var mstream = '';
		var boundary = '------deadbeef---deadbeef---' + Math.random();
		if (post) {
			mstream = Cc['@mozilla.org/io/multiplex-input-stream;1'].createInstance(
				Ci.nsIMultiplexInputStream);
			var sstream;
			for (var p in params) {
				sstream = Cc['@mozilla.org/io/string-input-stream;1'].createInstance(
					Ci.nsIStringInputStream);
				sstream.setData('--' + boundary + '\r\nContent-Disposition: form-data; name="' +
					p + '"', -1);
				mstream.appendStream(sstream);
				if ('object' == typeof params[p] && null != params[p]) {
					sstream = Cc['@mozilla.org/io/string-input-stream;1'].createInstance(
						Ci.nsIStringInputStream);
					sstream.setData('; filename="' + params[p].filename +
						'"\r\nContent-Type: application/octet-stream\r\n\r\n', -1);
					mstream.appendStream(sstream);
					var file = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsILocalFile);
					file.initWithPath(params[p].path);
					var fstream = Cc['@mozilla.org/network/file-input-stream;1'].createInstance(
						Ci.nsIFileInputStream);
					fstream.init(file, 1, 1, Ci.nsIFileInputStream.CLOSE_ON_EOF);
					var bstream = Cc['@mozilla.org/network/buffered-input-stream;1'].createInstance(
						Ci.nsIBufferedInputStream);
					bstream.init(fstream, 4096);
					mstream.appendStream(bstream);
					sstream = Cc['@mozilla.org/io/string-input-stream;1'].createInstance(
						Ci.nsIStringInputStream);
					sstream.setData('\r\n', -1);
					mstream.appendStream(sstream);
				} else {
					sstream = Cc['@mozilla.org/io/string-input-stream;1'].createInstance(
						Ci.nsIStringInputStream);
					sstream.setData('\r\n\r\n' + params[p] + '\r\n', -1);
					mstream.appendStream(sstream);
				}
			}
			sstream = Cc['@mozilla.org/io/string-input-stream;1'].createInstance(
				Ci.nsIStringInputStream);
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

			// Build up the callback
			//   For the method foo.bar.baz this will call foo.bar._baz with the response
			var callback;
			if (params.method) {
				var index = 1 + params.method.lastIndexOf('.');
				callback = params.method.substring(0, index) + '_' +
					params.method.substring(index, params.method.length) + '(rsp';
				if (-1 != id) {
					callback += ', id';
				}
				callback += ');';
			}

			// Callback
			var xhr = new XMLHttpRequest();
			xhr.onreadystatechange = function() {
				if (4 == xhr.readyState && 200 == xhr.status && xhr.responseXML) {
					try {
						var rsp = xhr.responseXML.documentElement;
						if (conf.console.error && (
							'object' != typeof rsp || 'ok' != rsp.getAttribute('stat'))) {
							Components.utils.reportError('API ERROR: ' + xhr.responseText);
						} else if (conf.console.response) {
							Cc['@mozilla.org/consoleservice;1']
								.getService(Ci.nsIConsoleService)
								.logStringMessage('API RESPONSE: ' + xhr.responseText);
						}

						// If this is a normal method call
						if (params.method) {

							// It returned normally, don't timeout
							window.clearTimeout(api.timeouts[params['api_sig']]);
							delete api.timeouts[params['api_sig']];

							eval(callback);
						}

						// If this is an upload
						else {
							upload._start(rsp, id);
						}

					} catch (err) {
						Components.utils.reportError(err);
					}
				}
			};

			// Send the request
			xhr.open(post ? 'POST' : 'GET', url, true);
			if (post) {
				xhr.setRequestHeader('Content-Type', 'multipart/form-data; boundary=' +
					boundary);
			} else {
				xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
			}
			xhr.send(mstream);

			// Setup upload progress indicator
			if (post && -1 != id && !params.method) {
				upload.progress_handle = window.setInterval(function() {
					upload.progress(mstream, id);
				}, conf.check);
			}

			// Setup timeout guard on everything else
			else if (params.method) {
				api.timeouts[params['api_sig']] = window.setTimeout(function() {
					if (conf.console.timeout) {
						Components.utils.reportError('API TIMEOUT: ' + callback);
					}
					var rsp = false;
					eval(callback);
				}, conf.timeout);
			}

		}

	},

	//

};

// Used when preparing the params and the signature
//   The URL parameter controls whether data is escaped for inclusion in a URL or not
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
					buffer.push('%' + chars.charAt((b & 0xf0) >>> 4) + chars.charAt(b & 0x0f));
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