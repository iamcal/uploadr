/*
 * Flickr Uploadr
 *
 * Copyright (c) 2007 Yahoo! Inc.  All rights reserved.  This library is free
 * software; you can redistribute it and/or modify it under the terms of the
 * GNU General Public License (GPL), version 2 only.  This library is
 * distributed WITHOUT ANY WARRANTY, whether express or implied. See the GNU
 * GPL for more details (http://www.gnu.org/licenses/gpl.html)
 */

// A note about the authentication API:
//   Because authentication is rather involved, involving a bunch of API calls in sequence,
//   authentication should be kicked off using users.login() in users.js.  The login sequence
//   here is chained together in such a way that after users.login()'s callback returns, the
//   users object is setup and ready for use.

// Notes about the upload API:
//   Upload batches should be kicked off using photos.upload() in photos.js.  The setting
//   uploadr.conf.mode in uploadr.js can select either synchronous or asynchronous uploads.

// The API key and secret are defined in flKey.cpp and included here
var key;
try {
	key = Cc['@flickr.com/key;1'].createInstance(Ci.flIKey);
} catch (err) {
	Components.utils.reportError(err);
}

// The upload API
var upload = {

	// Count how many times a photo is retried
	retry_count: 0,

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

	// Timestamps for defining this batch on the site
	timestamps: {
		earliest: 0,
		latest: 0
	},

	// Stats tracking
	stats: {
		photos: 0,
		bytes: 0,
		errors: 0
	},

	// Track when we're "processing" for special multi-batch handling
	processing: false,

	// Holding pen for photos we may try again
	try_again: [],

	// Upload a photo
	start: function(id) {

		// Update the UI
		if (null == upload.progress_bar) {
			document.getElementById('footer').style.display = '-moz-box';
			upload.progress_bar = new ProgressBar('progress_bar');
			var progress_text = document.getElementById('progress_text');
			progress_text.className = 'spinning';
			progress_text.value = '';
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

			// Make sure this isn't a bandwidth error, as those are
			// unrecoverable
			if (upload.bandwidth(rsp)) {
				return;
			}

			// Still have available retries
			if (uploadr.conf.auto_retry_count > upload.retry_count) {
				++upload.retry_count;
				upload.start(id);
				if (uploadr.conf.console.retry) {
					Components.utils.reportError('UPLOAD RETRY: id = ' + id +
						', retry = ' + upload.retry_count);
				}
			}

			// Out of retry attempts, this time we really die
			else {
				if (null != photos.uploading[id]) {
					photos.uploading[id].progress_bar.done(false);
					++photos.fail;
					photos.failed.push(photos.uploading[id]);
				}
				photos.uploading[id] = null;
				upload.cancel = true;
				if (0 == upload.tickets_count) {
					upload.done();
				}
			}

			return;
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
				upload.retry_count = 0;
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

				// If we were ever to use sync upload, we would need imported
				// timestamps here

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
		if ((upload.cancel || photos.ok + photos.fail == photos.uploading.length) &&
			0 == upload.tickets_count) {
			upload.done();
		}

		// But if this isn't last and we're doing synchronous, kick off the next upload
		else if ('sync' == uploadr.conf.mode) {
			var ii = photos.uploading.length;
			for (var i = id; i < ii; ++i) {
				if (null != photos.uploading[i]) {
					upload.retry_count = 0;
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
		var percent = Math.max(0, Math.min(1, photos.kb.sent / photos.kb.total));
		upload.progress_bar.update(percent);
		if (100 == Math.round(100 * percent)) { // Why doesn't (1 == percent) work here?
			document.getElementById('progress_text').value =
				locale.getString('upload.waiting.status');
			upload.processing = true;
		} else {
			document.getElementById('progress_text').value = locale.getFormattedString(
				'upload.progress.status', [
					id + 1, // Since starting to use photos.normalize, this should be correct
					photos.uploading.length,
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
			for each (var p in photos.uploading) {
				if (null != p && -1 == f.indexOf(p.path)) {
					f.push(p);
				}
			}
			var ii = f.length;
			if (0 != ii) {
				document.getElementById('photos_init').style.display = 'none';
				document.getElementById('photos_new').style.display = 'none';
				if (photos.sort) {
					document.getElementById('photos_sort_default').style.display = 'block';
					document.getElementById('photos_sort_revert').style.display = 'none';
				} else {
					document.getElementById('photos_sort_default').style.display = 'none';
					document.getElementById('photos_sort_revert').style.display = 'block';
				}
			}
			for (var i  = 0; i < ii; ++i) {
				photos._add(f[i].path);
				photos.list[photos.list.length - 1] = f[i];
			}

			// Add back any queued batches
			while (photos.ready.length) {
				var r = photos.ready.shift();
				ii = r.length;
				for (var i  = 0; i < ii; ++i) {
					photos._add(r[i].path);
					photos.list[photos.list.length - 1] = r[i];
				}
			}

			photos.uploading = [];
			photos.uploaded = [];
			photos.add_to_set = [];
			photos.failed = [];
			photos.ok = 0;
			photos.fail = 0;
			upload.processing = false;
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

		// Update the UI
		upload.progress_bar.update(1);
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

		// Hold failed photos for trying again
		var f = photos.failed;
		var ii = f.length;
		if (0 != ii) {
			for (var i  = 0; i < ii; ++i) {
				upload.try_again.push(f[i]);
			}
		}

		// Re-add photos we didn't get to
		if (upload.cancel) {
			for each (var p in photos.uploading) {
				if (null != p) {
					upload.try_again.push(p);
				}
			}

			// Add back any queued batches
			while (photos.ready.length) {
				var r = photos.ready.shift();
				ii = r.length;
				for (var i  = 0; i < ii; ++i) {
					upload.try_again.push(r[i]);
				}
			}

		}

		// Kick off the chain of adding photos to a set
		var not_adding_to_sets = true;
		for (var set_id in meta.sets_map) {
			if (0 == meta.sets_map[set_id].length) {
				continue;
			}
			status.set(locale.getString('status.sets'));
			not_adding_to_sets = false;
			var index = meta.created_sets.indexOf(set_id);
			if (-1 == index) {
				flickr.photosets.addPhoto(set_id, meta.sets_map[set_id][0]);
			} else {
				flickr.photosets.create(set_id, meta.created_sets_desc[index],
					meta.sets_map[set_id][0]);
			}
		}

		// If we are adding photos to a set, the last one will call this, otherwise we
		// have to here.  If it doesn't get called then limits and such will not be
		// updated for the next upload.
		if (not_adding_to_sets) {
			upload.finalize();
		}

	},

	// Finally give the user feedback on their upload
	finalize: function() {
		status.clear();

		// Make sure the sets map is actually empty
		var not_empty = false;
		for (var set_id in meta.sets_map) {
			not_empty = 0 == meta.sets_map[set_id].length ? not_empty : true;
		}
		if (not_empty) {
			return;
		}

		// Normalize the list of created sets
		var i = 0;
		var ii = meta.created_sets.length;
		while (i < ii) {
			if (null == meta.created_sets[i]) {
				meta.created_sets.shift();
				meta.created_sets_desc.shift();
			} else {
				++i;
			}
		}

		// If there is a batch queued up, start that batch, preserving the
		// timestamps so that this looks like one big batch
		upload.processing = false;
		if (photos.ready.length) {
			buttons.upload.enable();
			photos.uploading = [];
			photos.add_to_set = [];
			photos.failed = [];
			photos.uploaded = [];
			upload.stats.photos += photos.ok + photos.fail;
			upload.stats.errors += photos.fail;
			photos.ok = 0;
			photos.fail = 0;
			photos.sets = true;
			photos.kb.sent = 0;
			upload.stats.bytes += 1024 * photos.kb.total;
			photos.kb.total = 0;
			upload.progress_bar = null;
			upload.cancel = false;
			upload.tickets = {};
			upload.tickets_count = 0;
			upload.tickets_delta = 1000;
			upload.tickets_handle = null;
			unblock_exit();
			photos.upload(photos.ready.shift(), photos.ready_size.shift());
			return;
		}

		// Ask the site for an update
		flickr.photosets.getList(users.nsid);
		flickr.people.getUploadStatus();

		// Send stats to the site
		flickr.utils.logUploadStats(0 /* Source, known by API key */,
			upload.stats.photos + photos.ok + photos.fail,
			1000 * (upload.timestamps.latest - upload.timestamps.earliest),
			upload.stats.bytes + 1024 * photos.kb.total,
			upload.stats.errors + photos.fail);
			

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
				[photos.uploading.length - photos.ok, photos.uploading.length]),
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
			launch_browser('http://flickr.com/photos/upload/done/?b=' +
				upload.timestamps.earliest + '-' + upload.timestamps.latest +
				'-' + users.nsid);
		}

		// Really finally actually done, so reset
		buttons.upload.enable();
		photos.uploading = [];
		photos.add_to_set = [];
		photos.failed = [];
		photos.uploaded = [];
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
		upload.timestamps.earliest = 0;
		upload.timestamps.latest = 0;
		upload.stats.photos = 0;
		upload.stats.bytes = 0;
		upload.stats.errors = 0;
		unblock_exit();

		// Try again without deleting the list of <photoid>s
		if (try_again) {

			// Queue 'em up
			ii = upload.try_again.length;
			photos.ready = [[]];
			photos.ready_size = [0];
			for (var i = 0; i < ii; ++i) {
				photos.ready[0].push(upload.try_again[i]);
				photos.ready_size[0] += upload.try_again[i].size;
			}

			threads.worker.dispatch(new RetryUpload(true), threads.worker.DISPATCH_NORMAL);
		}

		// Otherwise drop the recovered photos into the current batch
		else {
			photos.add(upload.try_again);
		}
		upload.try_again = [];

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
			_api({
				'method': 'flickr.auth.getFrob'
			}, null, null, null, fresh);
		},
		_getFrob: function(rsp, fresh) {
			if ('object' != typeof rsp || 'ok' != rsp.getAttribute('stat')) {
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
				_api({
					'perms': 'write',
					'frob': users.frob,
				}, 'http://api.flickr.com/services/auth/' + (fresh ? 'fresh/' : ''), true);
				pages.go('auth');
			}
			buttons.login.enable();
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
				var again = false;
				if ('object' == typeof rsp && 'ok' == rsp.getAttribute('stat')) {
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
				settings.save();
				meta.defaults({safety_level: settings.safety_level});
			}
		}

	},

	utils: {

		logUploadStats: function(source, num_photos, upload_time, bytes, errors) {
			_api({
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
	params['api_key'] = key.key();
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
	var calc = [];
	var ii = sig.length;
	for (var i = 0; i < ii; ++i) {
		calc.push(sig[i] + (post ? esc_params[sig[i]] : escape_utf8('' + params[sig[i]], false)));
	}
	esc_params['api_sig'] = key.sign(calc.join(''));

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
					var rsp = xhr.responseXML.documentElement;
					if (uploadr.conf.console.error && (
						'object' != typeof rsp || 'ok' != rsp.getAttribute('stat'))) {
						Components.utils.reportError('API ERROR: ' + xhr.responseText);
					} else if (uploadr.conf.console.response) {
						Components.utils.reportError('API RESPONSE: ' + xhr.responseText);
					}

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