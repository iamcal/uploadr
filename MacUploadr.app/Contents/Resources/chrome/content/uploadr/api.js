const api_key = '-----';
const secret = '-----';

const TIMEOUT = 60000; // Milliseconds

// A note about the authentication API:
//   Because authentication is rather involved, involving a bunch of API calls in sequence,
//   authentication should be kicked off using users.login() in users.js.  The login sequence
//   here is chained together in such a way that after users.login()'s callback returns, the
//   users object is setup and ready for use.

// Notes about the upload API:
//   Upload batches should be kicked off using photos.upload() in photos.js.  The setting
//   uploadr.conf.mode in uploadr.js can select either synchronous or asynchronous uploads.

// The upload API
var upload = {

	// Flag set if a batch is cancelled
	cancel: false,

	// Progress metering
	progress_handle: null,
	progress_last: 0,
	progress_total: -1,

	// Timeout watch
	timeout_handle: null,

	// Ticket tracking
	tickets: {},
	tickets_count: 0,
	tickets_delta: 1000, // Milliseconds
	tickets_handle: null,

	// Upload a photo
	start: function(id) {

		// Update the UI
		var meter = document.getElementById('progress_file');
		meter.value = 0;
		meter.mode = 'determined';
		document.getElementById('progress').style.visibility = 'visible';

		// Pass the photo to the API
		var photo = photos.uploading[id];
		_api({
			'async': 'async' == uploadr.conf.mode ? 1 : 0,
			'auth_token': users.token,
			'title': photo.title,
			'description': photo.description,
			'tags': photo.tags,
			'is_public': photo.is_public,
			'is_friend': photo.is_friend,
			'is_family': photo.is_family,
			'content_type': photo.content_type,
			'hidden': photo.hidden,
			'safety_level': photo.safety_level,
			'photo': {
				'filename': photo.filename,
				'path': photo.path
			}
		}, 'http://api.flickr.com/services/upload/', false, true, id);

	},
	_start: function(rsp, id) {
		upload['_' + uploadr.conf.mode](rsp, id);
	},

	// Finish an asynchronous upload
	_async: function(rsp, id) {

		// If no ticket came back, fail this photo
		if ('object' != typeof rsp || 'ok' != rsp.getAttribute('stat')) {
			++photos.fail;
			photos.failed.push(photos.uploading[id]);
			if (upload.bandwidth(rsp)) {
				return;
			}
		}

		// Otherwise, spin for a ticket
		else {
			upload.tickets[rsp.getElementsByTagName('ticketid')[0].firstChild.nodeValue] = id;
			++upload.tickets_count;
			if (null != upload.tickets_handle) {
				window.clearTimeout(upload.tickets_handle);
				upload.tickets_handle = null;
				upload.tickets_delta = 1000;
			}
			upload.check_tickets();
		}

		// Start the next one or quit if we're cancelling
		if (!upload.cancel) {
			++id;
			if (id < photos.uploading.length) {
				upload.start(id);
			}
		}

	},

	// Finish a synchronous upload
	_sync: function(rsp, id) {

		// Cancel the timeout
		window.clearTimeout(upload.timeout_handle);

		// How did the upload go?
		var photo_id;
		var stat;
		if ('object' == typeof rsp) {
			stat = rsp.getAttribute('stat');
		} else if ('number' == typeof rsp) {
			photo_id = rsp;
			stat = 'ok';
		} else {
			stat = 'fail';
		}
		if ('ok' == stat) {
			++photos.ok;
			if ('object' == typeof rsp) {
				photo_id = parseInt(rsp.getElementsByTagName('photoid')[0].firstChild.nodeValue);
			}
			photos.uploaded.push(photo_id);

			// Add to the map of sets to photos
			for each (var set_id in photos.uploading[id].sets) {
				if ('undefined' == typeof meta.sets_map[set_id]) {
					meta.sets_map[set_id] = [photo_id];
				} else {
					meta.sets_map[set_id].push(photo_id);
				}
			}
//			photos.add_to_set.push(photo_id);

		} else if ('fail' == stat) {
			++photos.fail;
			photos.failed.push(photos.uploading[id]);
			if (upload.bandwidth(rsp)) {
				return;
			}
		}

		// Add this photo to sets
		///
		photos.uploading[id] = null;

		// Update the UI
		document.getElementById('progress_overall').value =
			100 * (photos.ok + photos.fail) / photos.total;

		// For the last upload, we have some cleanup to do
		var done = true;
		for each (var p in photos.uploading) {
			done = done && null == p;
		}
		if (done || upload.cancel) {
			upload.done();
		}

		// But if this isn't last and we're doing synchronous, kick off the next upload
		else if ('sync' == uploadr.conf.mode) {
			var ii = photos.uploading.length;
			for (var i = id; i < ii; ++i) {
				if (null != photos.uploading[i]) {
					upload.start(i);
					break;
				}
			}
		}

	},

	// Track progress of an upload POST
	progress: function(stream, id) {

		// Get this bit of progress
		var a = stream.available();
		var bytes = upload.progress_total - a;
		var percent = Math.round(100 * bytes / upload.progress_total);
		if (0 > percent) {
			percent = 0;
		}

		// Have we made any progress?  If so, push the timeout event further into the future; if
		// not, call it explicitly now
		if (bytes > upload.progress_last) {
			window.clearTimeout(upload.timeout_handle);
			upload.timeout_handle = window.setTimeout(function() {
				upload.timeout(id);
			}, TIMEOUT);
		}
		upload.progress_last = bytes;

		// Update the UI
		var meter = document.getElementById('progress_file');
		meter.value = percent;

		// This is the end?
		if (0 == a) {
			meter.mode = 'undetermined';
			window.clearInterval(upload.progress_handle);
		}

	},

	// Timeout an upload after too much inactivity
	timeout: function(id) {
		window.clearInterval(upload.progress_handle);
		upload.cancel = true;
		upload._start(false, id);
	},

	// Check tickets exponentially
	check_tickets: function() {
		var tickets = [];
		for (var t in upload.tickets) {
			tickets.push(t);
		}
		if (0 != tickets.length) {
			flickr.photos.upload.checkTickets(tickets);
		}
	},
	_check_tickets: function() {
		if (60000 > upload.tickets_delta) {
			upload.tickets_delta *= 2;
		}
		if (0 < upload.tickets_count) {
			upload.tickets_handle = window.setTimeout(function() {
				upload.check_tickets();
			}, upload.tickets_delta);
		}
	},

	// Check a response for out-of-bandwidth error
	bandwidth: function(rsp) {
		if ('object' == typeof rsp &&
			6 == parseInt(rsp.getElementsByTagName('err')[0].getAttribute('code'))) {
			document.getElementById('progress').style.display = 'none';
			var f = photos.failed;
			var f_str = '||' + f.join('||') + '||';
			for each (var p in photos.uploading) {
				if (null != p && -1 == f_str.indexOf(p.path)) {
					f.push(p);
					f_str += p.path + '||';
				}
			}
			var ii = f.length;
			for (var i  = 0; i < ii; ++i) {
				photos._add(f[i].path);
				photos.list[photos.list.length - 1] = f[i];
			}
			photos.uploading = [];
			photos.uploaded = [];
			photos.add_to_set = [];
			photos.failed = [];
			photos.total = 0;
			photos.ok = 0;
			photos.fail = 0;
			unblock_exit();
			window.openDialog('chrome://uploadr/content/bandwidth.xul', 'dialog_bandwidth',
				'chrome,modal', events.bandwidth.switch_users, events.bandwidth.go_pro);
			return true;
		} else {
			return false;
		}
	},

	// Clean up after an upload finishes
	done: function() {

		// Kick off the chain of adding photos to a set
Components.utils.reportError(meta.sets_map.toSource());
		var not_adding_to_sets = true;
		for (var set_id in meta.sets_map) {
			status.set(locale.getString('status.sets'));
			not_adding_to_sets = false;
			if (-1 == meta.created_sets.indexOf(set_id)) {
				flickr.photosets.addPhoto(set_id, meta.sets_map[set_id].shift());
			} else {
				flickr.photosets.create(set_id, '', meta.sets_map[set_id].shift());
			}
		}

		// Here be dragons: If we are adding photos to a set, the last one will call this,
		// otherwise we have to here.  If it doesn't get called then limits and such will not
		// be updated for the next upload.
		if (not_adding_to_sets) {
			flickr.people.getUploadStatus();
		}

		// Update the UI
		photos.batch_size = 0;
		free.update();
		document.getElementById('progress').style.visibility = 'hidden';
		document.getElementById('progress_overall').value = 0;
		status.clear();

		// Alert the user of any failures and possibly re-add them to the batch
		if (0 < photos.fail && confirm(locale.getString('progress.failed'),
			locale.getString('progress.failed.title'))) {
			var f = photos.failed;
			var ii = f.length;
			for (var i  = 0; i < ii; ++i) {
				photos._add(f[i].path);
				photos.list[photos.list.length - 1] = f[i];
			}
		}

		// If this was a cancellation, add photos we didn't get to back to the batch
		if (upload.cancel) {
			for each (var p in photos.uploading) {
				if (null != p) {
					photos._add(p.path);;
					photos.list[photos.list.length - 1] = p;
				}
			}
		}

		// Offer to open the uploaded batch on the site
		if (0 < photos.ok && confirm(locale.getString('uploaded.prompt'),
			locale.getString('uploaded.prompt.title'))) {
			var io = Cc['@mozilla.org/network/io-service;1'].getService(Ci.nsIIOService);
			var uri = io.newURI('http://flickr.com/tools/uploader_edit.gne?ids=' +
				photos.uploaded.join(','), null, null);
			var eps = Cc['@mozilla.org/uriloader/external-protocol-service;1'].getService(
				Ci.nsIExternalProtocolService);
			var launcher = eps.getProtocolHandlerInfo('http');
			launcher.preferredAction = Ci.nsIHandlerInfo.useSystemDefault;
			launcher.launchWithURI(uri, null);
		}

		// Make sure the upload button is enabled if it should be
		//   The confirm() box above can prevent this from happening after sorting, so force it
		if (0 < photos.count) {
			buttons.enable('upload');
		}

		// Clear out the uploading batch
		photos.uploading = [];
		photos.uploaded = [];
		photos.add_to_set = [];
		photos.failed = [];
		photos.total = 0;
		photos.ok = 0;
		photos.fail = 0;

		upload.cancel = false;
		unblock_exit();
	}

};

