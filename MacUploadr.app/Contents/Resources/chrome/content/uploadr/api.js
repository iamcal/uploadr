const api_key = '-----';
const secret = '-----';

const TIMEOUT = 60000; // Milliseconds

// A note about the authentication API:
//   Because authentication is rather involved, involving a bunch of API calls in sequence,
//   authentication should be kicked off using users.login() in users.js.  The login sequence
//   here is chained together in such a way that after users.login()'s callback returns, the
//   users object is setup and ready for use.

// The upload API
var upload = function(id) {
	block_exit = true;

	// Update the UI
	var meter = document.getElementById('progress_file');
	meter.value = 0;
	meter.mode = 'determined';
	document.getElementById('progress').style.display = '-moz-box';

	// Pass the photo to the API
	var photo = photos.uploading[id];
	_api({
		'auth_token': users.token,
		'title': photo.title,
		'description': photo.description,
		'tags': photo.tags + ' ' + settings.tags,
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

};
var upload_cancel = false;
var _upload = function(rsp, id) {

	// Cancel the timeout
	window.clearTimeout(upload_timeout_handle);

	// How did the upload go?
	var stat;
	if ('object' == typeof rsp) {
		stat = rsp.getAttribute('stat');
	} else {
		stat = 'fail';
	}
	if ('ok' == stat) {
		++photos.ok;
		var photo_id = parseInt(rsp.getElementsByTagName('photoid')[0].firstChild.nodeValue)
		photos.uploaded.push(photo_id);
		photos.add_to_set.push(photo_id);
	} else if ('fail' == stat) {
		++photos.fail;
		photos.failed.push(photos.uploading[id]);

		// If we're out of bandwidth
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
			document.getElementById('button_upload').disabled = true;
			threads.worker.dispatch(new Sort(), threads.worker.DISPATCH_NORMAL);
			photos.uploading = [];
			photos.uploaded = [];
			photos.add_to_set = [];
			photos.failed = [];
			photos.total = 0;
			photos.ok = 0;
			photos.fail = 0;
			block_exit = false;
			window.openDialog('chrome://uploadr/content/bandwidth.xul', 'dialog_bandwidth',
				'chrome,modal', events.bandwidth.switch_users, events.bandwidth.go_pro);
			return;
		}

	}
	photos.uploading[id] = null;

	// Update the UI
	document.getElementById('progress_overall').value =
		100 * (photos.ok + photos.fail) / photos.total;

	// For the last upload, we have some cleanup to do
	var done = true;
	for each (var p in photos.uploading) {
		done = done && null == p;
	}
	if (done || upload_cancel) {

		// Kick off the chain of adding photos to a set
		if (null != settings.set && '' != settings.set) {
			if (/[0-9]+/.test(settings.set)) {
				flickr.photosets.addPhoto(settings.set, photos.add_to_set.shift());
			} else {
				flickr.photosets.create(settings.set, '', photos.add_to_set.shift());
			}
		}

		// Here be dragons: If we are adding photos to a set, the last one will call this,
		// otherwise we have to here.  If it doesn't get called then limits and such will not
		// be updated for the next upload.
		else {
			flickr.people.getUploadStatus();
		}

		// Update the UI
		photos.batch_size = 0;
		free.update();
		document.getElementById('progress').style.display = 'none';
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
			document.getElementById('button_upload').disabled = true;
			threads.worker.dispatch(new Sort(), threads.worker.DISPATCH_NORMAL);
		}

		// If this was a cancellation, add photos we didn't get to back to the batch
		if (upload_cancel) {
			for each (var p in photos.uploading) {
				if (null != p) {
					photos._add(p.path);
					photos.list[photos.list.length - 1] = p;
				}
			}
			document.getElementById('button_upload').disabled = true;
			threads.worker.dispatch(new Sort(), threads.worker.DISPATCH_NORMAL);
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
			document.getElementById('button_upload').disabled = false;
		}

		// Clear out the uploading batch
		photos.uploading = [];
		photos.uploaded = [];
		photos.add_to_set = [];
		photos.failed = [];
		photos.total = 0;
		photos.ok = 0;
		photos.fail = 0;

		upload_cancel = false;
		block_exit = false;
	}

	// But if this isn't last, kick off the next upload
	else {
		var ii = photos.uploading.length;
		for (var i = id; i < ii; ++i) {
			if (null != photos.uploading[i]) {
				upload(i);
				break;
			}
		}
	}

};
var upload_progress_handle = null;
var upload_progress_last = 0;
var upload_progress_total = -1;
var upload_progress = function(stream, id) {

	// Get this bit of progress
	var a = stream.available();
	var bytes = upload_progress_total - a;
	var percent = Math.round(100 * bytes / upload_progress_total);
	if (0 > percent) {
		percent = 0;
	}

	// Have we made any progress?  If so, push the timeout event further into the future; if
	// not, call it explicitly now
	if (bytes > upload_progress_last) {
		window.clearTimeout(upload_timeout_handle);
		upload_timeout_handle = window.setTimeout(function() {
			upload_timeout(id);
		}, TIMEOUT);
	}
	upload_progress_last = bytes;

	// Update the UI
	var meter = document.getElementById('progress_file');
	meter.value = percent;

	// This is the end?
	if (0 == a) {
		meter.mode = 'undetermined';
		window.clearInterval(upload_progress_handle);
	}

};
var upload_timeout_handle = null;
var upload_timeout = function(id) {
	window.clearInterval(upload_progress_handle);
	upload_cancel = true;
	_upload(false, id);
};

