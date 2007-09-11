events.photos = {

	// Event handler for clicking anywhere in the photos pane
	click: function(e) {

		// Save old metadata
		if (1 == photos.selected.length) {
			meta.save(photos.selected[0]);
		} else if (1 < photos.selected.length) {
			meta.abandon();
		}
	
		// If we clicked on an image
		if (e.target.src) {
			var img = e.target;
	
			// Figure out what photos should be in photos.selected

			// Without modifier keys, start with nothing selected
			if (!(e.shiftKey || e.ctrlKey || e.metaKey)) {
				var imgs = document.getElementsByTagName('img');
				var u_bound = imgs.length;
				for (var i = 0; i < u_bound; ++i) {
					imgs[i].className = '';
				}
				photos.selected = [];
			}

			// Get the ID of the photo clicked
			var id = parseInt(img.parentNode.id.replace('photo', ''));

			// If shift is held, select every image between the image clicked and the image
			// last clicked
			if (null != photos.last && e.shiftKey) {
				var inc = id < photos.last ? 1 : -1;
				for (var i = id; i != photos.last; i += inc) {
					try {
						document.getElementById('photo' + i).firstChild.className = 'selected';
						photos.selected.push(i);
					} catch (err) {}
				}
			}

			// If ctrl or command is held, select or deselect this without changing others
			else if (e.ctrlKey || e.metaKey) {
				if ('' == img.className) {
					img.className = 'selected';
					photos.selected.push(id);
				} else {
					img.className = '';
					var tmp = photos.selected;
					photos.selected = [];
					var ii = tmp.length;
					for (var i = 0; i < ii; ++i) {
						if (tmp[i] != id) {
							photos.selected.push(tmp[i]);
						}
					}
				}
			}

			// If this was just plain clicked, select it
			else {
				img.className = 'selected';
				photos.selected = [id];
			}

			// Save the image last clicked
			photos.last = id;
	
			// Update the metadata pane
			if (1 == photos.selected.length) {
				meta.load(photos.selected[0]);
				meta.enable();
			} else {
				meta.partial();
			}

			// Enable toolbar buttons for selected images
			document.getElementById('t_remove').className = 'enabled';
			document.getElementById('t_rotate_l').className = 'enabled';
			document.getElementById('t_rotate_r').className = 'enabled';
	
		}
	
		// If we clicked on whitespace, hide the thumbnail and metadata, and disable buttons
		else {
			photos.selected = [];
			var imgs = document.getElementsByTagName('img');
			var ii = imgs.length;
			for (var i = 0; i < ii; ++i) {
				imgs[i].className = '';
			}
			var meta_div = document.getElementById('meta_div');
			while (meta_div.hasChildNodes()) {
				meta_div.removeChild(meta_div.firstChild);
			}
			meta.disable();
			document.getElementById('t_remove').className = 'disabled';
			document.getElementById('t_rotate_l').className = 'disabled';
			document.getElementById('t_rotate_r').className = 'disabled';
		}

	},

	// Anchor point for drag-select
	anchor: null,

	// Constants to align box and cursor
	OFFSET_X: -5,
	OFFSET_Y: -72,

	// Initiate a drag
	mousedown: function(e) {

		// Clicking on a single photo will do drag-reordering
		if (e.target.src) {
		}

		// Clicking whitespace will start the drag-select
		else {
			events.anchor = {
				x: e.clientX + events.photos.OFFSET_X,
				y: e.clientY + events.photos.OFFSET_Y
			};
			var ds = document.getElementById('drag_select');
			ds.style.left = events.anchor.x + 'px';
			ds.style.top = events.anchor.y + 'px';
			ds.style.width = '1px';
			ds.style.height = '1px';
			ds.style.display = 'block';
		}

	},

	// Keep dragging
	mousemove: function(e) {

		// If we're reordering
		if (null == events.anchor) {
		}

		// If we're selecting
		else {
			const OFFSET_X = events.photos.OFFSET_X;
			const OFFSET_Y = events.photos.OFFSET_Y;
			var ds = document.getElementById('drag_select');

			// Invert positions if necessary
			if (events.anchor.x > e.clientX + OFFSET_X) {
				ds.style.left = (e.clientX + OFFSET_X) + 'px';
			}
			if (events.anchor.y > e.clientY + OFFSET_Y) {
				ds.style.top = (e.clientY + OFFSET_Y) + 'px';
			}

			// New width and height
			ds.style.width = Math.abs(e.clientX + OFFSET_X - events.anchor.x) + 'px';
			ds.style.height = Math.abs(e.clientY + OFFSET_Y - events.anchor.y) + 'px';

			// Actually find photos in the box
			findr.bounding_box(events.anchor.x, events.anchor.y,
				e.clientX + OFFSET_X, e.clientY + OFFSET_Y);

		}

	},

	// Finish a drag
	mouseup: function(e) {

		// If we're reordering
		if (null == events.anchor) {
		}

		// If we're selecting, finalize the selection
		else {

			// Kill the bounding box
			var ds = document.getElementById('drag_select');
			ds.style.width = '1px';
			ds.style.height = '1px';
			ds.style.display = 'none';

			// Save old metadata
			if (1 == photos.selected.length) {
				meta.save(photos.selected[0]);
			} else if (1 < photos.selected.length) {
				meta.abandon();
			}

			// Find new selection
			var p = photos.list;
			photos.selected = [];
			for (var i = p.length; i >= 0; --i) {
				if (null != p[i]) {
					var img = document.getElementById('photo' + i).getElementsByTagName('img')[0];
					if ('selecting' == img.className) {
						img.className = 'selected';
						photos.selected.push(i);
					} else {
						img.className = '';
					}
				}
			}
			if (0 == photos.selected.length) {
				events.photos.click({target: {}});
			} else {
				if (1 == photos.selected.length) {
					meta.load(photos.selected[0]);
					meta.enable();
				} else {
					meta.partial();
				}
				document.getElementById('t_remove').className = 'enabled';
				document.getElementById('t_rotate_l').className = 'enabled';
				document.getElementById('t_rotate_r').className = 'enabled';
			}

		}

		events.anchor = null;
	},

	// Properly enable/disable the checkboxes available for private photos to be shared with
	// friends and/or family
	is_public: function(value) {
		if (1 == parseInt(value)) {
			document.getElementById('p_is_friend').checked = false;
			document.getElementById('p_is_family').checked = false;
			document.getElementById('p_is_friend').disabled = true;
			document.getElementById('p_is_family').disabled = true;
		} else {
			document.getElementById('p_is_friend').disabled = false;
			document.getElementById('p_is_family').disabled = false;
		}
	},

	// Display the other metadata fields
	toggle: function() {
		var primary = document.getElementById('meta_primary');
		var secondary = document.getElementById('meta_secondary');
		if ('none' == primary.style.display) {
			primary.style.display = '-moz-box';
			secondary.style.display = 'none';
		} else {
			primary.style.display = 'none';
			secondary.style.display = '-moz-box';
		}
	}

};