// The standard API
var flickr = {

	// Authentication - again, don't use this directly, use users.login()
	auth: {

		checkToken: function(token) {
			block_exit();
			_api({
				'method': 'flickr.auth.checkToken',
				'auth_token': token
			});
		},
		_checkToken: function(rsp) {
			if ('object' != typeof rsp || 'ok' != rsp.getAttribute('stat')) {
				users.logout();
			} else {
				users.token = rsp.getElementsByTagName('token')[0].firstChild.nodeValue;
				var user = rsp.getElementsByTagName('user')[0];
				users.nsid = user.getAttribute('nsid');
				users.username = user.getAttribute('username');

				// Complete the login process
				users._login();

			}
			unblock_exit();
		},

		getFrob: function() {
			block_exit();
			_api({
				'method': 'flickr.auth.getFrob'
			});
		},
		_getFrob: function(rsp) {
			if ('object' != typeof rsp || 'ok' != rsp.getAttribute('stat')) {
				users.logout();
			} else {
				users.frob = rsp.getElementsByTagName('frob')[0].firstChild.nodeValue;
				if (!confirm(locale.getString('auth.prompt'),
					locale.getString('auth.prompt.title'))) {
					return;
				}
				_api({
					'perms': 'write',
					'frob': users.frob,
				}, 'http://api.flickr.com/services/auth/', true);
				alert(locale.getString('auth.confirm'), locale.getString('auth.confirm.title'));
				flickr.auth.getToken(users.frob);
			}
		},

		getToken: function(frob) {
			if (frob) {
				_api({
					'method': 'flickr.auth.getToken',
					'frob': frob
				});
			}
		},
		_getToken: function(rsp) {
			if ('object' != typeof rsp || 'ok' != rsp.getAttribute('stat')) {
				users.logout();
			} else {
				users.token = rsp.getElementsByTagName('token')[0].firstChild.nodeValue;
				var user = rsp.getElementsByTagName('user')[0];
				users.nsid = user.getAttribute('nsid');
				users.username = user.getAttribute('username');

				// Complete the login process
				users._login();

			}
			unblock_exit();
		}

	},

	// Like the auth section, this is used by users.login() and won't need to be called
	people: {

		getUploadStatus: function() {
			block_exit();
			_api({
				'method': 'flickr.people.getUploadStatus',
				'auth_token': users.token
			});
		},
		_getUploadStatus: function(rsp) {
			if ('object' != typeof rsp || 'ok' != rsp.getAttribute('stat')) {
				flickr.people.getUploadStatus();
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
				free.update();
				users.update();
			}
			unblock_exit();
		}

	},

	photos: {

		upload: {

			checkTickets: function(tickets) {
				block_exit();
				_api({
					'method': 'flickr.photos.upload.checkTickets',
					'tickets': tickets.join(',')
				});
			},
			_checkTickets: function(rsp) {
				if ('ok' == rsp.getAttribute('stat')) {
					var tickets = rsp.getElementsByTagName('uploader')[0].getElementsByTagName(
						'ticket');
					var ii = tickets.length;
					for (var i = 0; i < ii; ++i) {
						var ticket_id = tickets[i].getAttribute('id');
						var complete = parseInt(tickets[i].getAttribute('complete'));
						if ('undefined' != typeof upload.tickets[ticket_id]) {
							if (2 == complete) {
								upload._sync(false, upload.tickets[ticket_id]);
								delete upload.tickets[ticket_id];
								--upload.tickets_count;
							} else if (1 == complete) {
								upload._sync(parseInt(tickets[i].getAttribute('photoid')),
									upload.tickets[ticket_id]);
								delete upload.tickets[ticket_id];
								--upload.tickets_count;
							}
						}
					}
					upload._check_tickets();
				}
				unblock_exit();
			}

		}

	},

	photosets: {

		addPhoto: function(photoset_id, photo_id){
			block_exit();
			_api({
				'method': 'flickr.photosets.addPhoto',
				'auth_token': users.token,
				'photoset_id': photoset_id,
				'photo_id': photo_id
			}, null, null, true, photoset_id);
		},
		_addPhoto: function(rsp, id) {
			if ('ok' != rsp.getAttribute('stat')) {
				alert(locale.getString('errors.add_to_set'),
					locale.getString('errors.add_to_set.title'));
			} else {
				if (0 != meta.sets_map[id].length) {
					flickr.photosets.addPhoto(id, meta.sets_map[id].shift());
				} else {
					flickr.photosets.getList(users.nsid);
					flickr.people.getUploadStatus();
				}
			}
			unblock_exit();
		},

		create: function(title, description, primary_photo_id) {
			block_exit();
			_api({
				'method': 'flickr.photosets.create',
				'auth_token': users.token,
				'title': title,
				'description': description,
				'primary_photo_id': primary_photo_id
			}, null, null, true, title);
		},
		_create: function(rsp, id) {
			if ('ok' != rsp.getAttribute('stat')) {
				alert(locale.getString('errors.create_set'),
					locale.getString('errors.create_set.title'));
			} else {

				// Update the map with this new set ID
				var list = meta.sets_map[id];
				var set_id = rsp.getElementsByTagName('photoset')[0].getAttribute('id');
				meta.sets_map[set_id] = list;
				delete meta.sets_map[id];

				if (0 != meta.sets_map[set_id].length) {
					flickr.photosets.addPhoto(set_id, meta.sets_map[set_id].shift());
				} else {
					flickr.photosets.getList(users.nsid);
					flickr.people.getUploadStatus();
				}
			}
			unblock_exit();
		},

		getList: function(user_id) {
			block_exit();
			_api({
				'method': 'flickr.photosets.getList',
				'user_id': user_id,
			});
		},
		_getList: function(rsp) {
			if ('ok' == rsp.getAttribute('stat')) {
				var sets = rsp.getElementsByTagName('photosets')[0].getElementsByTagName('photoset');
				var ii = sets.length;
				for (var i = 0; i < ii; ++i) {
					meta.sets[sets[i].getAttribute('id')] =
						sets[i].getElementsByTagName('title')[0].firstChild.nodeValue;
				}
				var dropdowns = ['single_set', 'batch_set'];
				for each (var dropdown in dropdowns) {
					var d = document.getElementById(dropdown);
					d.removeAllItems();
					if (0 == ii) {
						d.appendItem(locale.getString('settings.set.none'), '', '');
						d.disabled = true;
					} else {
						d.appendItem(locale.getString('settings.set.dont'), '', '');
						for (var set_id in meta.sets) {
							d.appendItem(meta.sets[set_id], set_id, '');
						}
						d.disabled = false;
					}
					d.selectedIndex = 0;
				}

				// Update a single selected photo
				if (1 == photos.selected.length) {
					var ul = document.getElementById('single_set');
					while (ul.hasChildNodes()) {
						ul.removeChild(ul.firstChild);
					}
					var p = photos.list[photos.selected[0]];
					var ii = p.sets.length;
					for (var i = 0; i < ii; ++i) {
						meta.select_set(ul, meta.sets[p.sets[i]]);
					}
				}

			}
			status.clear();
			unblock_exit();
		}

	},

	// Preferences are fetched from the site when no stored version can be found
	//   It would be nice if these expanded to include default privacy settings
	prefs: {

		getContentType: function() {
			block_exit();
			_api({
				'method': 'flickr.prefs.getContentType',
				'auth_token': users.token
			});
		},
		_getContentType: function(rsp) {
			if ('ok' == rsp.getAttribute('stat')) {
				settings.content_type =
					parseInt(rsp.getElementsByTagName('person')[0].getAttribute('content_type'));
				settings.update();
			}
			unblock_exit();
		},

		getHidden: function() {
			block_exit();
			_api({
				'method': 'flickr.prefs.getHidden',
				'auth_token': users.token
			});
		},
		_getHidden: function(rsp) {
			if ('ok' == rsp.getAttribute('stat')) {
				settings.hidden =
					parseInt(rsp.getElementsByTagName('person')[0].getAttribute('hidden'));
				settings.update();
			}
			unblock_exit();
		},

		getPrivacy: function() {
			block_exit();
			_api({
				'method': 'flickr.prefs.getPrivacy',
				'auth_token': users.token
			});
		},
		_getPrivacy: function(rsp) {
			if ('ok' == rsp.getAttribute('stat')) {
				var privacy = parseInt(rsp.getElementsByTagName('person')[0].getAttribute('privacy'));
				settings.is_public = 1 == privacy;
				settings.is_friend = 2 == privacy || 4 == privacy;
				settings.is_family = 3 == privacy || 5 == privacy;
				settings.update();
			}
			unblock_exit();
		},

		getSafetyLevel: function() {
			block_exit();
			_api({
				'method': 'flickr.prefs.getSafetyLevel',
				'auth_token': users.token
			});
			unblock_exit();
		},
		_getSafetyLevel: function(rsp) {
			if ('ok' == rsp.getAttribute('stat')) {
				settings.safety_level =
					parseInt(rsp.getElementsByTagName('person')[0].getAttribute('safety_level'));
				settings.update();
			}
			unblock_exit();
		}

	}

};

