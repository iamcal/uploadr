var photos = {

	// Storage
	list: [],
	count: 0,
	selected: [],
	last: null,
	unsaved: false,
	sort: true,

	// Batch size limiting
	batch_size: 0,
	reached_limit: false,

	// Upload tracking
	uploading: [],
	current: 0,
	uploaded: [],
	add_to_set: [],
	failed: [],
	total: 0,
	ok: 0,
	fail: 0,

	// Let the user select some files, thumbnail them and track them
	add: function() {
		document.getElementById('button_upload').disabled = true;
		var fp = Cc['@mozilla.org/filepicker;1'].createInstance(Ci.nsIFilePicker);
		fp.init(window, locale.getString('dialog.add'),
			Ci.nsIFilePicker.modeOpenMultiple);
		fp.appendFilters(Ci.nsIFilePicker.filterImages);
		var res = fp.show();
		if (Ci.nsIFilePicker.returnOK == res) {
			var files = fp.files;
			while (files.hasMoreElements()) {
				photos._add(files.getNext().QueryInterface(Ci.nsILocalFile).path);
			}

			// After the last file is added, sort the images by date taken if we're sorting
			if (photos.sort) {
				threads.worker.dispatch(new Sort(), threads.worker.DISPATCH_NORMAL);
			}

		} else if (photos.count) {
			document.getElementById('button_upload').disabled = false;
		}
	},
	_add: function(path) {

		// Add the original image to the list and set our status
		var id = photos.list.length;
		photos.list.push(new Photo(id, path));
		++photos.count;
		photos.unsaved = true;

		// Create a spot for the image, leaving a spinning placeholder
		//   Add images to the start of the list because this is our best guess for ordering
		//   newest to oldest
		var img = document.createElementNS(NS_HTML, 'img');
		img.className = 'loading';
		img.setAttribute('width', 32);
		img.setAttribute('height', 32);
		img.src = 'chrome://uploadr/skin/loading.gif';
		var li = document.createElementNS(NS_HTML, 'li');
		li.id = 'photo' + id;
		li.appendChild(img);
		var list = document.getElementById('list');
		list.insertBefore(li, list.firstChild);

		// Create and show the thumbnail
		threads.worker.dispatch(new Thumb(id, uploadr.conf.thumbSize, path),
			threads.worker.DISPATCH_NORMAL);

	},

	// Rotate selected files
	rotate: function(degrees) {

		// Prevent silliness
		var s = photos.selected;
		var ii = s.length;
		if (0 == ii) {
			return;
		}
		if (1 < ii && !confirm(locale.getString('rotate.confirm'),
			locale.getString('rotate.confirm.title'))) {
			return;
		}

		// For each selected image, show the loading spinner and dispatch the rotate job
		document.getElementById('button_upload').disabled = true;
		for (var i = 0; i < ii; ++i) {
			var p = photos.list[s[i]];
			var img = document.getElementById('photo' + p.id).getElementsByTagName('img')[0];
			img.className += ' loading';
			img.setAttribute('width', 32);
			img.setAttribute('height', 32);
			img.src = 'chrome://uploadr/skin/loading.gif';
			threads.worker.dispatch(new Rotate(p.id, degrees, uploadr.conf.thumbSize,
				p.path), threads.worker.DISPATCH_NORMAL);
		}
		threads.worker.dispatch(new EnableUpload(), threads.worker.DISPATCH_NORMAL);

	},

	// Upload photos
	upload: function() {

Components.utils.reportError(photos.list.toSource());

		// If any photos need resizing to fit in the per-photo size limits, dispatch the
		// jobs and wait
		var resizing = false;
		for each (var p in photos.list) {
			if (null != p) {
				if (null != settings.resize && -1 != settings.resize &&
					(p.width > settings.resize || p.width > settings.resize)) {
					resizing = true;
					threads.worker.dispatch(new Resize(p.id, settings.resize, p.path),
						threads.worker.DISPATCH_NORMAL);
				} else if (uploadr.fsize(p.path) > users.filesize) {
					resizing = true;
					threads.worker.dispatch(new Resize(p.id, -1, p.path),
						threads.worker.DISPATCH_NORMAL);
				}
			}
		}
		if (resizing) {
			threads.worker.dispatch(new RetryUpload(), threads.worker.DISPATCH_NORMAL);
			return;
		}

		// Decide if we're already in the midst of an upload
		var not_started = 0 == photos.uploading.length;

		// Take the list of photos into upload mode and reset the UI
		for each (var p in photos.list) {
			photos.uploading.push(p);
		}
		photos.list = [];
		photos.count = 0;
		document.getElementById('button_upload').disabled = true;
		photos.selected = [];
		photos.last = null;
		photos.unsaved = false;
		var list = document.getElementById('list');
		while (list.hasChildNodes()) {
			list.removeChild(list.firstChild);
		}

		// Find out how many photos we actually have
		photos.total = 0;
		var ii = photos.uploading.length;
		for (var i = 0; i < ii; ++i) {
			if (null != photos.uploading[i]) {
				++photos.total;
			}
		}

		// Update the UI
		status.set(locale.getString('status.uploading'));

		// Kick off the first batch job if we haven't started
		if (not_started) {
			for (var i = 0; i < ii; ++i) {
				if (null != photos.uploading[i]) {
					upload(i);
					break;
				}
			}
		}

	},

	// Normalize the photo list and selected list with the DOM
	normalize: function() {
		var list = document.getElementById('list').getElementsByTagName('li');
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

	}

};

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
	this.width = 0;
	this.height = 0;
	this.title = '';
	this.description = '';
	this.tags = '';
	this.is_public = settings.is_public;
	this.is_friend = settings.is_friend;
	this.is_family = settings.is_family;
	this.content_type = settings.content_type;
	this.safety_level = settings.safety_level;
	this.hidden = settings.hidden;
	this.resize = settings.resize;
};