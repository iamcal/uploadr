/*
 * Flickr Uploadr
 *
 * Copyright (c) 2007-2008 Yahoo! Inc.  All rights reserved.  This library is
 * free software; you can redistribute it and/or modify it under the terms of
 * the GNU General Public License (GPL), version 2 only.  This library is
 * distributed WITHOUT ANY WARRANTY, whether express or implied. See the GNU
 * GPL for more details (http://www.gnu.org/licenses/gpl.html)
 */

var mouse = {

	// Event handler for clicking anywhere in the photos pane
	click: function(e) {

		// If there are no photos, there's nothing to do
		if (0 == photos.count) {
			return;
		}

		// Resolve clicks on the video icon to the thumbnail
		e = mouse.resolve(e);

		// Save old metadata
		if (1 == photos.selected.length) {
			meta.save(photos.selected[0]);
		} else if (1 < photos.selected.length) {
			meta.abandon();
		}

		// If we clicked on an image that isn't an error and isn't loading
		if (e.target.src && 'error' != e.target.className
			&& 'loading' != e.target.className) {
			var img = e.target;

			// Without modifier keys, start with nothing selected
			if (!(e.shiftKey || e.ctrlKey || e.metaKey)) {
				var imgs = document.getElementById('photos_list')
					.getElementsByTagName('img');
				var ii = imgs.length;
				for (var i = 0; i < ii; ++i) {
					if ('error' != imgs[i].className
						&& 'loading' != imgs[i].className) {
						imgs[i].className = '';
					}
				}
				photos.selected = [];
			}

			// Get the ID of the photo clicked
			var id = parseInt(img.parentNode.id.replace('photo', ''));

			// If shift is held, select every image between the image 
			// clicked and the image last clicked
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

			// If ctrl or command is held, select or deselect this without
			// changing others
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
			buttons.upload.disable();
			block_normalize();
			threads.worker.dispatch(new Sort(),
				threads.worker.DISPATCH_NORMAL);
			document.getElementById('photos_sort_default')
				.style.display = 'block';
			document.getElementById('photos_sort_revert')
				.style.display = 'none';
			photos.sort = true;
		}
		
		// If we clicked on an error or a spinner, do nothing
		else if ('error' == e.target.className
			|| 'loading' == e.target.className) {}

		// If we clicked on whitespace, hide the thumbnail and metadata,
		// and disable buttons
		else {
			photos.selected = [];
			var imgs = document.getElementsByTagName('img');
			var ii = imgs.length;
			for (var i = 0; i < ii; ++i) {
				if ('error' != imgs[i].className
					&& 'loading' != imgs[i].className) {
					imgs[i].className = '';
				}
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
		const OFFSET_X = -mouse.box.x - grid.base.x;
		const OFFSET_Y = -mouse.box.y - grid.base.y;
		var ds = document.getElementById('drag_select');

		// Invert positions if necessary
		if (mouse.anchor.x > e.clientX + pos.x.value + OFFSET_X) {
			ds.style.left = (e.clientX + pos.x.value + OFFSET_X) + 'px';
		}
		if (mouse.anchor.y > e.clientY + pos.y.value + OFFSET_Y) {
			ds.style.top = (e.clientY + pos.y.value + OFFSET_Y) + 'px';
		}

		// New width and height
		var width;
		if (mouse.box.width - 2 * conf.scrollbar_width <
			e.clientX + pos.x.value + OFFSET_X) {
			width = mouse.box.width - 2 * conf.scrollbar_width -
				mouse.anchor.x;
		} else {
			width = Math.abs(e.clientX + pos.x.value + OFFSET_X -
				mouse.anchor.x);
		}
		ds.style.width = width + 'px';
		ds.style.height = Math.abs(e.clientY + pos.y.value + OFFSET_Y -
			mouse.anchor.y) + 'px';

		// Actually find photos in the box
		grid.bounding_box(mouse.anchor.x, mouse.anchor.y,
			e.clientX + pos.x.value + OFFSET_X, e.clientY + pos.y.value +
			OFFSET_Y);

	},

	// Initiate a drag
	mousedown: function(e) {

		// If there are no photos, there's nothing to do
		if (0 == photos.count) {
			return;
		}

		// Resolve clicks on the video icon to the thumbnail
		e = mouse.resolve(e);

		// Get the mouse position
		if (null == mouse.box) {
			mouse.box = document.getElementById('photos').boxObject
				.QueryInterface(Ci.nsIScrollBoxObject);
		}
		var pos = {x: {}, y: {}};
		mouse.box.getPosition(pos.x, pos.y);

		// Clicking on a single photo will do drag-reordering
		if (e.target.src && 'buddyicon' != e.target.id) {
			if (1 < photos.count) {
				mouse.dragging = 1;
			}
		}

		// Clicking whitespace will start the drag-select
		else if ('photos_sort_revert' != e.target.id
			&& 'switch' != e.target.id && 'big_login' != e.target.id
			&& 'login' != e.target.id && 'login_inner' != e.target.id
			&& conf.scrollbar_width < mouse.box.width - e.clientX) {
			mouse.anchor = {
				x: e.clientX + pos.x.value - mouse.box.x - grid.base.x,
				y: e.clientY + pos.y.value - mouse.box.y - grid.base.y
			};
			var ds = document.getElementById('drag_select');
			ds.style.left = mouse.anchor.x + 'px';
			ds.style.top = mouse.anchor.y + 'px';
			ds.style.width = '1px';
			ds.style.height = '1px';
			ds.style.display = 'block';
		}

	},

	// Keep dragging
	mousemove: function(e) {

		// If there are no photos, there's nothing to do
		if (0 == photos.count) {
			return;
		}

		// Resolve clicks on the video icon to the thumbnail
		e = mouse.resolve(e);

		// Get the mouse position
		if (null == mouse.box) {
			mouse.box = document.getElementById('photos').boxObject
				.QueryInterface(Ci.nsIScrollBoxObject);
		}
		const OFFSET_X = -mouse.box.x - grid.base.x;
		const OFFSET_Y = -mouse.box.y - grid.base.y;
		var pos = {x: {}, y: {}};
		mouse.box.getPosition(pos.x, pos.y);

		// If we're reordering
		if (null == mouse.anchor) {

			// Once the user starts the drag, give feedback
			if (1 == mouse.dragging) {

				// Update the selection
				if ('selected' != e.target.className) {
					mouse.click(e);
				}

				// Make the selected photos look like they're being dragged
				for each (var id in photos.selected) {
					document.getElementById('photo' + id)
						.getElementsByTagName('img')[0].className =
						'selected dragging';
				}

				mouse.dragging = 2;
			}

			// Once they drag off of an image, they've dragged far enough
			// for this to be on purpose
			if (2 == mouse.dragging && 'img' != e.target.nodeName) {
				mouse.dragging = 3;
			}

			// As the user is dragging, update the feedback
			if (3 == mouse.dragging) {

				// Show the cursor follower
				var follower = document.getElementById('drag_follower');
				follower.firstChild.nodeValue = photos.selected.length;
				follower.style.left = (e.clientX + pos.x.value +
					OFFSET_X + 10) + 'px';
				follower.style.top = (e.clientY + pos.y.value +
					OFFSET_Y + 7) + 'px';
				follower.style.display = 'block';

				// Get the list item we're hovering over
				var target;
				if ('li' == e.target.nodeName) {
					target = e.target;
				} else if ('img' == e.target.nodeName) {
					target = e.target.parentNode;
				} else {
					target = document.getElementById('photos_list')
						.lastChild;
				}

				// Which side of the list item are we on?
				var left = e.clientX < (target.offsetLeft +
					target.getElementsByTagName('img')[0].width / 2);

				// Don't place the target in the middle of a bunch of
				// selected elements
				var list = document.getElementById('photos_list');
				while (target != list[left ? 'firstChild' : 'lastChild']) {
					var tmp = target[left ? 'previousSibling' :
						'nextSibling'];
					if (-1 == target.getElementsByTagName('img')[0]
						.className.indexOf('selected')
						|| -1 != target.getElementsByTagName('img')[0]
						.className.indexOf('selected')
						&& -1 == tmp.getElementsByTagName('img')[0]
						.className.indexOf('selected')) {
						break;
					}
					target = tmp;
				}

				// Show indicator of drop position
				if (left && target != list.getElementsByTagName('li')[0]) {
					left = false;
					target = target.previousSibling;
				}
				if (null != mouse.target && target != mouse.target) {
					mouse.target.className = '';
				}
				target.className = left ? 'drop_left' : 'drop_right';
				mouse.target = target;
				mouse.left = left;

			}

		}

		// If we're selecting
		else {
			mouse.drag_select(e, pos);
		}

		// If we're reaching the edge of the box and can scroll, do so
		if ((0 != mouse.dragging || null != mouse.anchor)
			&& (conf.scroll > e.clientY + OFFSET_Y && 0 != pos.y.value
			|| conf.scroll > mouse.box.height - e.clientY - OFFSET_Y -
			grid.base.y)) {
			if (null == mouse.auto_scroll) {
				var clientX = e.clientX;
				var clientY = e.clientY;
				mouse.auto_scroll = window.setInterval(function() {
					var delta = 0;
					if (conf.scroll > clientY + OFFSET_Y) {
						delta = -conf.scroll;
					}
					if (conf.scroll > mouse.box.height - clientY -
						OFFSET_Y - grid.base.y) {
						delta = conf.scroll;
					}
					var pos = {x: {}, y: {}};
					mouse.box.getPosition(pos.x, pos.y);
					if (delta) {
						mouse.box.scrollTo(pos.x.value, pos.y.value + delta);
					}
					if (mouse.anchor) {
						mouse.drag_select({clientX: clientX,
							clientY: clientY}, pos);
					}
				}, 10);
			}
		}

		// If we've left the auto-scroll area, stop
		else {
			if (null != mouse.auto_scroll) {
				window.clearInterval(mouse.auto_scroll);
				mouse.auto_scroll = null;
			}
		}

	},

	// Finish a drag
	mouseup: function(e) {

		// If there are no photos, there's nothing to do
		if (0 == photos.count) {
			return;
		}

		// Resolve clicks on the video icon to the thumbnail
		e = mouse.resolve(e);

		// Clicks cancel the special behavior when first adding photos
		meta.first = false;

		// Clicks while adding photos prevents auto-selecting photos
		// when added
		if (_block_normalize) { meta.auto_select = false; }

		// Prevent conflicts with select-all behavior
		document.getElementById('photos').focus();

		// Stop auto-scrolling when we stop dragging, too
		if (null != mouse.auto_scroll) {
			window.clearInterval(mouse.auto_scroll);
			mouse.auto_scroll = null;
		}

		// If we're reordering
		if (null == mouse.anchor) {
			var list = document.getElementById('photos_list');
			if (3 == mouse.dragging) {

				// Reorder the photo list
				photos.selected.sort(function(a, b) {
					return a < b;
				});
				for each (var id in photos.selected) {
					var p = document.getElementById('photo' + id);

					// Stop giving drag feedback
					p.getElementsByTagName('img')[0].className = 'selected';

					// Move this image to its new home
					if (mouse.left) {
						list.insertBefore(p, mouse.target);
					} else {
						if (mouse.target == list.lastChild) {
							list.appendChild(p);
						} else {
							list.insertBefore(p, mouse.target.nextSibling);
						}
					}

				}
				photos.normalize();

				// Stop showing feedback on the cursor
				document.getElementById('drag_follower')
					.style.display = 'none';
				if (null != mouse.target) {
					mouse.target.className = '';
				}

				// Show the link to revert to default order
				document.getElementById('photos_sort_default')
					.style.display = 'none';
				document.getElementById('photos_sort_revert')
					.style.display = 'block';
				photos.sort = false;

				// Let extensions know we reordered photos
				extension.after_reorder.exec(true);

			}
			mouse.dragging = 0;
			mouse.target = null;
			mouse.left = false;

			// For false-starts where we don't really drag, make sure
			// dragging class is removed
			var li = list.getElementsByTagName('li');
			var ii = li.length;
			for (var i = 0; i < ii; ++i) {
				var img = li[i].getElementsByTagName('img')[0];
				img.className = img.className.replace('dragging', '');
			}

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
					var img = document.getElementById('photo' + i)
						.getElementsByTagName('img')[0];

					// Don't select things that are errors or are loading
					if (-1 == img.className.indexOf('error') &&
						-1 == img.className.indexOf('loading')) {
						if ('selecting' == img.className) {
							img.className = 'selected';
							photos.selected.push(i);
						} else {
							img.className = '';
						}
					}
				}
			}
			if (0 == photos.selected.length) {
				mouse.click(e);
			} else {
				if (1 == photos.selected.length) {
					meta.load(photos.selected[0]);
					meta.enable();
				} else {
					meta.batch();
				}
			}

		}

		mouse.anchor = null;
	},

	// Show and hide the photos list and queue list
	//   Usually fired by clicking the toggle button, but is forced when
	//   upload finishes
	_photos_visible: true,
	show_photos: function() {
		mouse._photos_visible = true;
		document.getElementById('page_photos').style.display = '-moz-box';
		document.getElementById('page_queue').style.display = 'none';
		document.getElementById('footer').className = 'photos';
	},
	show_queue: function() {
		mouse._photos_visible = false;
		document.getElementById('page_photos').style.display = 'none';
		document.getElementById('page_queue').style.display = '-moz-box';
		document.getElementById('footer').className = 'queue';
	},
	toggle: function() {
		if (mouse._photos_visible) {
			mouse.show_queue();
		} else {
			mouse.show_photos();
		}
	},

	// Resolve clicks on the video icon to the thumbnail
	resolve: function(e) {
		if (e.target.src &&
			'chrome://uploadr/skin/icon_video.png' == e.target.src) {
			var new_e = {};
			for (var key in e) {
				new_e[key] = e[key];
			}
			new_e.target = e.target.parentNode.firstChild;
			return new_e;
		} else {
			return e;
		}
	}

};