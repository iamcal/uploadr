/*
 * Flickr Uploadr
 *
 * Copyright (c) 2007 Yahoo! Inc.  All rights reserved.  This library is free
 * software; you can redistribute it and/or modify it under the terms of the
 * GNU General Public License (GPL), version 2 only.  This library is
 * distributed WITHOUT ANY WARRANTY, whether express or implied. See the GNU
 * GPL for more details (http://www.gnu.org/licenses/gpl.html)
 */

var photos = {

	// Storage
	list: [],
	count: 0,
	selected: [],
	last: null,
	unsaved: false,
	sort: true,
	batch_size: 0,

	// Number of photos that are loading
	loading: 0,

	// Upload tracking
	uploading: [],
	current: 0,
	uploaded: [],
	add_to_set: [],
	failed: [],
	ok: 0,
	fail: 0,
	sets: true,
	kb: {
		sent: 0,
		total: 0,
	},

	// Queue batches of photos
	ready: [],
	ready_size: [],

	// Let the user select some files, thumbnail them and track them
	add: function() {
		buttons.upload.disable();

		var fp = Cc['@mozilla.org/filepicker;1'].createInstance(Ci.nsIFilePicker);
		fp.init(window, locale.getString('dialog.add'),
			Ci.nsIFilePicker.modeOpenMultiple);
		fp.appendFilters(Ci.nsIFilePicker.filterImages);
		fp.appendFilter('TIFF', 'tiff; TIFF; tif; TIF');
		var res = fp.show();
		if (Ci.nsIFilePicker.returnOK == res) {
			var files = fp.files;
			while (files.hasMoreElements()) {
				var arg = files.getNext().QueryInterface(Ci.nsILocalFile).path;
				if (photos.is_photo(arg)) {
					photos._add(arg);
				}
			}

			// After the last file is added, sort the images by date taken if we're sorting
			if (photos.sort) {
				threads.worker.dispatch(new Sort(), threads.worker.DISPATCH_NORMAL);
				document.getElementById('photos_sort_default').style.display = 'block';
				document.getElementById('photos_sort_revert').style.display = 'none';
			} else {
				threads.worker.dispatch(new EnableUpload(), threads.worker.DISPATCH_NORMAL);
				document.getElementById('photos_sort_default').style.display = 'none';
				document.getElementById('photos_sort_revert').style.display = 'block';
			}

		} else if (photos.count) {
			buttons.upload.enable();
		}
		if (photos.count) {
			document.getElementById('photos_stack').style.visibility = 'visible';
			document.getElementById('photos_init').style.display = 'none';
			document.getElementById('photos_new').style.display = 'none';
			document.getElementById('no_meta_prompt').style.visibility = 'visible';
			mouse.show_photos();
		}
	},
	_add: function(path) {
		block_remove();
		block_sort();

		// Add the original image to the list and set our status
		var id = photos.list.length;
		photos.list.push(new Photo(id, path));
		++photos.count;
		++photos.loading;
		photos.unsaved = true;

		// Create a spot for the image, leaving a spinning placeholder
		//   Add images to the start of the list because this is our best guess for ordering
		//   newest to oldest
		var img = document.createElementNS(NS_HTML, 'img');
		img.className = 'loading';
		img.setAttribute('width', 16);
		img.setAttribute('height', 8);
		img.src = 'chrome://uploadr/skin/balls-16x8-trans.gif';
		var li = document.createElementNS(NS_HTML, 'li');
		li.id = 'photo' + id;
		li.appendChild(img);
		var list = document.getElementById('photos_list');
		list.insertBefore(li, list.firstChild);

		// Create and show the thumbnail
		threads.worker.dispatch(new Thumb(id, uploadr.conf.thumbSize, escape_utf8(path, false)),
			threads.worker.DISPATCH_NORMAL);

		// Check the size of this file if we're logged in
		photos.list[id].size = file.size(photos.list[id].path);
		photos.batch_size += photos.list[id].size;
		free.update();

	},

	// Remove selected photos
	remove: function() {

		// Respect the remove block
		if (0 < _block_remove) {
			return;
		}

		// Nothing to do if somehow there are no selected photos
		var ii = photos.selected.length;
		if (0 == ii) {
			return;
		}

		// Remove selected photos
		for (var i = 0; i < ii; ++i) {
			var id = photos.selected[i];
			var li = document.getElementById('photo' + id);
			li.parentNode.removeChild(li);

			// Free the size of this file
			var size = file.size(photos.list[id].path);
			photos.batch_size -= size;
			if (users.username && !users.is_pro) {
				if (users.bandwidth.remaining - photos.batch_size) {
					status.clear();
				}
			}

			photos.list[id] = null;
			--photos.count;
			photos.unsaved = true;
		}
		free.update();
		photos.normalize();
		meta.disable();

		// Clear the selection
		photos.selected = [];
		mouse.click({target: {}});

		// Allow upload only if there are photos
		if (photos.count) {
			buttons.upload.enable();
		} else {
			photos.unsaved = false;
			photos.sort = true;
			buttons.upload.disable();
			document.getElementById('photos_sort_default').style.display = 'none';
			document.getElementById('photos_sort_revert').style.display = 'none';
			document.getElementById('photos_init').style.display = '-moz-box';
			document.getElementById('no_meta_prompt').style.visibility = 'hidden';
		}

	},

	// Rotate selected files
	rotate: function(degrees) {

		// Prevent silliness
		var s = photos.selected;
		var ii = s.length;
		if (0 == ii) {
			return;
		}
		photos.selected = [];

		// For each selected image, show the loading spinner and dispatch the rotate job
		buttons.upload.disable();
		for (var i = 0; i < ii; ++i) {
			block_sort();
			var p = photos.list[s[i]];
			photos.batch_size -= file.size(p.path);
			var img = document.getElementById('photo' + p.id).getElementsByTagName('img')[0];
			img.className = 'loading';
			img.setAttribute('width', 16);
			img.setAttribute('height', 8);
			img.src = 'chrome://uploadr/skin/balls-16x8-trans.gif';
			threads.worker.dispatch(new Rotate(p.id, degrees, uploadr.conf.thumbSize,
				escape_utf8(p.path, false)), threads.worker.DISPATCH_NORMAL);
		}
		threads.worker.dispatch(new EnableUpload(), threads.worker.DISPATCH_NORMAL);

	},

	// Upload photos
	//   The arguments will either both be null or both be set
	//   If they're both set, this is an automated call to upload by the queue
	upload: function(list, size) {
		var from_user = null == list;
		if (from_user) {
			list = photos.list;
		}

		// Don't upload if the button is disabled
		if ('disabled_button' == document.getElementById('button_upload').className) {
			return;
		}

		// Remove error indicators
		var li = document.getElementById('photos_list').getElementsByTagName('li');
		var ii = li.length;
		for (var i = 0; i < ii; ++i) {
			var img = li[i].getElementsByTagName('img')[0];
			if ('error' == img.className) {
				img.onclick();
			}
		}

		// If any photos need resizing to fit in the per-photo size limits,
		// dispatch the jobs and wait
		if (from_user && !upload.processing || !from_user) {
			var resizing = false;
			for each (var p in list) {
				if (null != p) {
					if (null != settings.resize && -1 != settings.resize &&
						(p.width > settings.resize || p.width > settings.resize)) {
						resizing = true;
						threads.worker.dispatch(new Resize(p.id, settings.resize,
							escape_utf8(p.path, false)), threads.worker.DISPATCH_NORMAL);
					} else if (file.size(p.path) > users.filesize) {
						resizing = true;
						threads.worker.dispatch(new Resize(p.id, -1, escape_utf8(p.path, false)),
							threads.worker.DISPATCH_NORMAL);
					}
				}
			}
			if (resizing) {
				threads.worker.dispatch(new RetryUpload(), threads.worker.DISPATCH_NORMAL);
				return;
			}
		}

		// Update the UI
		if (from_user) {
			status.set(locale.getString('status.uploading'));
			buttons.upload.disable();
			document.getElementById('photos_sort_default').style.display = 'none';
			document.getElementById('photos_sort_revert').style.display = 'none';
			document.getElementById('photos_stack').style.visibility = 'hidden';
			document.getElementById('photos_init').style.display = 'none';
			document.getElementById('photos_new').style.display = '-moz-box';
			document.getElementById('no_meta_prompt').style.visibility = 'hidden';
			meta.disable();
		}

		// Decide if we're already in the midst of an upload
		var not_started = 0 == photos.uploading.length;

		// Take the list of photos into upload mode and reset the UI
		var r = [];
		for each (var p in list) {

			// If we have to queue this batch
			if (from_user && upload.processing) {
				r.push(p);
			}

			// If we can upload immediately
			else {
				photos.uploading.push(p);

				// Setup progress bar for this photo and show it in the queue
				var old = document.getElementById('photo' + p.id).getElementsByTagName('img')[0];
				var img = document.createElementNS(NS_HTML, 'img');
				img.src = old.src;
				img.width = old.width;
				img.height = old.height;
				var stack = document.createElement('stack');
				stack.appendChild(img);
				p.progress_bar = new ProgressBar('queue' + (photos.uploading.length - 1), img.width);
				var bar = p.progress_bar.create();
				bar.style.top = (img.height - 20) + 'px';
				stack.appendChild(bar);
				var li = document.createElementNS(NS_HTML, 'li');
				li.appendChild(stack);
				document.getElementById('queue_list').appendChild(li);

			}

		}
		if (from_user && upload.processing) {
			photos.ready.push(r);
			photos.ready_size.push(photos.batch_size);
		} else {
			if (from_user) {
				photos.kb.total += photos.batch_size;
		 	} else {
				photos.kb.total += size;
			}
		}
		if (from_user) {
			photos.batch_size = 0;
			photos.list = [];
			photos.count = 0;
			photos.selected = [];
			photos.last = null;
			photos.unsaved = false;
			var list = document.getElementById('photos_list');
			while (list.hasChildNodes()) {
				list.removeChild(list.firstChild);
			}
			free.update();
		}

		// Kick off the first batch job if we haven't started
		if (not_started && !upload.processing) {
			for (var i = 0; i < ii; ++i) {
				if (null != photos.uploading[i]) {
					block_exit();
					upload.start(i);
					break;
				}
			}
		}

	},

	// Normalize the photo list and selected list with the DOM
	normalize: function() {
		var list = document.getElementById('photos_list').getElementsByTagName('li');
		var old_list = photos.list;
		photos.list = [];
		photos.selected = [];
		for (var i = list.length - 1; i >= 0; --i) {
			var old_id = parseInt(list[i].id.replace('photo', ''));
			var new_id = photos.list.length;

			// Move the photo info
			list[i].id = 'photo' + new_id;
			photos.list.push(old_list[old_id]);
			photos.list[new_id].id = new_id;

			// Update selection
			if ('selected' == list[i].getElementsByTagName('img')[0].className) {
				photos.selected.push(new_id);
			}

		}

	},

	// Load saved metadata
	load: function() {
		var obj = file.read('photos.json');

		// Don't bother if there are no photos
		if ('undefined' == typeof obj.list) {
			return;
		}

		// Add the previous batch of photos
		var list = obj.list;
		var ii = list.length;
		if (ii) {
			document.getElementById('photos_stack').style.visibility = 'visible';
			document.getElementById('photos_init').style.display = 'none';
			document.getElementById('photos_new').style.display = 'none';
			document.getElementById('no_meta_prompt').style.visibility = 'visible';
		}
		for (var i  = 0; i < ii; ++i) {
			photos._add(list[i].path);
			photos.list[photos.list.length - 1] = list[i];
		}

		// Sort photos based on previous sort setting
		if (list.length) {
			photos.sort = obj.sort;
			var cl = window.arguments[0].QueryInterface(Ci.nsICommandLine);
			if (0 == cl.length) {
				if (photos.sort) {
					threads.worker.dispatch(new Sort(), threads.worker.DISPATCH_NORMAL);
					document.getElementById('photos_sort_default').style.display = 'block';
					document.getElementById('photos_sort_revert').style.display = 'none';
				} else {
					threads.worker.dispatch(new EnableUpload(), threads.worker.DISPATCH_NORMAL);
					document.getElementById('photos_sort_default').style.display = 'none';
					document.getElementById('photos_sort_revert').style.display = 'block';
				}
			}
		}

		// Bring in old sets that were created locally but not on the site
		for each (var name in obj.sets) {
			meta.created_sets.push(name);
			meta.sets[name] = name;
		}
		for each (var desc in obj.sets_desc) {
			meta.created_sets_desc.push(desc);
		}

	},

	// Save all metadata to disk
	save: function() {
		if (0 != _block_exit) {
			return;
		}
		if (1 == photos.selected.length) {
			meta.save(photos.selected[0]);
		} else if (1 < photos.selected.length) {
			meta.save();
		}
		if (0 == photos.count) {
			meta.created_sets = [];
			meta.created_sets_desc = [];
		}
		file.write('photos.json', {
			sort: photos.sort,
			sets: meta.created_sets,
			sets_desc: meta.created_sets_desc,
			list: photos.list
		});
	},

	// Decide if a given path is a photo
	is_photo: function(path) {
		return /(jpe?g|tiff?|gif|png|bmp)$/i.test(path);
	}

};

// Setup auto-saving of metadata in case of crashes
window.setInterval(function() {
	photos.save();
}, 1000 * uploadr.conf.auto_save);

// Make the photos object visible to child windows
//   This makes drag-to-dock possible
window._photos = photos;

// Photo properties
var Photo = function(id, path) {
	this.id = id;
	this.date_taken = '';
	this.path = path;
	var filename = path.match(/([^\/\\]*)$/);
	if (null == filename) {
		this.filename = '';
	} else {
		this.filename = filename[1];
	}
	this.size = 0; // Kilobytes
	this.width = 0;
	this.height = 0;
	this.title = '';
	this.description = '';
//	this.description = decodeURI('C28E: %C2%8E, C3A9: %C3%A9');
	this.tags = '';
	this.is_public = settings.is_public;
	this.is_friend = settings.is_friend;
	this.is_family = settings.is_family;
	this.content_type = settings.content_type;
	this.safety_level = settings.safety_level;
	this.hidden = settings.hidden;
	this.sets = [];
	this.progress_bar = null;
};