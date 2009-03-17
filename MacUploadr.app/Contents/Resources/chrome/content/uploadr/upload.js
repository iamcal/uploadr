/*
 * Flickr Uploadr
 *
 * Copyright (c) 2007-2009 Yahoo! Inc.  All rights reserved.  This library is
 * free software; you can redistribute it and/or modify it under the terms of
 * the GNU General Public License (GPL), version 2 only.  This library is
 * distributed WITHOUT ANY WARRANTY, whether express or implied. See the GNU
 * GPL for more details (http://www.gnu.org/licenses/gpl.html)
 */

// Notes about the upload API:
//   Upload batches should be kicked off using photos.upload() in photos.js.
//   The setting conf.mode in conf.js can select either synchronous or
//   asynchronous uploads.  However, synchronous uploads won't work right
//   with the new post-upload page.

// The upload API
var upload = {

    // general error/cancel string
    genErrorString: "<?xml version=\"1.0\" encoding=\"utf-8\" ?><rsp stat=\"fail\"><err code=\"3\" msg=\"General upload failure\" /></rsp>",
	// Count how many times a we've retried
	retry_count: 0,
	tickets_retry_count: 0,

	// Flag set if a batch is cancelled
	cancel: false,

	// Progress metering
	progress_bar: null,
	progress_handle: null,
	progress_id: -1,
	progress_last: 0,
	progress_total: -1,
	progress_zero: 0,

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

    startTime : 0,
    
    // Generate general error XML document element
    genErr: function() {
        var xml = document.implementation.createDocument("", "", null);
        var rspElem = xml.createElement("rsp");
        rspElem.setAttribute("stat", "fail");
        var errElem = xml.createElement("err");
        errElem.setAttribute("code", "3");
        errElem.setAttribute("msg", "General upload failure");
        rspElem.appendChild(errElem);
        xml.appendChild(rspElem);
        return xml.documentElement;
    },
    
	// Upload a photo
	start: function(id) {
	    //reset upload progress
	    upload.progress_id = -1;

		// Update the UI
		if (null == upload.progress_bar) {
			document.getElementById('footer').style.display = '-moz-box';
			upload.progress_bar = new ProgressBar('progress_bar');
			var progress_text = document.getElementById('progress_text');
			progress_text.className = 'spinning';
			progress_text.value = '';
		}

		var photo = photos.uploading[id];

		// Let extensions have their say
		extension.before_one_upload.exec(photo);

		// EXPERIMENTAL: Pass the photo to the socket uploadr
		if (conf.socket_uploadr) {

			// Dispatch for health and non-blocking profit!
			threads.uploadr.dispatch(new Upload({
				'async': 'async' == conf.mode ? 1 : 0,
				'auth_token': users.list[photo.nsid].token,
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
			}, id), threads.uploadr.DISPATCH_NORMAL);
		}

		// Pass the photo to the regular API
		//   Possibly/probably broken
		else {
			api.start({
				'async': 'async' == conf.mode ? 1 : 0,
				'auth_token': users.list[photo.nsid].token,
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
			}, null, 'http://' + UPLOAD_HOST + '/services/upload/',
				false, true, id);
		}

	},
	_start: function(rsp, id) {
		upload['_' + conf.mode](rsp, id);
	},

	// Finish an asynchronous upload
	_async: function(rsp, id) {

		// Stop checking progress
		if (null != upload.progress_handle) {
			window.clearInterval(upload.progress_handle);
			upload.progress_handle = null;
		}
		upload.progress_zero = 0;
        // If no ticket came back, fail this photo
		if ('object' != typeof rsp || 'ok' != rsp.getAttribute('stat')) {
			if (conf.console.error) {
			    if ('object' != typeof rsp) {
				    Components.utils.reportError(new Date().toUTCString() +' UPLOAD ERROR: ' + rsp);
				} else {
                    Components.utils.reportError(new Date().toUTCString() +' UPLOAD ERROR: ' + new XMLSerializer().serializeToString(rsp));
                }
			}

			// Make sure this isn't a bandwidth error, as those are
			// unrecoverable
			if (upload.bandwidth(rsp)) { return; }

			// If the result indicates that videos are disabled
			if ('object' == typeof rsp && rsp.getElementsByTagName('err')[0] &&
				7 == parseInt(rsp.getElementsByTagName('err')[0]
				.getAttribute('code'))) {
				alert(locale.getString('video.disabled.text'),
					locale.getString('video.disabled.title'),
					locale.getString('video.disabled.ok'));
				upload.cancel = true;
			}

			// Still have available retries
			if (!ui.cancel && !upload.cancel && conf.auto_retry_count >
				upload.retry_count) {
				++upload.stats.errors;
				++upload.retry_count;
				//photos.kb.sent -= photos.uploading[id].size;
				upload.start(id);
				if (conf.console.retry) {
					logStringMessage('UPLOAD RETRY: id = ' + id +
						', retry = ' + upload.retry_count);
				}
			}

			// Out of retry attempts, this time we really die
			else {
				upload.retry_count = 0;
				if (null != photos.uploading[id] && !ui.cancel) {
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
		if (null != photos.uploading[id]) {
			photos.uploading[id].progress_bar.done(true);
			upload.tickets[rsp.getElementsByTagName('ticketid')[0]
				.firstChild.nodeValue] = {
					'id': id,
					'token': users.list[photos.uploading[id].nsid].token
				};
			
			++upload.tickets_count;
			if (null != upload.tickets_handle) {
				window.clearTimeout(upload.tickets_handle);
				upload.tickets_handle = null;
			upload.tickets_delta = 1000;
			}
			upload.tickets_retry_count = 0;
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
		if ('sync' == conf.mode) {
			if (null != upload.progress_handle) {
				window.clearInterval(upload.progress_handle);
				upload.progress_handle = null;
			}
			upload.progress_zero = 0;
		}
        
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
				photo_id = parseInt(rsp.getElementsByTagName('photoid')[0]
					.firstChild.nodeValue);

				// If we were ever to use sync upload, we would need imported
				// timestamps here

			}
			if (null != photos.uploading[id]) {
			    photos.uploading[id].photo_id = photo_id;
			    photos.uploaded.push(photos.uploading[id]);

			    // Add to sets
			    for each (var i in photos.uploading[id].sets) {
				    var token = users.list[photos.uploading[id].nsid].token;
				    var set = photos.sets[photos.uploading[id].nsid][i];
				    if (null == set.id) {

					    // Queue this photo if a create call hasn't returned
					    if (set.busy) { 
					        set.add.push(photo_id); 
					    }

					    // Otherwise create
					    else {
						    block_exit();
						    set.busy = true;
						    var _nsid = photos.uploading[id].nsid;
						    ++photos.sets_out;
						    flickr.photosets.create(function(rsp) {
							    var nsid = _nsid;

							    // Failure just fails and moves on
							    if ('object' != typeof rsp
								    || 'ok' != rsp.getAttribute('stat')) {
								    photos.sets_fail = true;
								    // TODO: Retry or at least deal with set.add
							    }

							    // Success needs to update sets list and other
							    // photos
							    else {
								    set.id = rsp.getElementsByTagName(
									    'photoset')[0].getAttribute('id');
								    for each (var p in set.add) {
									    wrap.photosets.addPhoto(token, set.id, p);
								    }
								    set.busy = false;

								    // If we're still the same user as is
								    // uploading, update the main sets list
								    if (users.nsid == nsid) {
									    meta.sets[i].id = set.id;
								    }

							    }

							    --photos.sets_out;
							    unblock_exit();
							    upload.finalize();
						    }, token, set.title, set.description, photo_id);
					    }
				    }

				    // Add photo to set
				    else {
					    wrap.photosets.addPhoto(token, set.id, photo_id);
				    }

			    }
            }
		} else if ('fail' == stat) {
			photos.uploading[id].progress_bar.done(false);
			if(!ui.cancel) {
			    ++photos.fail;
			    photos.failed.push(photos.uploading[id]);
			}
			if (upload.bandwidth(rsp)) { return; }
		}

		// Let extensions have their say
		extension.after_one_upload.exec(photos.uploading[id], 'ok' == stat);

		photos.uploading[id] = null;

		// For the last upload, we have some cleanup to do
		if ((upload.cancel || photos.ok + photos.fail == photos.uploading.length) &&
			0 == upload.tickets_count) {
			upload.done();
		}

		// But if this isn't last and we're doing synchronous, kick off
		// the next upload
		else if ('sync' == conf.mode) {
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
		upload.progress2(stream.available(), id);
	},
	progress2: function(available, id) {

		// Get this bit of progress
		if (id != upload.progress_id) {
			upload.progress_id = id;
			upload.progress_last = upload.progress_total;
		}
		var a = available >> 10;
		var kb = upload.progress_last - a;

		// Tell extensions how many kilobytes went by
		extension.on_upload_progress.exec(kb);

		// Have we made any progress?
		if (0 == kb) {
			++upload.progress_zero;
		}
		if (conf.timeout < conf.check * upload.progress_zero) {
			upload.timeout(id);
		}
		if (0 != upload.progress_last) {
			photos.kb.sent += kb;
		}

		upload.progress_last = a;

		// Update the UI
		if (null != photos.uploading[id]) {
		    var currentTime = new Date().getTime();
		    status.set(locale.getString('status.uploading') + ' ' + 
		        (1000 * photos.kb.sent / (currentTime-upload.startTime)).toFixed(1) + ' KB/s');
        	photos.uploading[id].progress_bar.update(1 -
				a / upload.progress_total);
		}
		var percent = Math.max(0, Math.min(1,
			photos.kb.sent / photos.kb.total));
		if (null != upload.progress_bar) {
			upload.progress_bar.update(percent);
		}
		if (100 == Math.round(100 * percent)) {
			document.getElementById('progress_text').value =
				locale.getString('upload.waiting.status');
			upload.processing = true;
		} else {
			document.getElementById('progress_text').value =
				locale.getFormattedString('upload.progress.status', [
					id + 1,
					photos.uploading.length,
					Math.round(100 * percent)
				]);
		}

	},

	// Timeout an upload after too much inactivity
	timeout: function(id) {
		if (conf.console.timeout) {
			Components.utils.reportError(new Date().toUTCString() +'UPLOAD TIMEOUT: ' + id);
		}
		window.clearInterval(upload.progress_handle);
		upload.progress_handle = null;
		upload.cancel = true;
		upload._start(upload.genErr(), id);
	},

	// Check tickets exponentially
	//   Couldn't two tokens collide here?  Wouldn't it continue to work
	//   just fine if they did?
	check_tickets: function() {
		var tickets = {};
		for (var t in upload.tickets) {
			if ('undefined' == typeof tickets[upload.tickets[t].token]) {
				tickets[upload.tickets[t].token] = [t];
			} else {
				tickets[upload.tickets[t].token].push(t);
			}
		}
		for (var token in tickets) {
			wrap.photos.upload.checkTickets(token, tickets[token]);
		}
	},
	_check_tickets: function() {
		if (60000 > upload.tickets_delta) {
			upload.tickets_delta *= 2;
		}
		if (!upload.cancel && 0 < upload.tickets_count) {
			upload.tickets_handle = window.setTimeout(function() {
				upload.check_tickets();
			}, upload.tickets_delta);
		}
	},

	// Check a response for out-of-bandwidth error
	bandwidth: function(rsp) {
		if ('object' == typeof rsp && rsp.getElementsByTagName('err')[0] &&
			6 == parseInt(rsp.getElementsByTagName('err')[0]
			.getAttribute('code'))) {
			document.getElementById('progress').style.display = 'none';
			var f = photos.failed;
			for each (var p in photos.uploading) {
				if (null != p && -1 == f.indexOf(p.path)) { f.push(p); }
			}
			var ii = f.length;
			if (0 != ii) {
				document.getElementById('photos_init')
					.style.display = 'none';
				document.getElementById('photos_new')
					.style.display = 'none';
				if (photos.sort) {
					document.getElementById('photos_sort_default')
						.style.display = 'block';
					document.getElementById('photos_sort_revert')
						.style.display = 'none';
				} else {
					document.getElementById('photos_sort_default')
						.style.display = 'none';
					document.getElementById('photos_sort_revert')
						.style.display = 'block';
				}
			}
			block_normalize();
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
            unblock_normalize();
            
			photos.uploading = [];
			photos.uploaded = [];
			photos.failed = [];
			photos.ok = 0;
			photos.fail = 0;
			upload.processing = false;
			unblock_exit();
			if (confirm(locale.getString('dialog.bandwidth.text'),
				locale.getString('dialog.bandwidth.title'),
				locale.getString('dialog.bandwidth.ok'),
				locale.getString('dialog.bandwidth.cancel'))) {
				launch_browser('http://' + SITE_HOST + '/upgrade/');
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
	    if(conf.console.upload) {
	        logStringMessage('done');
	    }
		if (null != upload.progress_handle) {
			window.clearInterval(upload.progress_handle);
			upload.progress_handle = null;
		}
		upload.progress_zero = 0;

		// Update the UI
		if (null != upload.progress_bar) {
		    upload.progress_bar.update(1);
		}
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
		var currentPathsLists = upload.try_again.map(function(x) {return (x ? x.path : "");});

		if (0 != ii) {
			for (var i  = 0; i < ii; ++i) {
			    if(currentPathsLists.indexOf(f[i].path) === -1) {
				    upload.try_again.push(f[i]);
				}
			}
		}

		// Re-add photos we didn't get to
		if (upload.cancel) {
		    currentPathsLists = upload.try_again.map(function(x) {return (x ? x.path : "");});
			for each (var p in photos.uploading) {
				if (null != p && !p.photo_id && (currentPathsLists.indexOf(p.path) === -1)) { 
				    upload.try_again.push(p); 
				}
			}

			// Add back any queued batches
			currentPathsLists = upload.try_again.map(function(x) {return (x ? x.path : "");});
			while (photos.ready.length) {
				var r = photos.ready.shift();
				ii = r.length;
				for (var i  = 0; i < ii; ++i) {
			        if(currentPathsLists.indexOf(r[i].path) === -1) {
					    upload.try_again.push(r[i]);
                    }
				}
			}

		}

		upload.finalize();
	},

	// Finally give the user feedback on their upload
	finalize: function() {
	    if(conf.console.upload) {
    	    logStringMessage('finalize');
		}
		status.clear();

		// An upload must be done before it can be finalized
		//   Uploads that are done might still have set calls outstanding
		if (!upload.cancel && photos.ok + photos.fail != photos.uploading.length
			|| upload.tickets_count || photos.sets_out) {
			return;
		}

		// An upload has completed so do extension stuff
		extension.after_upload.exec(photos.uploaded, photos.failed);

		// If there is a batch queued up, start that batch, preserving the
		// timestamps so that this looks like one big batch
		upload.processing = false;
		if (photos.ready.length) {
			buttons.upload.enable();
			photos.uploading = [];
			photos.failed = [];
			photos.uploaded = [];
			upload.stats.photos += photos.ok + photos.fail;
			upload.stats.errors += photos.fail;
			photos.ok = 0;
			photos.fail = 0;
			photos.sets_fail = false;
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
		wrap.photosets.getList(users.token, users.nsid);
		wrap.people.getUploadStatus(users.token);

		// Send stats to the site
		wrap.utils.logUploadStats(users.token,
			0 /* Source, known by API key */,
			upload.stats.photos + photos.ok + photos.fail,
			1000 * (upload.timestamps.latest - upload.timestamps.earliest),
			upload.stats.bytes + 1024 * photos.kb.total,
			upload.stats.errors + photos.fail);

		// Decide which message to show
		var go_to_flickr = false;
		var try_again = false;
		if(!ui.cancel) {
		    if (0 == photos.fail && 0 < photos.ok && !photos.sets_fail) {
			    go_to_flickr = confirm(locale.getString('upload.success.text'),
				    locale.getString('upload.success.title'),
				    locale.getString('upload.success.ok'),
				    locale.getString('upload.success.cancel'));
		    } else if (0 < photos.fail && 0 < photos.ok) {
			    var c = confirm(locale.getFormattedString(
				    'upload.error.some.text', [
					    photos.uploading.length - photos.ok,
					    photos.uploading.length
				    ]),
				    locale.getString('upload.error.some.title'),
				    locale.getString('upload.error.some.ok'),
				    locale.getString('upload.error.some.cancel'));
			    if (c) { try_again = true; }
			    else { go_to_flickr = true; }
		    } else if (0 == photos.fail && 0 < photos.ok && photos.sets_fail) {
			    go_to_flickr = confirm([
					    locale.getString('upload.error.sets.text'),
					    locale.getString('upload.error.sets.text.more')
				    ],
				    locale.getString('upload.error.sets.title'),
				    locale.getString('upload.error.sets.ok'),
				    locale.getString('upload.error.sets.cancel'));
		    } else {
			    try_again = confirm([locale.getString('upload.error.all.text'),
				    locale.getString('upload.error.all.more')],
				    locale.getString('upload.error.all.title'),
				    locale.getString('upload.error.all.ok'),
				    locale.getString('upload.error.all.cancel'));
		    }
        }
        
		// Hide the progress bar now that the user has realized we're done
		document.getElementById('progress_bar').style.width = '0';
		document.getElementById('footer').style.display = 'none';

		// If requested, open the site
		if (go_to_flickr) {
			launch_browser('http://' + SITE_HOST + '/photos/' + users.nsid);
		}

		// Really finally actually done, so reset
		buttons.upload.enable();
		photos.uploading = [];
		photos.failed = [];
		photos.uploaded = [];
		photos.ok = 0;
		photos.fail = 0;
		photos.sets_fail = false;
		photos.kb.sent = 0;
		photos.kb.total = 0;
		try {
		    threads.uploadr.shutdown();
		    }
		    catch(ex){}
		upload.progress_bar = null;
		threads.uploadr = Cc['@mozilla.org/thread-manager;1'].getService().newThread(0);
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
			var ii = upload.try_again.length;
			photos.ready = [[]];
			photos.ready_size = [0];
			for (var i = 0; i < ii; ++i) {
				photos.ready[0].push(upload.try_again[i]);
				photos.ready_size[0] += upload.try_again[i].size;
			}

			threads.worker.dispatch(new RetryUpload(true),
				threads.worker.DISPATCH_NORMAL);
		}

		// Otherwise drop the recovered photos into the current batch
		else {
		    photos.add(upload.try_again); 
		}
		upload.try_again = [];

	}

};

var Upload = function(params, id) {
	this.params = params;
	this.id = id;
}
Upload.prototype = {
	run: function() {
		if (conf.console.upload) {
			logStringMessage('UPLOAD: ' + this.params.toSource());
		}
		var esc_params = api.escape_and_sign(this.params, true);
        if (window.navigator.platform == "Win32") {
            return this.runWindows(esc_params);
		}
		try {
		    // Stream containing the entire HTTP POST payload
		    var boundary = '------deadbeef---deadbeef---' + Math.random();
		    var mstream = Cc['@mozilla.org/io/multiplex-input-stream;1']
			    .createInstance(Ci.nsIMultiplexInputStream);
		    var sstream;
		    var file = Cc['@mozilla.org/file/local;1']
					    .createInstance(Ci.nsILocalFile);
		    var indexOfFileInStream = 0;
		    for (var p in esc_params) {
			    sstream = Cc['@mozilla.org/io/string-input-stream;1']
				    .createInstance(Ci.nsIStringInputStream);
			    sstream.setData('--' + boundary +
				    '\r\nContent-Disposition: form-data; name="' + p + '"',
				    -1);
			    mstream.appendStream(sstream);
			    if ('object' == typeof esc_params[p] &&
				    null != esc_params[p]) {
				    indexOfFileInStream = mstream.count-1;
				    sstream = Cc['@mozilla.org/io/string-input-stream;1']
					    .createInstance(Ci.nsIStringInputStream);
				    sstream.setData('; filename="' + esc_params[p].filename +
					    '"\r\nContent-Type: application/octet-stream\r\n\r\n',
					    -1);
				    mstream.appendStream(sstream);
				    file.initWithPath(esc_params[p].path);
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
				    sstream.setData('\r\n\r\n' + esc_params[p] + '\r\n', -1);
				    mstream.appendStream(sstream);
			    }
		    }
		    sstream = Cc['@mozilla.org/io/string-input-stream;1']
			    .createInstance(Ci.nsIStringInputStream);
		    sstream.setData('--' + boundary + '--\r\n', -1);
		    mstream.appendStream(sstream);
		    upload.progress_total = mstream.available() >> 10;

		    // Headers!
		    sstream = Cc['@mozilla.org/io/string-input-stream;1']
			    .createInstance(Ci.nsIStringInputStream);
		    sstream.setData('POST /services/upload/ HTTP/1.1\r\n' +
			    'Host: ' + UPLOAD_HOST + '\r\n' +
			    'User-Agent: Flickr Uploadr ' + conf.version + '\r\n' +
			    'Content-Length: ' + mstream.available() + '\r\n' +
			    'Content-Type: multipart/form-data; boundary=' + boundary +
			    '\r\n\r\n', -1);
		    mstream.insertStream(sstream, 0);

		    // POST over a raw socket connection
		    //   http://www.xulplanet.com/tutorials/mozsdk/sockets.php
			var service =
				Cc['@mozilla.org/network/socket-transport-service;1']
				.getService(Ci.nsISocketTransportService);
			var transport = service.createTransport(null, 0,
				UPLOAD_HOST, 80, null);
			var ostream = transport.openOutputStream(
//				Ci.nsITransport.OPEN_BLOCKING, 0, 0);
				Ci.nsITransport.OPEN_BLOCKING, 2520, 128);
			var a = mstream.available();
			var prev = Date.now();
			var step = 500;
			var dataChunkSize = 8192;
//			var dataChunkSize = a;
			if (conf.console.upload) {
			    logStringMessage('UPLOAD: start writeFrom');
		    }
			while (!upload.cancel && a) {
			    ostream.writeFrom(mstream, Math.min(a, dataChunkSize));
			    a = mstream.available();
////				ostream.writeFrom(mstream, Math.min(a, 8192));
				threads.main.dispatch(new UploadProgressCallback(a, this.id),
				    threads.main.DISPATCH_NORMAL);
//				step = Date.now() - prev;
//				if( step > 750 ) {
//				    dataChunkSize /= 2;
//				} else if ( step < 250) {
//				    dataChunkSize *= 2;
//				}
//				prev = Date.now();
			}
			if (conf.console.upload) {
			    logStringMessage('UPLOAD: end writeFrom');
		    }
			if(upload.cancel) {
			    ostream.close();
			    threads.main.dispatch(new UploadDoneCallback(
			       upload.genErrorString, this.id), threads.main.DISPATCH_NORMAL);
			       return; // we are done
			 }
			var _istream = transport.openInputStream(0,0,0);
			var istream = Cc['@mozilla.org/scriptableinputstream;1']
				.createInstance(Ci.nsIScriptableInputStream);
			istream.init(_istream);
			var pump = Cc['@mozilla.org/network/input-stream-pump;1']
				.createInstance(Ci.nsIInputStreamPump);
			pump.init(_istream, -1, -1, 0, 0, false);
			pump.asyncRead({
				id: this.id,
				content_length: null,
				raw: '',
				onStartRequest: function(request, context) {},
				onStopRequest: function(request, context, status) {
					istream.close();
					ostream.close();
				},

				// Docs are slim so I'm not sure if this gets called only
				// once per request or perhaps multiple times
				//   The code can handle whatever
				onDataAvailable: function(request, context,
					stream, offset, count) {
					this.raw += istream.read(count);

					// If we've received all of the headers, grab the
					// content length and drop the headers
					if (!this.content_length
						&& this.raw.match(/\r?\n\r?\n/)) {
						var match = this.raw.match(
							/^Content-Length:\s*([0-9]+)$/mi);
						if (match) {
							this.content_length = match[1];
							this.raw = this.raw.split(/\r?\n\r?\n/)[1];
						}
					}

					// Nothing left to do if we don't know the length
					if (!this.content_length) { return; }

					// Also nothing more to do if there's still data coming
					if (this.raw.length != this.content_length) { return; }

					// Dispatch to the UI as soon as we have the entire
					// payload
					threads.main.dispatch(new UploadDoneCallback(
						this.raw, this.id), threads.main.DISPATCH_NORMAL);
					transport.close(0); // reason is supposed to be passed as parameter!?

				},
			}, null);
		} catch (err) {
			Components.utils.reportError(new Date().toUTCString() +err);
			threads.main.dispatch(new UploadDoneCallback(
			    upload.genErrorString, this.id), threads.main.DISPATCH_NORMAL);
		}

	},
	QueryInterface: function(iid) {
		if (iid.equals(Ci.nsIRunnable) || iid.equals(Ci.nsISupports)) {
			return this;
		}
		throw Components.results.NS_ERROR_NO_INTERFACE;
	},
	runWindows: function(esc_params) {
		try {
		    // Stream containing the entire HTTP POST payload
		    var boundary = '------deadbeef---deadbeef---' + Math.random();
		    var preload = '';
		    var file = Cc['@mozilla.org/file/local;1']
					    .createInstance(Ci.nsILocalFile);
		    var indexOfFileInStream = 0;
		    for (var p in esc_params) {
			    if ('object' == typeof esc_params[p] &&
				    null != esc_params[p]) {
				    file.initWithPath(esc_params[p].path);
			    } else {
			        preload += '--' + boundary +
				        '\r\nContent-Disposition: form-data; name="' + p + '"';
				    preload += '\r\n\r\n' + esc_params[p] + '\r\n';
			    }
		    }
		    upload.progress_total = (preload.length + file.fileSize) >> 10;
            if (conf.console.upload) {
			    logStringMessage('UPLOAD: start native upload');
		    }
		    threads.gm.cancel(upload.cancel);
            var res = threads.gm.upload(this.id, conf.version, preload, file.path, UPLOAD_HOST, boundary);
            if (conf.console.upload) {
			    logStringMessage('UPLOAD: finished native upload');
		    }
		} catch (err) {
			if(!upload.cancel) {
			    Components.utils.reportError(new Date().toUTCString() +err);
			}
			threads.main.dispatch(new UploadDoneCallback(
			    upload.genErrorString,
			     this.id), threads.main.DISPATCH_NORMAL);
		}
	}
};

var UploadProgressCallback = function(available, id) {
	this.available = available;
	this.id = id;
}
UploadProgressCallback.prototype = {
	run: function() {
	    if(!threads.main.hasPendingEvents()) { // if the thread is already doing something no need to overload it for progress
		    upload.progress2(this.available, this.id);
		}
	},
	QueryInterface: function(iid) {
		if (iid.equals(Ci.nsIRunnable) || iid.equals(Ci.nsISupports)) {
			return this;
		}
		throw Components.results.NS_ERROR_NO_INTERFACE;
	}
};

var UploadDoneCallback = function(raw, id) {
	this.raw = raw;
	this.id = id;
}
UploadDoneCallback.prototype = {
	run: function() {
		if (conf.console.upload) {
			logStringMessage('UPLOAD DONE: ' + this.raw 
				+ ' upload cancelled : ' + upload.cancel + ' ui cancel :  ' + ui.cancel);
		}
		// Try to parse the response but fail gracefully
		var rsp = upload.genErr();
		if(this.raw) {
		    try {
			    var parser = Cc['@mozilla.org/xmlextras/domparser;1']
				    .createInstance(Ci.nsIDOMParser);
			    rsp = parser.parseFromString(this.raw,
				    'text/xml').documentElement;
		    } catch (err) {
			    Components.utils.reportError(new Date().toUTCString() +err);
		    }
		}

		upload._start(rsp, this.id);
	},
	QueryInterface: function(iid) {
		if (iid.equals(Ci.nsIRunnable) || iid.equals(Ci.nsISupports)) {
			return this;
		}
		throw Components.results.NS_ERROR_NO_INTERFACE;
	}
};