// The standard API
var flickr = {

	// Authentication - again, don't use this directly, use users.login()
	auth: {

		checkToken: function(token) {
			_api({
				'method': 'flickr.auth.checkToken',
				'auth_token': token
			});
		},
		_checkToken: function(rsp) {
			if ('object' != typeof rsp || 'ok' != rsp.getAttribute('stat')) {
				users.logout();
				return;
			}
			users.token = rsp.getElementsByTagName('token')[0].firstChild.nodeValue;
			var user = rsp.getElementsByTagName('user')[0];
			users.nsid = user.getAttribute('nsid');
			users.username = user.getAttribute('username');

			// Complete the login process
			users._login();

		},

		getFrob: function() {
			_api({
				'method': 'flickr.auth.getFrob'
			});
		},
		_getFrob: function(rsp) {
			if ('object' != typeof rsp || 'ok' != rsp.getAttribute('stat')) {
				users.logout();
				return;
			}
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
				return;
			}
			users.token = rsp.getElementsByTagName('token')[0].firstChild.nodeValue;
			var user = rsp.getElementsByTagName('user')[0];
			users.nsid = user.getAttribute('nsid');
			users.username = user.getAttribute('username');

			// Complete the login process
			users._login();

		}

	},

	// Like the auth section, this is used by users.login() and won't need to be called
	people: {

		getUploadStatus: function() {
			_api({
				'method': 'flickr.people.getUploadStatus',
				'auth_token': users.token
			});
		},
		_getUploadStatus: function(rsp) {
			if ('object' != typeof rsp || 'ok' != rsp.getAttribute('stat')) {
				flickr.people.getUploadStatus();
				return;
			}
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

	},

	photosets: {

		addPhoto: function(photoset_id, photo_id){
			_api({
				'method': 'flickr.photosets.addPhoto',
				'auth_token': users.token,
				'photoset_id': photoset_id,
				'photo_id': photo_id
			}, null, null, true);
		},
		_addPhoto: function(rsp) {
			if ('ok' != rsp.getAttribute('stat')) {
				alert(locale.getString('errors.add_to_set'),
				locale.getString('errors.add_to_set.title'));
				return;
			}
			if (0 != photos.add_to_set.length) {
				flickr.photosets.addPhoto(settings.set, photos.add_to_set.shift());
			} else {
				flickr.people.getUploadStatus();
			}
		},

		create: function(title, description, primary_photo_id) {
			_api({
				'method': 'flickr.photosets.create',
				'auth_token': users.token,
				'title': title,
				'description': description,
				'primary_photo_id': primary_photo_id
			}, null, null, true);
		},
		_create: function(rsp) {
			if ('ok' != rsp.getAttribute('stat')) {
				alert(locale.getString('errors.create_set'),
				locale.getString('errors.create_set.title'));
				return;
			}
			settings.set = rsp.getElementsByTagName('photoset')[0].getAttribute('id');
			if (0 != photos.add_to_set.length) {
				flickr.photosets.addPhoto(settings.set, photos.add_to_set.shift());
			} else {
				flickr.people.getUploadStatus();
			}
		},

		getList: function(user_id) {
			_api({
				'method': 'flickr.photosets.getList',
				'user_id': user_id,
			});
		},
		_getList: function(rsp) {
			if ('ok' != rsp.getAttribute('stat')) {
				return;
			}
			var dropdown = document.getElementById('s_set');
			dropdown.removeAllItems();
			var sets = rsp.getElementsByTagName('photosets')[0].getElementsByTagName('photoset');
			var ii = sets.length;
			if (0 == ii) {
				dropdown.appendItem(locale.getString('settings.set.none'), '');
				dropdown.disabled = true;
			} else {
				dropdown.appendItem(locale.getString('settings.set.dont'), '');
				for (var i = 0; i < ii; ++i) {
					dropdown.appendItem(locale.getFormattedString('settings.set.row', [
						sets[i].getElementsByTagName('title')[0].firstChild.nodeValue,
						sets[i].getAttribute('photos')
					]), sets[i].getAttribute('id'));
				}
				dropdown.disabled = false;
			}
			dropdown.selectedIndex = 0;
		}

	},

	// Preferences are fetched from the site when no stored version can be found
	//   It would be nice if these expanded to include default privacy settings
	prefs: {

		getContentType: function() {
			_api({
				'method': 'flickr.prefs.getContentType',
				'auth_token': users.token
			});
		},
		_getContentType: function(rsp) {
			if ('ok' != rsp.getAttribute('stat')) {
				return;
			}
			settings.content_type =
				parseInt(rsp.getElementsByTagName('person')[0].getAttribute('content_type'));
			settings.update();
		},

		getHidden: function() {
			_api({
				'method': 'flickr.prefs.getHidden',
				'auth_token': users.token
			});
		},
		_getHidden: function(rsp) {
			if ('ok' != rsp.getAttribute('stat')) {
				return;
			}
			settings.hidden =
				parseInt(rsp.getElementsByTagName('person')[0].getAttribute('hidden'));
			settings.update();
		},

		getPrivacy: function() {
			_api({
				'method': 'flickr.prefs.getPrivacy',
				'auth_token': users.token
			});
		},
		_getPrivacy: function(rsp) {
			if ('ok' != rsp.getAttribute('stat')) {
				return;
			}
			var privacy = parseInt(rsp.getElementsByTagName('person')[0].getAttribute('privacy'));
			settings.is_public = 1 == privacy;
			settings.is_friend = 2 == privacy || 4 == privacy;
			settings.is_family = 3 == privacy || 5 == privacy;
			settings.update();
		},

		getSafetyLevel: function() {
			_api({
				'method': 'flickr.prefs.getSafetyLevel',
				'auth_token': users.token
			});
		},
		_getSafetyLevel: function(rsp) {
			if ('ok' != rsp.getAttribute('stat')) {
				return;
			}
			settings.safety_level =
				parseInt(rsp.getElementsByTagName('person')[0].getAttribute('safety_level'));
			settings.update();
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
		post = '';
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
		upload_progress_total = mstream.available();
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
				params.method.substring(index, params.method.length) + '(rsp);';
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
						_upload(rsp, id);
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
			upload_progress_handle = window.setInterval(function() {
				upload_progress(mstream, id);
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