// Hash of timeouts being used to track running API calls
var _timeouts = {};

// The guts of the API object - this actually makes the XHR calls and finds the callback
//   Callbacks are named exactly like the API method but with an _ in front of the last
//   part of the method name (for example flickr.foo.bar calls back to flickr.foo._bar)
var _api = function(params, url, browser, post, id) {
Components.utils.reportError('API CALL: ' + params.toSource());
	if (null == url) {
		url = 'http://api.flickr.com/services/rest/';
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

	// Sign the call
	params['api_key'] = api_key;
	var sig = [];
	var esc_params = {};
	for (var p in params) {
		if ('object' == typeof params[p]) {
			esc_params[p] = params[p];
		} else {
			sig.push(p);
			esc_params[p] = escape_utf8('' + params[p], !post);
		}
	}
	sig.sort();
	var calc = [secret];
	var ii = sig.length;
	for (var i = 0; i < ii; ++i) {
		calc.push(sig[i] + params[sig[i]]);
	}
	esc_params['api_sig'] = hex_md5(calc.join(''));

	// Build either a POST payload or a GET URL
	//   There is an assumption here that no one will be sending a file over GET
	var mstream = '';
	var boundary = '--------------------------deadbeef';
	if (post) {
		mstream = Cc['@mozilla.org/io/multiplex-input-stream;1'].createInstance(
			Ci.nsIMultiplexInputStream);
		var sstream;
		for (var p in esc_params) {
			sstream = Cc['@mozilla.org/io/string-input-stream;1'].createInstance(
				Ci.nsIStringInputStream);
			sstream.setData('--' + boundary + '\r\nContent-Disposition: form-data; name="' +
				p + '"', -1);
			mstream.appendStream(sstream);
			if ('object' == typeof esc_params[p] && null != esc_params[p]) {
				sstream = Cc['@mozilla.org/io/string-input-stream;1'].createInstance(
					Ci.nsIStringInputStream);
				sstream.setData('; filename="' + esc_params[p].filename +
					'"\r\nContent-Type: application/octet-stream\r\n\r\n', -1);
				mstream.appendStream(sstream);
				var file = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsILocalFile);
				file.initWithPath(esc_params[p].path);
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
				sstream.setData('\r\n\r\n' + esc_params[p] + '\r\n', -1);
				mstream.appendStream(sstream);
			}
		}
		sstream = Cc['@mozilla.org/io/string-input-stream;1'].createInstance(
			Ci.nsIStringInputStream);
		sstream.setData('--' + boundary + '--', -1);
		mstream.appendStream(sstream);
		upload.progress_total = mstream.available();
	} else {
		var args = [];
		for (var p in esc_params) {
			args.push(p + '=' + esc_params[p]);
		}
		url += '?' + args.join('&');
	}

	// Open a browser
	//   Only GET requests are supported here
	if (browser) {
		var io = Cc['@mozilla.org/network/io-service;1'].getService(Ci.nsIIOService);
		var uri = io.newURI(url, null, null);
		var eps = Cc['@mozilla.org/uriloader/external-protocol-service;1'].getService(
			Ci.nsIExternalProtocolService);
		var launcher = eps.getProtocolHandlerInfo('http');
		launcher.preferredAction = Ci.nsIHandlerInfo.useSystemDefault;
		launcher.launchWithURI(uri, null);
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
Components.utils.reportError('API RESULT: ' + xhr.responseText);
					var rsp = xhr.responseXML.documentElement;

					// If this is a normal method call
					if (params.method) {

						// It returned normally, don't timeout
						window.clearTimeout(_timeouts[esc_params['api_sig']]);
						delete _timeouts[esc_params['api_sig']];

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
		if (post && -1 != id) {
			upload.progress_handle = window.setInterval(function() {
				upload.progress(mstream, id);
			}, 200);
		}

		// Setup timeout guard on everything else
		else if (params.method) {
			_timeouts[esc_params['api_sig']] = window.setTimeout(function() {
Components.utils.reportError('API TIMEOUT: ' + callback);
				var rsp = false;
				eval(callback);
			}, TIMEOUT);
		}

	}

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
	var chars = '0123456789ABCDEF';
	data = data.toString();
	var buffer = [];
	var ii = data.length;
	for (var i = 0; i < ii; ++i) {
		var c = data.charCodeAt(i);
		var bs = new Array();
		if (c > 0x10000) {
			bs[0] = 0xF0 | ((c & 0x1C0000) >>> 18);
			bs[1] = 0x80 | ((c & 0x3F000) >>> 12);
			bs[2] = 0x80 | ((c & 0xFC0) >>> 6);
			bs[3] = 0x80 | (c & 0x3F);
		} else if (c > 0x800) {
			bs[0] = 0xE0 | ((c & 0xF000) >>> 12);
			bs[1] = 0x80 | ((c & 0xFC0) >>> 6);
			bs[2] = 0x80 | (c & 0x3F);
		} else if (c > 0x80) {
			bs[0] = 0xC0 | ((c & 0x7C0) >>> 6);
			bs[1] = 0x80 | (c & 0x3F);
		} else {
			bs[0] = c;
		}
		var jj = bs.length
		if (1 < jj) {
			if (url) {
				for (var j = 0; j < jj; ++j) {
					var b = bs[j];
					buffer.push('%' + chars.charAt((b & 0xF0) >>> 4) + chars.charAt(b & 0x0F));
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