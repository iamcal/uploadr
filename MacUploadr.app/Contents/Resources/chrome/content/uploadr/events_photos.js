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

		}
		// If we clicked the revert to sorted button
		else if (e.target.id && 'photos_sort_revert' == e.target.id) {
			events.photos.sort();
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
		}

	},

	// Anchor point for drag-select
	anchor: null,

	// Indicator for the state-of-the-drag
	//   0: Not dragging
	//   1: Clicking to starting drag, but maybe just clicking
	//   2: Waiting for dragging far enough
	//   3: Actually dragging
	dragging: 0,

	// Reference to our current destination
	target: null,
	left: false,

	// Make sure they mean to reorder
	far_enough: false,

	// Reference to the photos container for scroll info
	box: null,

	// Auto-scroll interval while dragging
	auto_scroll: null,

	// Update the bounding box used during drag-selection
	drag_select: function(e, pos) {
		const OFFSET_X = -events.photos.box.x - 5;
		const OFFSET_Y = -events.photos.box.y - 5;
		var ds = document.getElementById('drag_select');

		// Invert positions if necessary
		if (events.photos.anchor.x > e.clientX + pos.x.value + OFFSET_X) {
			ds.style.left = (e.clientX + pos.x.value + OFFSET_X) + 'px';
		}
		if (events.photos.anchor.y > e.clientY + pos.y.value + OFFSET_Y) {
			ds.style.top = (e.clientY + pos.y.value + OFFSET_Y) + 'px';
		}

		// New width and height
		ds.style.width = Math.abs(e.clientX + pos.x.value + OFFSET_X -
			events.photos.anchor.x) + 'px';
		ds.style.height = Math.abs(e.clientY + pos.y.value + OFFSET_Y -
			events.photos.anchor.y) + 'px';

		// Actually find photos in the box
		findr.bounding_box(events.photos.anchor.x, events.photos.anchor.y,
			e.clientX + pos.x.value + OFFSET_X, e.clientY + pos.y.value + OFFSET_Y);

	},

	// Initiate a drag
	mousedown: function(e) {
		if (null == events.photos.box) {
			events.photos.box = document.getElementById('photos').boxObject.QueryInterface(
				Ci.nsIScrollBoxObject);
		}
		var pos = {x: {}, y: {}};
		events.photos.box.getPosition(pos.x, pos.y);

		// Clicking on a single photo will do drag-reordering
		if (e.target.src) {
			if (1 < photos.count) {
				events.photos.dragging = 1;
			}
		}

		// Clicking whitespace will start the drag-select
		else if ('photos_sort_revert' != e.target.id) {
			events.photos.anchor = {
				x: e.clientX + pos.x.value - events.photos.box.x - 5,
				y: e.clientY + pos.y.value - events.photos.box.y - 5
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
		if (null == events.photos.box) {
			events.photos.box = document.getElementById('photos').boxObject.QueryInterface(
				Ci.nsIScrollBoxObject);
		}
		const OFFSET_X = -events.photos.box.x - 5;
		const OFFSET_Y = -events.photos.box.y - 5;
		var pos = {x: {}, y: {}};
		events.photos.box.getPosition(pos.x, pos.y);

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

			// Once they drag off of an image, they've dragged far enough for this to
			// be on purpose
			if (2 == events.photos.dragging && 'img' != e.target.nodeName) {
				events.photos.dragging = 3;
			}

			// As the user is dragging, update the feedback
			if (3 == events.photos.dragging) {

				// Show the cursor follower
				var follower = document.getElementById('drag_follower');
				follower.firstChild.nodeValue = photos.selected.length;
				follower.style.left = (e.clientX + pos.x.value + OFFSET_X + 10) + 'px';
				follower.style.top = (e.clientY + pos.y.value + OFFSET_Y + 7) + 'px';
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
			events.photos.drag_select(e, pos);
		}

		// If we're reaching the edge of the box and can scroll, do so
		if ((0 != events.photos.dragging || null != events.photos.anchor) &&
			(uploadr.conf.scroll > e.clientY + OFFSET_Y ||
			 uploadr.conf.scroll > events.photos.box.height - e.clientY - OFFSET_Y)) {
			if (null == events.photos.auto_scroll) {
				var clientX = e.clientX;
				var clientY = e.clientY;
				events.photos.auto_scroll = window.setInterval(function() {
					var delta = 0;
					if (uploadr.conf.scroll > clientY + OFFSET_Y) {
						delta = -uploadr.conf.scroll;
					}
					if (uploadr.conf.scroll > events.photos.box.height - clientY - OFFSET_Y) {
						delta = uploadr.conf.scroll;
					}
					var pos = {x: {}, y: {}};
					events.photos.box.getPosition(pos.x, pos.y);
					if (delta) {
						events.photos.box.scrollTo(pos.x.value, pos.y.value + delta);
					}
					events.photos.drag_select({clientX: clientX, clientY: clientY}, pos);
				}, 10);
			}
		}

		// If we've left the auto-scroll area, stop
		else {
			if (null != events.photos.auto_scroll) {
				window.clearInterval(events.photos.auto_scroll);
				events.photos.auto_scroll = null;
			}
		}

	},

	// Finish a drag
	mouseup: function(e) {

		// Stop auto-scrolling when we stop dragging, too
		if (null != events.photos.auto_scroll) {
			window.clearInterval(events.photos.auto_scroll);
			events.photos.auto_scroll = null;
		}

		// If we're reordering
		if (null == events.photos.anchor) {
			if (3 == events.photos.dragging) {

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
				photos.normalize();

				// Stop showing feedback on the cursor
				document.getElementById('drag_follower').style.display = 'none';
				if (null != events.photos.target) {
					events.photos.target.className = '';
				}

				// Show the link to revert to default order
				document.getElementById('photos_sort_default').style.display = 'none';
				document.getElementById('photos_sort_revert').style.display = 'block';
				photos.sort = false;

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
				events.photos.click(e);
			} else {
				if (1 == photos.selected.length) {
					meta.load(photos.selected[0]);
					meta.enable();
				} else {
					meta.batch();
				}
			}

		}

		events.photos.anchor = null;
	},

	// Sort the photos when asked
	sort: function() {
		buttons.disable('upload');
		threads.worker.dispatch(new Sort(), threads.worker.DISPATCH_NORMAL);
		document.getElementById('photos_sort_default').style.display = 'block';
		document.getElementById('photos_sort_revert').style.display = 'none';
		photos.sort = true;
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
	privacy: function() {
		var prefix;
		if (1 < photos.selected.length) {
			prefix = 'batch'
		} else {
			prefix = 'single';
		}
		var privacy = document.getElementById(prefix + '_privacy');
		var melons = document.getElementById(prefix + '_melons');
		var sets = document.getElementById(prefix + '_sets');
		if ('none' == privacy.style.display) {
			privacy.style.display = '-moz-box';
		} else {
			privacy.style.display = 'none';
		}
		melons.style.display = 'none';
		sets.style.display = 'none';
	},
	melons: function() {
		var prefix;
		if (1 < photos.selected.length) {
			prefix = 'batch'
		} else {
			prefix = 'single';
		}
		var privacy = document.getElementById(prefix + '_privacy');
		var melons = document.getElementById(prefix + '_melons');
		var sets = document.getElementById(prefix + '_sets');
		privacy.style.display = 'none';
		if ('none' == melons.style.display) {
			melons.style.display = '-moz-box';
		} else {
			melons.style.display = 'none';
		}
		sets.style.display = 'none';
	},
	sets: function() {
		var prefix;
		if (1 < photos.selected.length) {
			prefix = 'batch'
		} else {
			prefix = 'single';
		}
		var privacy = document.getElementById(prefix + '_privacy');
		var melons = document.getElementById(prefix + '_melons');
		var sets = document.getElementById(prefix + '_sets');
		privacy.style.display = 'none';
		melons.style.display = 'none';
		if ('none' == sets.style.display) {
			sets.style.display = '-moz-box';
		} else {
			sets.style.display = 'none';
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
	},

	// Create a new set
	create_set: function() {

		// Do we have any sets to give?
		if (-1 == users.sets || 0 < users.sets) {
			var name = prompt(locale.getString('settings.set.add'),
				locale.getString('settings.set.add.title'));
			if (!name) {
				return;
			}
			meta.created_sets.push(name);
			meta.sets[name] = name;
			var dropdowns = ['single_set', 'batch_set'];
			for each (var dropdown in dropdowns) {
				var d = document.getElementById(dropdown);
				d.removeItemAt(0);
				d.insertItemAt(0, locale.getString('settings.set.dont'), '', '');
				d.insertItemAt(1, name, name, '');
				d.selectedIndex = 1;
				d.disabled = false;
			}
		}

		// No sets remaining
		else {
			alert(locale.getString('settings.set.exhausted'),
				locale.getString('settings.set.exhausted,title'));
		}

	},

	// Add selected photos to the selected set
	add_to_set: function() {

		// Single photo or group of photos?
		var prefix = 1 == photos.selected.length ? 'single' : 'batch';

		// Get the set we're adding to
		var set = document.getElementById(prefix + '_set');
		var set_id = set.value;
		var name = set.selectedItem.label;
		if ('' == set_id) {
			return;
		}

		// Add each selected photo to this set
		var ul = document.getElementById(prefix + '_sets_list');
		var ii = photos.selected.length;
		for (var i = 0; i < ii; ++i) {
			var p = photos.list[photos.selected[i]];
			if (-1 == p.sets.indexOf(set_id)) {
				p.sets.push(set_id);
			}
		}
		set.selectedIndex = 0;

		// Add it to the list
		meta.select_set(ul, set_id, name);

	},

	// Remove selected photos from a set
	remove_from_set: function(set) {
	}

};