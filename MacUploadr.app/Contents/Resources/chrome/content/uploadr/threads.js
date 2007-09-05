var threads = {

	// Hooks to threads
	worker: null,
	main: null,

	// GraphicsMagick
	gm: null

};

// Thumbnail thread wrapper
var Thumb = function(id, thumbSize, path) {
	this.id = id;
	this.thumbSize = thumbSize;
	this.path = path;
};
Thumb.prototype = {
	run: function() {
		try {

			// Create a thumbnail and pass the result back to the UI thread
			var result = threads.gm.thumb(this.thumbSize, this.path);
			threads.main.dispatch(new ThumbCallback(this.id, result),
				threads.main.DISPATCH_NORMAL);

		} catch (err) {
			Components.utils.reportError(err);
		}
	},
	QueryInterface: function(iid) {
		if (iid.equals(Ci.nsIRunnable) || iid.equals(Ci.nsISupports)) {
			return this;
		}
		throw Components.results.NS_ERROR_NO_INTERFACE;
	}
};
var ThumbCallback = function(id, result) {
	this.id = id;
	this.result = result;
};
ThumbCallback.prototype = {
	run: function() {
		try {

			// Parse the returned string
			//   The format is <square>x<date_taken>x<width>x<height><thumb_path>
			var thumb = this.result.match(/^([0-9]+)x(.*)x([0-9]+)x([0-9]+)(.+)$/);

			// Get this photo from the DOM and remove its loading class
			var img = document.getElementById('photo' + this.id).getElementsByTagName('img')[0];
			img.style.visibility = 'hidden';
			img.className = img.className.replace('loading', '');

			// If unsuccessful, replace with the error image
			if (null == thumb) {
				img.setAttribute('src', 'chrome://uploadr/skin/error.gif');
				img.setAttribute('width', 100);
				img.setAttribute('height', 100);
				Components.utils.reportError(this.result);
			}

			// If successful, replace with the thumb and update the Photo object
			else {
				photos.list[this.id].square = thumb[1];
				photos.list[this.id].date_taken = thumb[2];
				img.setAttribute('width', thumb[3]);
				img.setAttribute('height', thumb[4]);
				img.src = 'file://' + thumb[5];

				// Check the size of this file if we're logged in
				if (users.username) {
					var size = uploadr.fsize(photos.list[this.id].path);
					if (!users.is_pro && users.bandwidth.remaining - photos.batch_size < size) {
						status.set(locale.getString('status.limit'));
					} else {
						status.clear();
					}
					photos.batch_size += size;
					free.update();
				}

			}

			// After updating, make it visible again
			img.style.visibility = 'visible';

		} catch (err) {
			Components.utils.reportError(err);
		}
	},
	QueryInterface: function(iid) {
		if (iid.equals(Ci.nsIRunnable) || iid.equals(Ci.nsISupports)) {
			return this;
		}
		throw Components.results.NS_ERROR_NO_INTERFACE;
	}
};

// Rotate thread wrapper
var Rotate = function(id, degrees, thumbSize, path) {
	this.id = id;
	this.degrees = degrees;
	this.thumbSize = thumbSize;
	this.path = path;
};
Rotate.prototype = {
	run: function() {
		try {

			// Rotate and if successful re-thumb the image
			var rotate = threads.gm.rotate(this.degrees, this.path);
			if ('ok' == rotate) {
				var result = threads.gm.thumb(this.thumbSize, this.path);
				threads.main.dispatch(new ThumbCallback(this.id, result),
					threads.main.DISPATCH_NORMAL);
			} else {
				Components.utils.reportError(rotate);
			}

		} catch (err) {
			Components.utils.reportError(err);
		}
	},
	QueryInterface: function(iid) {
		if (iid.equals(Ci.nsIRunnable) || iid.equals(Ci.nsISupports)) {
			return this;
		}
		throw Components.results.NS_ERROR_NO_INTERFACE;
	}
};

// Comparator for sorting Photo objects
var _sort = function(a, b) {
	if (null == a) {
		return false;
	} else if (null == b) {
		return true;
	} else {
		return a.date_taken > b.date_taken;
	}
};

