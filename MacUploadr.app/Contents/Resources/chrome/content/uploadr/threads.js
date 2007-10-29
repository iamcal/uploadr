var threads = {

	// Hooks to threads
	worker: null,
	main: null,

	// GraphicsMagick
	gm: null

};

// Make this available to child windows like photos
window._threads = threads;

// Thumbnail thread wrapper
var Thumb = function(id, thumbSize, path, auto_select) {
	this.id = id;
	this.thumbSize = thumbSize;
	this.path = path;
	if (null == auto_select) {
		this.auto_select = false;
	} else {
		this.auto_select = auto_select;
	}
};
Thumb.prototype = {
	run: function() {
		try {

			// Create a thumbnail and pass the result back to the UI thread
			var result = threads.gm.thumb(this.thumbSize, this.path);
			threads.main.dispatch(new ThumbCallback(this.id, result, this.auto_select),
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
var ThumbCallback = function(id, result, auto_select) {
	this.id = id;
	this.result = result;
	this.auto_select = auto_select;
};
ThumbCallback.prototype = {
	run: function() {
		try {
			--photos.loading;

			// Parse the returned string
			//   <orient>###<width>###<height>###<date_taken>###<thumb_width>###<thumb_height>###<title>###<description>###<tags>###<thumb_path>
			var thumb = this.result.split('###');

			// Get this photo from the DOM and remove its loading class
			var img = document.getElementById('photo' + this.id).getElementsByTagName('img')[0];
			img.style.visibility = 'hidden';
			img.className = '';

			// If successful, replace with the thumb and update the Photo object
			if (10 == thumb.length) {
				photos.list[this.id].width = parseInt(thumb[1]);
				photos.list[this.id].height = parseInt(thumb[2]);
				photos.list[this.id].date_taken = thumb[3];
				img.src = 'file://' + thumb[9];
				img.setAttribute('width', thumb[4]);
				img.setAttribute('height', thumb[5]);
				var title = thumb[6].replace(/^\s+|\s+$/, '');
				if ('' != title) {
					photos.list[this.id].title = title;
				}
				photos.list[this.id].description = thumb[7].replace(/^\s+|\s+$/, '');
				photos.list[this.id].tags = thumb[8].replace(/^\s+|\s+$/, '');

				// Select newly added images if the user hasn't clicked
				if (meta.auto_select || this.auto_select) {
					mouse.click({
						target: img,
						ctrlKey: true,
						metaKey: true,
						shiftKey: false
					});
				}

				// If only one photo is selected, refresh the other thumbnail, too
				if (1 == photos.selected.length && !meta.first) {
					document.getElementById('meta_div').getElementsByTagName('img')[0].src =
						img.src;
				}

			}

			// If unsuccessful, replace with the error image
			else {
				img.setAttribute('src', 'chrome://uploadr/skin/logo_flickr.png');
				img.setAttribute('width', 100);
				img.setAttribute('height', 20);
				img.className = 'error';
				img.parentNode.appendChild(document.createTextNode(photos.list[this.id].filename));
				img.onclick = function() {
					this.parentNode.parentNode.removeChild(this.parentNode);
					photos.normalize();
				};
				Components.utils.reportError(this.result);
			}

			// After updating, make it visible again
			img.style.visibility = 'visible';

		} catch (err) {
			Components.utils.reportError(err);
		}
		unblock_sort();
		unblock_remove();
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
			var result = threads.gm.rotate(this.degrees, this.path);

			// Parse the returned string
			//   ok<path>
			var rotate = result.match(/^ok(.*)$/);

			if (null == rotate) {
				Components.utils.reportError(result);
			} else {
				threads.main.dispatch(new RotateCallback(this.id, rotate[1]),
					threads.main.DISPATCH_NORMAL);
				result = threads.gm.thumb(this.thumbSize, rotate[1]);
				threads.main.dispatch(new ThumbCallback(this.id, result, true),
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
var RotateCallback = function(id, path) {
	this.id = id;
	this.path = path;
};
RotateCallback.prototype = {
	run: function() {
		photos.list[this.id].path = this.path;
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

		// Allow blocking sorts during loading
		if (0 != _block_sort) {
			return;
		}

		// Perform the sort
		if (1 >= photos.list.length) {
			if (1 == photos.list.length) {
				buttons.upload.enable();
			}
			return;
		}
		var p = [];
		for each (var photo in photos.list) {
			p.push({
				id: photo.id,
				date_taken: photo.date_taken
			});
		}
		p.sort(_sort);

		// Lazily do the UI refresh by appendChild'ing everything in the right order
		//   This is far from being a bottleneck, so leave it alone until it is
		var list = document.getElementById('photos_list');
		for (var i = p.length - 1; i >= 0; --i) {
			if (null != p[i]) {
				list.appendChild(document.getElementById('photo' + p[i].id));
			}
		}
		photos.normalize();

		// And finally allow them to upload
		buttons.upload.enable();
		meta.first = false;

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
			var result = threads.gm.resize(this.square, this.path);
			threads.main.dispatch(new ResizeCallback(this.id, result),
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
var ResizeCallback = function(id, result) {
	this.id = id;
	this.result = result;
};
ResizeCallback.prototype = {
	run: function() {
		try {

			// Parse the returned string
			//   <width>x<height><path>
			var resize = this.result.match(/^([0-9]+)x([0-9]+)(.+)$/);

			if (null == resize) {
				Components.utils.reportError(result);
			} else {

				// Update photo properties
				photos.list[this.id].width = resize[1];
				photos.list[this.id].height = resize[2];
				photos.list[this.id].path = resize[3];

				// Update bandwidth
				var size = file.size(resize[3]);
				photos.batch_size -= photos.list[this.id].filesize;
				if (!users.is_pro && users.bandwidth.remaining - photos.batch_size < size) {
					status.set(locale.getString('status.limit'));
				} else {
					status.clear();
				}
				photos.batch_size += size;
				free.update();

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

// Job to enable uploads that can follow a bunch of jobs in the queue
var EnableUpload = function() {
};
EnableUpload.prototype = {
	run: function() {
		threads.main.dispatch(new EnableUploadCallback(), threads.main.DISPATCH_NORMAL);
	},
	QueryInterface: function(iid) {
		if (iid.equals(Ci.nsIRunnable) || iid.equals(Ci.nsISupports)) {
			return this;
		}
		throw Components.results.NS_ERROR_NO_INTERFACE;
	}
};
var EnableUploadCallback = function() {
};
EnableUploadCallback.prototype = {
	run: function() {
		buttons.upload.enable();
		meta.first = false;
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

// Job to force ordering of photo._add calls
//   This is a hack for dock.xul and will be replaced with AppleEvents code
var PhotoAdd = function(path, obj) {
	this.path = path;
	this.obj = obj;
};
PhotoAdd.prototype = {
	run: function() {
		threads.main.dispatch(new PhotoAddCallback(this.path, this.obj),
			threads.main.DISPATCH_NORMAL);
	},
	QueryInterface: function(iid) {
		if (iid.equals(Ci.nsIRunnable) || iid.equals(Ci.nsISupports)) {
			return this;
		}
		throw Components.results.NS_ERROR_NO_INTERFACE;
	}
};
var PhotoAddCallback = function(path, obj) {
	this.path = path;
	this.obj = obj;
};
PhotoAddCallback.prototype = {
	run: function() {
		photos._add(this.path);
		if (null != this.obj) {
			photos.list[photos.list.length - 1] = this.obj;
		}
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