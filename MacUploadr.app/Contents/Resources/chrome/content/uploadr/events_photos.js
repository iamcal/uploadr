events.photos = {

	// Event handler for clicking anywhere in the photos pane
	click: function(e) {

		// Save old metadata
		if (1 == photos.selected.length) {
			meta.save(photos.selected[0]);
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
				photos.selected.push(id);
			}

			// Save the image last clicked
			photos.last = id;
	
			// Update the metadata pane
			document.getElementById('meta_primary').style.display = '-moz-box';
			document.getElementById('meta_secondary').style.display = 'none';
			var meta_div = document.getElementById('meta_div');
			if (1 == photos.selected.length) {
				while (meta_div.hasChildNodes()) {
					meta_div.removeChild(meta_div.firstChild);
				}
				var w = parseInt(img.getAttribute('width'));
				var h = parseInt(img.getAttribute('height'));
				meta_div.setAttribute('width', w + 4);
				meta_div.setAttribute('height', h + 4);
				var meta_img = document.createElementNS(NS_HTML, 'img');
				meta_img.setAttribute('width', w);
				meta_img.setAttribute('height', h);
				meta_img.src = img.src;
				meta_div.appendChild(meta_img);
				meta.load(photos.selected[0]);
				meta_div.style.visibility = 'visible';
				meta.enable();
			} else {
				meta_div.style.visibility = 'hidden';
				meta.disable();
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
			meta_div.style.visibility = 'hidden';
			meta.disable();
			document.getElementById('t_remove').className = 'disabled';
			document.getElementById('t_rotate_l').className = 'disabled';
			document.getElementById('t_rotate_r').className = 'disabled';
		}

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

	// Show the settings page
	settings: function() {
		pages.go('settings');
		buttons.show(['back', 'ok']);
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