// Sorting thread wrapper
//   The sorting all happens in the UI thread but this empty background job ensures it
//   happens after all the added photos have been processed
var Sort = function() {
};
Sort.prototype = {
	run: function() {
		try {

			// The background job is just to ensure the sort only happens after the last
			// photo has been processed - go back to the UI thread
			threads.main.dispatch(new SortCallback(), threads.main.DISPATCH_NORMAL);

		} catch (err) {
			Components.utils.reportError(err);
		}
	},
	QueryInterface: function(iid) {
		if (iid.equals(Ci.nsIRunnable) || iid.equals(Ci.nsISupports)) {
			return this;
		}
		throw Components.results.NS_ERROR_NO_INTERFACE;
	}
};
var SortCallback = function() {
};
SortCallback.prototype = {
	run: function() {

		// Perform the sort
		var p = photos.list;
		if (1 >= p.length) {
			if (1 == p.length) {
				document.getElementById('button_upload').disabled = false;
			}
			return;
		}
		p.sort(_sort);

		// Lazily do the UI refresh by appendChild'ing everything in the right order
		//   This is far from being a bottleneck, so leave it alone until it is
		var list = document.getElementById('list');
		for (var i = p.length - 1; i >= 0; --i) {
			if (null != p[i]) {
				list.appendChild(document.getElementById('photo' + p[i].id));
			}
		}

		// Transform photo IDs temporarily and note the new IDs of selected photos
		var old_selected = ',' + photos.selected.toString() + ',';
		var new_selected = [];
		var ii = p.length;
		for (var i = 0; i < ii; ++i) {
			document.getElementById('photo' + p[i].id).id = '_photo' + i;
			if (-1 != old_selected.indexOf(',' + p[i].id + ',')) {
				new_selected.push(i);
			}
			p[i].id = i;
		}

		// Transform photo IDs back to normal and update the selected list
		for (var i = 0; i < ii; ++i) {
			document.getElementById('_photo' + i).id = 'photo' + i;
		}
		photos.selected = new_selected;

		// And finally allow them to upload
		document.getElementById('button_upload').disabled = false;

	},
	QueryInterface: function(iid) {
		if (iid.equals(Ci.nsIRunnable) || iid.equals(Ci.nsISupports)) {
			return this;
		}
		throw Components.results.NS_ERROR_NO_INTERFACE;
	}
};

var Resize = function(id, square, path) {
	this.id = id;
	this.square = square;
	this.path = path;
};
Resize.prototype = {
	run: function() {
		try {

			// Resize the image and callback to the UI thread
			if ('ok' == threads.gm.resize(this.square, this.path)) {
				threads.main.dispatch(new ResizeCallback(this.id, this.square),
					threads.main.DISPATCH_NORMAL);
			}

		} catch (err) {
			Components.utils.reportError(err);
		}
	},
	QueryInterface: function(iid) {
		if (iid.equals(Ci.nsIRunnable) || iid.equals(Ci.nsISupports)) {
			return this;
		}
		throw Components.results.NS_ERROR_NO_INTERFACE;
	}
};
var ResizeCallback = function(id, square) {
	this.id = id;
	this.square = square;
};
ResizeCallback.prototype = {
	run: function() {
		try {

			// Mark this photo's new size and adjust bandwidth meter
			photos.list[this.id].square = this.square;
			var size = uploadr.fsize(photos.list[this.id].path);
			photos.batch_size -= photos.list[this.id].filesize;
			if (!users.is_pro && users.bandwidth.remaining - photos.batch_size < size) {
				status.set(locale.getString('status.limit'));
			} else {
				status.clear();
			}
			photos.batch_size += size;
			free.update();

		} catch (err) {
			Components.utils.reportError(err);
		}
	},
	QueryInterface: function(iid) {
		if (iid.equals(Ci.nsIRunnable) || iid.equals(Ci.nsISupports)) {
			return this;
		}
		throw Components.results.NS_ERROR_NO_INTERFACE;
	}
};

// We need a job to retry an upload batch after we finish resizing
var RetryUpload = function() {
};
RetryUpload.prototype = {
	run: function() {

		// As with Sort, the background job here is just for ordering
		threads.main.dispatch(new RetryUploadCallback(), threads.main.DISPATCH_NORMAL);

	},
	QueryInterface: function(iid) {
		if (iid.equals(Ci.nsIRunnable) || iid.equals(Ci.nsISupports)) {
			return this;
		}
		throw Components.results.NS_ERROR_NO_INTERFACE;
	}
};
var RetryUploadCallback = function() {
};
RetryUploadCallback.prototype = {
	run: function() {

		// Now that we've done the resizing and the background job has called back, upload
		photos.upload();

	},
	QueryInterface: function(iid) {
		if (iid.equals(Ci.nsIRunnable) || iid.equals(Ci.nsISupports)) {
			return this;
		}
		throw Components.results.NS_ERROR_NO_INTERFACE;
	}
};

// Create thread hooks and instantiate GraphicsMagick
try {
	var t = Cc['@mozilla.org/thread-manager;1'].getService();
	threads.worker = t.newThread(0);
	threads.main = t.mainThread;
	threads.gm = Cc['@flickr.com/gm;1'].createInstance(Ci.IGM);
} catch (err) {
	Components.utils.reportError(err);
}