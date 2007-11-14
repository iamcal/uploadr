// A note about the authentication API:
//   Because authentication is rather involved, involving a bunch of API calls in sequence,
//   authentication should be kicked off using users.login() in users.js.  The login sequence
//   here is chained together in such a way that after users.login()'s callback returns, the
//   users object is setup and ready for use.

// Notes about the upload API:
//   Upload batches should be kicked off using photos.upload() in photos.js.  The setting
//   uploadr.conf.mode in uploadr.js can select either synchronous or asynchronous uploads.

// API key is defined in keys.js
// The secret is defined in C code and accessed here
var secret;
try {
	secret = Cc['@flickr.com/secret;1'].createInstance(Ci.ISecret);
} catch (err) {
	Components.utils.reportError(err);
}

// The upload API
var upload = {

	// Flag set if a batch is cancelled
	cancel: false,

	// Progress metering
	progress_bar: null,
	progress_handle: null,
	progress_id: -1,
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
		if (null == upload.progress_bar) {
			document.getElementById('footer').style.display = '-moz-box';
			upload.progress_bar = new ProgressBar('progress_bar');
			document.getElementById('progress_text').className = 'spinning';
		}

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

		// Stop checking progress
		if (null != upload.progress_handle) {
			window.clearInterval(upload.progress_handle);
			upload.progress_handle = null;
		}

		// If no ticket came back, fail this photo
		if ('object' != typeof rsp || 'ok' != rsp.getAttribute('stat')) {
			if (null != photos.uploading[id]) {
				photos.uploading[id].progress_bar.done(false);
				++photos.fail;
				photos.failed.push(photos.uploading[id]);
			}
			photos.uploading[id] = null;
			if (upload.bandwidth(rsp)) {
				return;
			}
			if (upload.cancel) {
				upload.done();
			}
		}

		// Otherwise, spin for a ticket
		else if (null != photos.uploading[id]) {
			photos.uploading[id].progress_bar.done(true);
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

		// Stop checking progress if we're in synchronous mode
		if ('sync' == uploadr.conf.mode && null != upload.progress_handle) {
			window.clearInterval(upload.progress_handle);
			upload.progress_handle = null;
		}

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
			if (null != photos.uploading[id]) {
				photos.uploading[id].progress_bar.done(true);
				++photos.ok;
			}
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

		} else if ('fail' == stat) {
			photos.uploading[id].progress_bar.done(false);
			++photos.fail;
			photos.failed.push(photos.uploading[id]);
			if (upload.bandwidth(rsp)) {
				return;
			}
		}
		photos.uploading[id] = null;

		// For the last upload, we have some cleanup to do
		if ((upload.cancel || photos.ok + photos.fail == photos.total) &&
			0 == upload.tickets_count) {
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
		if (id != upload.progress_id) {
			upload.progress_id = id;
			upload.progress_last = upload.progress_total;
		}
		var a = stream.available() >> 10;
		var kb = upload.progress_last - a;

		// Have we made any progress?  If so, push the timeout event further into the future
		//   This is set to 1 kilobyte instead of 0 because some essentially dead connections will
		//   send off a few bytes every now and then
		if (1 < kb) {
			window.clearTimeout(upload.timeout_handle);
			upload.timeout_handle = window.setTimeout(function() {
				upload.timeout(id);
			}, uploadr.conf.timeout);
		}
		if (0 != upload.progress_last) {
			photos.kb.sent += kb;
		}
		upload.progress_last = a;

		// Update the UI
		if (null != photos.uploading[id]) {
			photos.uploading[id].progress_bar.update(1 - a / upload.progress_total);
		}
		var percent = Math.max(0, Math.min(100, photos.kb.sent / photos.kb.total));
		upload.progress_bar.update(percent);
		if (100 == Math.round(100 * percent)) { // Why doesn't (1 == percent) work here?
			document.getElementById('progress_text').value =
				locale.getString('upload.waiting.status');
		} else {
			document.getElementById('progress_text').value = locale.getFormattedString(
				'upload.progress.status', [
					id + 1, // Since starting to use photos.normalize, this should be correct
					photos.total,
					Math.round(100 * percent)
				]);
		}

	},

	// Timeout an upload after too much inactivity
	timeout: function(id) {
		if (uploadr.conf.console.timeout) {
			Components.utils.reportError('UPLOAD TIMEOUT: ' + id);
		}
		window.clearInterval(upload.progress_handle);
		upload.progress_handle = null;
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
			if (0 != ii) {
				document.getElementById('photos_init').style.display = 'none';
				document.getElementById('photos_new').style.display = 'none';
			}
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
			if (confirm(locale.getString('dialog.bandwidth.text'),
				locale.getString('dialog.bandwidth.title'),
				locale.getString('dialog.bandwidth.ok'),
				locale.getString('dialog.bandwidth.cancel'))) {
				launch_browser('http://flickr.com/upgrade/');
			} else {
				buttons.login.click();
			}
			mouse.show_photos();
			return true;
		} else {
			return false;
		}
	},

	// Start to clean up after an upload finishes
	done: function() {
		window.clearTimeout(upload.timeout_handle);
		upload.timeout_handle = null;
		window.clearInterval(upload.progress_handle);
		upload.progress_handle = null;
		document.getElementById('photos_stack').style.visibility = 'visible';
		document.getElementById('photos_init').style.display = '-moz-box';
		document.getElementById('photos_new').style.display = 'none';

		// Update the UI
		photos.batch_size = 0;
		free.update();
		var text = document.getElementById('progress_text');
		if (0 == photos.fail) {
			text.className = 'done';
			text.value = locale.getString('upload.success.status');
		} else {
			text.className = 'error';
			text.value = locale.getString('upload.error.status');
		}
		mouse.show_photos();
		var queue = document.getElementById('queue_list');
		while (queue.hasChildNodes()) {
			queue.removeChild(queue.firstChild);
		}
		status.clear();

		// Re-add failures to the batch
		var f = photos.failed;
		var ii = f.length;
		if (0 != ii) {
			for (var i  = 0; i < ii; ++i) {
				photos._add(f[i].path);
				photos.list[photos.list.length - 1] = f[i];
			}
		}

		// If this was a cancellation, re-add photos we didn't get to
		if (upload.cancel) {
			for each (var p in photos.uploading) {
				if (null != p) {
					photos._add(p.path);
					photos.list[photos.list.length - 1] = p;
				}
			}
		}
		photos.normalize();

		// Kick off the chain of adding photos to a set
		var not_adding_to_sets = true;
		for (var set_id in meta.sets_map) {
			if (0 == meta.sets_map[set_id].length) {
				continue;
			}
			status.set(locale.getString('status.sets'));
			not_adding_to_sets = false;
			if (-1 == meta.created_sets.indexOf(set_id)) {
				flickr.photosets.addPhoto(set_id, meta.sets_map[set_id][0]);
			} else {
				flickr.photosets.create(set_id, '', meta.sets_map[set_id][0]);
			}
		}

		// Here be dragons: If we are adding photos to a set, the last one will call this,
		// otherwise we have to here.  If it doesn't get called then limits and such will not
		// be updated for the next upload.
		if (not_adding_to_sets) {
			upload.finalize();
		}

	},

	// Finally give the user feedback on their upload
	finalize: function() {

		// Make sure the sets map is actually empty
		var not_empty = false;
		for (var set_id in meta.sets_map) {
			not_empty = 0 == meta.sets_map[set_id].length ? not_empty : true;
		}
		if (not_empty) {
			return;
		}

		// Ask the site for an update
		flickr.photosets.getList(users.nsid);
		flickr.people.getUploadStatus();

		// Decide which message to show
		var go_to_flickr = false;
		var try_again = false;
		if (0 == photos.fail && 0 < photos.ok && photos.sets) {
			go_to_flickr = confirm(locale.getString('upload.success.text'),
				locale.getString('upload.success.title'),
				locale.getString('upload.success.ok'),
				locale.getString('upload.success.cancel'));
		} else if (0 < photos.fail && 0 < photos.ok) {
			var c = confirm(locale.getFormattedString('upload.error.some.text',
				[photos.total - photos.ok, photos.total]),
				locale.getString('upload.error.some.title'),
				locale.getString('upload.error.some.ok'),
				locale.getString('upload.error.some.cancel'));
			if (c) {
				try_again = true;
			} else {
				go_to_flickr = true;
			}
		} else if (0 == photos.fail && 0 < photos.ok && !photos.sets) {
			go_to_flickr = confirm([locale.getString('upload.error.sets.text'),
				locale.getString('upload.error.sets.more')],
				locale.getString('upload.error.sets.more'),
				locale.getString('upload.error.sets.title'),
				locale.getString('upload.error.sets.ok'),
				locale.getString('upload.error.sets.cancel'));
		} else { // if (0 < photos.fail && 0 == photos.ok) {
			try_again = confirm([locale.getString('upload.error.all.text'),
				locale.getString('upload.error.all.more')],
				locale.getString('upload.error.all.title'),
				locale.getString('upload.error.all.ok'),
				locale.getString('upload.error.all.cancel'));
		}

		// Hide the progress bar now that the user has realized we're done
		document.getElementById('progress_bar').style.width = '0';
		document.getElementById('footer').style.display = 'none';

		// If requested, open the site
		if (go_to_flickr) {
			launch_browser('http://flickr.com/tools/uploader_edit.gne?ids=' +
				photos.uploaded.join(','));
		}

		// Really finally actually done, so reset
		buttons.upload.enable();
		photos.uploading = [];
		photos.add_to_set = [];
		photos.failed = [];
		photos.uploaded = [];
		photos.total = 0;
		photos.ok = 0;
		photos.fail = 0;
		photos.sets = true;
		photos.kb.sent = 0;
		photos.kb.total = 0;
		upload.progress_bar = null;
		upload.cancel = false;
		upload.tickets = {};
		upload.tickets_count = 0;
		upload.tickets_delta = 1000;
		upload.tickets_handle = null;
		unblock_exit();

		// Try again without deleting the list of <photoid>s
		if (try_again) {
			threads.worker.dispatch(new RetryUpload(), threads.worker.DISPATCH_NORMAL);
		}

	}

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
			} else {
				users.token = rsp.getElementsByTagName('token')[0].firstChild.nodeValue;
				var user = rsp.getElementsByTagName('user')[0];
				users.nsid = user.getAttribute('nsid');
				users.username = user.getAttribute('username');

				// Complete the login process
				users._login();

			}
		},

		getFrob: function(fresh) {
			_api({
				'method': 'flickr.auth.getFrob'
			}, null, null, null, fresh);
		},
		_getFrob: function(rsp, fresh) {
			if ('object' != typeof rsp || 'ok' != rsp.getAttribute('stat')) {
				users.logout();
			} else {
				users.frob = rsp.getElementsByTagName('frob')[0].firstChild.nodeValue;
				if (!confirm(locale.getString('auth.prompt.text'),
					locale.getString('auth.prompt.title'),
					locale.getString('auth.prompt.ok'),
					locale.getString('auth.prompt.cancel'))) {
					return;
				}
				_api({
					'perms': 'write',
					'frob': users.frob,
				}, 'http://api.flickr.com/services/auth/' + (fresh ? 'fresh/' : ''), true);
				pages.go('auth');
				buttons.login.enable();
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
		}

	},

	// Like the auth section, this is used by users.login() and won't need to be called
	people: {

		// Sets up the photostream header
		getInfo: function(user_id) {
			_api({
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
			_api({
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
				free.update();
				users.update();
			}
		}

	},

	photos: {

		upload: {

			checkTickets: function(tickets) {
				block_exit();
				_api({
					'method': 'flickr.photos.upload.checkTickets',
					'auth_token': users.token,
					'tickets': tickets.join(',')
				});
			},
			_checkTickets: function(rsp) {
				if ('object' == typeof rsp && 'ok' == rsp.getAttribute('stat')) {
					var again = false;
					var tickets = rsp.getElementsByTagName('uploader')[0].getElementsByTagName(
						'ticket');
					var ii = tickets.length;
					for (var i = 0; i < ii; ++i) {
						var ticket_id = tickets[i].getAttribute('id');
						var complete = parseInt(tickets[i].getAttribute('complete'));
						if ('undefined' != typeof upload.tickets[ticket_id]) {
							if (2 == complete) {
								--upload.tickets_count;
								upload._sync(false, upload.tickets[ticket_id]);
								delete upload.tickets[ticket_id];
							} else if (1 == complete) {
								--upload.tickets_count;
								upload._sync(parseInt(tickets[i].getAttribute('photoid')),
									upload.tickets[ticket_id]);
								delete upload.tickets[ticket_id];
							} else {
								again = true;
							}
						}
					}
					if (again) {
						upload._check_tickets();
					}
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
			_api({
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

				if (0 != meta.sets_map[set_id].length) {
					flickr.photosets.addPhoto(set_id, meta.sets_map[set_id][0]);
				} else {
					upload.finalize();
				}
			}
			unblock_exit();
		},

		getList: function(user_id) {
			_api({
				'method': 'flickr.photosets.getList',
				'auth_token': users.token
			});
		},
		_getList: function(rsp) {
			if ('object' == typeof rsp && 'ok' == rsp.getAttribute('stat')) {
				meta.sets = {};
				var sets = rsp.getElementsByTagName('photosets')[0].getElementsByTagName('photoset');
				var ii = sets.length;
				var order = []
				for (var i = 0; i < ii; ++i) {
					order.push([sets[i].getAttribute('id'),
						sets[i].getElementsByTagName('title')[0].firstChild.nodeValue]);
				}
				order.sort(function(a, b) {
					return a[1] > b[1];
				});
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
			_api({
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
			_api({
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
			_api({
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
			_api({
				'method': 'flickr.prefs.getSafetyLevel',
				'auth_token': users.token
			});
		},
		_getSafetyLevel: function(rsp) {
			if ('object' == typeof rsp && 'ok' == rsp.getAttribute('stat')) {
				settings.safety_level =
					parseInt(rsp.getElementsByTagName('person')[0].getAttribute('safety_level'));
				meta.defaults({safety_level: settings.safety_level});
			}
		}

	}

};

// Hash of timeouts being used to track running API calls
var _timeouts = {};

// The guts of the API object - this actually makes the XHR calls and finds the callback
//   Callbacks are named exactly like the API method but with an _ in front of the last
//   part of the method name (for example flickr.foo.bar calls back to flickr.foo._bar)
var _api = function(params, url, browser, post, id) {
	if (uploadr.conf.console.request) {
		Components.utils.reportError('API REQUEST: ' + params.toSource());
	}
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
	var calc = [secret.secret()];
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
		upload.progress_total = mstream.available() >> 10;
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
		launch_browser(url);
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
					if (uploadr.conf.console.response) {
						Components.utils.reportError('API RESPONSE: ' + xhr.responseText);
					}
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
		if (post && -1 != id && !params.method) {
			upload.progress_handle = window.setInterval(function() {
				upload.progress(mstream, id);
			}, uploadr.conf.check);
		}

		// Setup timeout guard on everything else
		else if (params.method) {
			_timeouts[esc_params['api_sig']] = window.setTimeout(function() {
				if (uploadr.conf.console.timeout) {
					Components.utils.reportError('API TIMEOUT: ' + callback);
				}
				var rsp = false;
				eval(callback);
			}, uploadr.conf.timeout);
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