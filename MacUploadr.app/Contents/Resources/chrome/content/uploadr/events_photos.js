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
				var imgs = document.getElementById('list').getElementsByTagName('img');
				var ii = imgs.length;
				for (var i = 0; i < ii; ++i) {
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
						var p = document.getElementById('photo' + i);
						if ('' == p.firstChild.className) {
							p.firstChild.className = 'selected';
							photos.selected.push(i);
						}
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
				meta.batch();
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

	// Indicator for the state-of-the-drag
	//   0: Not dragging
	//   1: Clicking to starting drag, but maybe just clicking
	//   2: Actually dragging
	dragging: 0,

	// Reference to our current destination
	target: null,
	left: false,

	// Initiate a drag
	mousedown: function(e) {

		// Clicking on a single photo will do drag-reordering
		if (e.target.src) {
/*
			if ('selected' != e.target.className) {
				var imgs = document.getElementById('list').getElementsByTagName('img');
				var ii = imgs.length;
				for (var i = 0; i < ii; ++i) {
					imgs[i].className = '';
				}
				photos.selected = [parseInt(e.target.parentNode.id.replace('photo', ''))];
			}
*/
			events.photos.dragging = 1;
		}

		// Clicking whitespace will start the drag-select
		else {
			events.photos.anchor = {
				x: e.clientX + uploadr.conf.OFFSET_X,
				y: e.clientY + uploadr.conf.OFFSET_Y
			};
			var ds = document.getElementById('drag_select');
			ds.style.left = events.photos.anchor.x + 'px';
			ds.style.top = events.photos.anchor.y + 'px';
			ds.style.width = '1px';
			ds.style.height = '1px';
			ds.style.display = 'block';
		}

	},

	// Keep dragging
	mousemove: function(e) {
		const OFFSET_X = uploadr.conf.OFFSET_X;
		const OFFSET_Y = uploadr.conf.OFFSET_Y;

		// If we're reordering
		if (null == events.photos.anchor) {

			// Once the user starts the drag, give feedback
			if (1 == events.photos.dragging) {

				// Update the selection
				if ('selected' != e.target.className) {
					events.photos.click(e);
				}

				// Make the selected photos look like they're being dragged
				for each (var id in photos.selected) {
					document.getElementById('photo' + id).getElementsByTagName(
						'img')[0].className = 'selected dragging';
				}

				events.photos.dragging = 2;
			}

			// As the user is dragging, update the feedback
			if (2 == events.photos.dragging) {

				// Show the cursor follower
				var follower = document.getElementById('drag_follower');
				follower.firstChild.nodeValue = photos.selected.length;
				follower.style.left = (e.clientX + OFFSET_X + 10) + 'px';
				follower.style.top = (e.clientY + OFFSET_Y + 7) + 'px';
				follower.style.display = 'block';

				// Get the list item we're hovering over
				var target;
				if ('li' == e.target.nodeName) {
					target = e.target;
				} else if ('img' == e.target.nodeName) {
					target = e.target.parentNode;
				} else {
					target = document.getElementById('list').lastChild;
				}

				// Which side of the list item are we on?
				var left = e.clientX < (target.offsetLeft +
					target.getElementsByTagName('img')[0].width / 2);

				// Don't place the target in the middle of a bunch of selected elements
				var list = document.getElementById('list');
				while (target != list[left ? 'firstChild' : 'lastChild']) {
					var tmp = target[left ? 'previousSibling' : 'nextSibling'];
					if (-1 == target.getElementsByTagName('img')[0].className.indexOf('selected') ||
						-1 != target.getElementsByTagName('img')[0].className.indexOf('selected') &&
						-1 == tmp.getElementsByTagName('img')[0].className.indexOf('selected')) {
						break;
					}
					target = tmp;
				}

				// Show indicator of drop position
				if (left && target != list.getElementsByTagName('li')[0]) {
					left = false;
					target = target.previousSibling;
				}
				if (null != events.photos.target && target != events.photos.target) {
					events.photos.target.className = '';
				}
				target.className = left ? 'drop_left' : 'drop_right';
				events.photos.target = target;
				events.photos.left = left;

			}

		}

		// If we're selecting
		else {
			var ds = document.getElementById('drag_select');

			// Invert positions if necessary
			if (events.photos.anchor.x > e.clientX + OFFSET_X) {
				ds.style.left = (e.clientX + OFFSET_X) + 'px';
			}
			if (events.photos.anchor.y > e.clientY + OFFSET_Y) {
				ds.style.top = (e.clientY + OFFSET_Y) + 'px';
			}

			// New width and height
			ds.style.width = Math.abs(e.clientX + OFFSET_X - events.photos.anchor.x) + 'px';
			ds.style.height = Math.abs(e.clientY + OFFSET_Y - events.photos.anchor.y) + 'px';

			// Actually find photos in the box
			findr.bounding_box(events.photos.anchor.x, events.photos.anchor.y,
				e.clientX + OFFSET_X, e.clientY + OFFSET_Y);

		}

	},

	// Finish a drag
	mouseup: function(e) {

		// If we're reordering
		if (null == events.photos.anchor) {
			if (2 == events.photos.dragging) {

				// Reorder the photo list
				photos.selected.sort(function(a, b) {
					return a < b;
				});
				var list = document.getElementById('list');
				for each (var id in photos.selected) {
					var p = document.getElementById('photo' + id);

					// Stop giving drag feedback
					p.getElementsByTagName('img')[0].className = 'selected';

					// Move this image to its new home
					if (events.photos.left) {
						list.insertBefore(p, events.photos.target);
					} else {
						if (events.photos.target == list.lastChild) {
							list.appendChild(p);
						} else {
							list.insertBefore(p, events.photos.target.nextSibling);
						}
					}

				}
				photos.update();

				// Stop showing feedback on the cursor
				document.getElementById('drag_follower').style.display = 'none';
				if (null != events.photos.target) {
					events.photos.target.className = '';
				}

			}
			events.photos.dragging = 0;
			events.photos.target = null;
			events.photos.left = false;
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
					meta.batch();
				}
				document.getElementById('t_remove').className = 'enabled';
				document.getElementById('t_rotate_l').className = 'enabled';
				document.getElementById('t_rotate_r').className = 'enabled';
			}

		}

		events.photos.anchor = null;
	},

	// Properly enable/disable the checkboxes available for private photos to be shared with
	// friends and/or family
	is_public: function(value) {
		if (1 == parseInt(value)) {
			document.getElementById('single_is_friend').checked = false;
			document.getElementById('single_is_family').checked = false;
			document.getElementById('single_is_friend').disabled = true;
			document.getElementById('single_is_family').disabled = true;
		} else {
			document.getElementById('single_is_friend').disabled = false;
			document.getElementById('single_is_family').disabled = false;
		}
	},
	batch_is_public: function(value) {
		if (1 == parseInt(value)) {
			document.getElementById('batch_is_friend').checked = false;
			document.getElementById('batch_is_family').checked = false;
			document.getElementById('batch_is_friend').disabled = true;
			document.getElementById('batch_is_family').disabled = true;
		} else {
			document.getElementById('batch_is_friend').disabled = false;
			document.getElementById('batch_is_family').disabled = false;
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
	},
	privacy: function() {
		var prefix = '';
		if (1 < photos.selected.length) {
			prefix = 'batch_'
		}
		var privacy = document.getElementById(prefix + 'meta_privacy');
		var melons = document.getElementById(prefix + 'meta_melons');
		melons.style.display = 'none';
		if ('none' == privacy.style.display) {
			privacy.style.display = '-moz-box';
		} else {
			privacy.style.display = 'none';
		}
	},
	melons: function() {
		var prefix = '';
		if (1 < photos.selected.length) {
			prefix = 'batch_'
		}
		var privacy = document.getElementById(prefix + 'meta_privacy');
		var melons = document.getElementById(prefix + 'meta_melons');
		privacy.style.display = 'none';
		if ('none' == melons.style.display) {
			melons.style.display = '-moz-box';
		} else {
			melons.style.display = 'none';
		}
	},

	// Track whether a partial batch was changed
	batch_is_public_change: function() {
		document.getElementById('batch_is_public_unchanged').checked = false;
	},
	batch_content_type_change: function() {
		document.getElementById('batch_content_type_unchanged').checked = false;
	},
	batch_hidden_change: function() {
		document.getElementById('batch_hidden_unchanged').checked = false;
	},
	batch_safety_level_change: function() {
		document.getElementById('batch_safety_level_unchanged').checked = false;
	}

};