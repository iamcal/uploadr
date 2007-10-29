var meta = {

	// Map of set IDs to names
	sets: {},
	created_sets: [],
	sets_map: {},

	// Show a special status message for their first batch
	first: true,

	// Auto-select, which is cancellable by a click during thumbing
	auto_select: true,

	// Load a photo's metadata from JS into the DOM
	load: function(id) {

		// Load the defaults for a partial batch
		if (null == id) {
			if (meta.first) {
				document.getElementById('batch_prompt').firstChild.nodeValue =
					locale.getString('meta.first');
			} else {
				document.getElementById('batch_prompt').firstChild.nodeValue =
					locale.getFormattedString('meta.batch.prompt', [photos.selected.length]);
			}
			document.getElementById('batch_title').value = '';
			document.getElementById('batch_description').value = '';
			document.getElementById('batch_tags').value = '';
			var is_public = document.getElementById('batch_is_public');
			is_public.value = settings.is_public;
			var dis = 1 == settings.is_public;
			var is_friend = document.getElementById('batch_is_friend');
			is_friend.checked = 1 == settings.is_friend;
			is_friend.disabled = dis;
			var is_family = document.getElementById('batch_is_family');
			is_family.checked = 1 == settings.is_family;
			is_family.disabled = dis;
			document.getElementById('batch_content_type').value = settings.content_type;
			document.getElementById('batch_hidden').checked = 2 == settings.hidden;
			document.getElementById('batch_safety_level').value = settings.safety_level;

			// Clear the old sets list
			var ul = document.getElementById('batch_sets_added');
			while (ul.hasChildNodes()) {
				ul.removeChild(ul.firstChild);
			}
			var li = document.createElementNS(NS_HTML, 'li')
			li.className = 'sets_none';
			li.appendChild(document.createTextNode(
				locale.getString('meta.sets.added.none')));
			ul.appendChild(li);
			document.getElementById('batch_sets_create').style.visibility =
				meta.created_sets.length == users.sets ? 'hidden' : 'visible';

		}

		// Load the values from a specific photo
		else {
			var p = photos.list[id];
			if (!meta.first) {
				document.getElementById('single_prompt').style.display = 'none';
				document.getElementById('single_preview').style.display = '-moz-box';
				var img = document.getElementById('photo' + id).getElementsByTagName('img')[0];
				var meta_div = document.getElementById('meta_div');
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
			}
			document.getElementById('meta_dim').value = locale.getFormattedString('meta.dim',
				[p.width, p.height]);
			document.getElementById('meta_size').value = locale.getFormattedString('meta.size',
				[(Math.round(file.size(p.path) / 102.4) / 10)]);
			document.getElementById('single_title').value = p.title;
			document.getElementById('single_description').value = p.description;
			document.getElementById('single_tags').value = p.tags;
			document.getElementById('single_is_public').value = p.is_public;
			document.getElementById('single_is_friend').checked = 1 == p.is_friend;
			document.getElementById('single_is_family').checked = 1 == p.is_family;
			document.getElementById('single_content_type').value = p.content_type;
			document.getElementById('single_hidden').checked = 2 == p.hidden;
			document.getElementById('single_safety_level').value = p.safety_level;

			// Sets list
			var ul = document.getElementById('single_sets_added');
			while (ul.hasChildNodes()) {
				ul.removeChild(ul.firstChild);
			}
			var ii = p.sets.length;
			if (0 == ii) {
				var li = document.createElementNS(NS_HTML, 'li')
				li.className = 'sets_none';
				li.appendChild(document.createTextNode(
					locale.getString('meta.sets.added.none')));
				ul.appendChild(li);
			} else {
				for (var i = 0; i < ii; ++i) {
					var li = document.createElementNS(NS_HTML, 'li');
					li.id = 'single_sets_' + p.sets[i];
					li.className = 'sets_trash';
					li.appendChild(document.createTextNode(meta.sets[p.sets[i]]));
					ul.appendChild(li);
				}
			}
			document.getElementById('single_sets_create').style.visibility =
				meta.created_sets.length == users.sets ? 'hidden' : 'visible';

		}

	},

	// Save photo metadata from the DOM into JS
	save: function(id) {

		// Save a partial batch into the selected photos
		if (null == id) {

			// Could ask for permission/confirmation here, but let's not get pushy

			var ii = photos.selected.length;
			for (var i = 0; i < ii; ++i) {
				var p = photos.list[photos.selected[i]];

				// Overwrite title if one is given
				var title = document.getElementById('batch_title').value;
				if ('' != title) {
					p.title = title;
				}

				// Append description if one is given
				var description = document.getElementById('batch_description').value;
				if ('' != description) {
					p.description += ('' == p.description ? '' : '\n\n') + description;
				}

				// Append tags, but then parse and remove duplicates
				p.tags = meta.tags(p.tags + ' ' + document.getElementById('batch_tags').value);

				// Overwrite privacy, content type, hidden and safety level
				p.is_public = parseInt(document.getElementById('batch_is_public').value);
				p.is_friend = document.getElementById('batch_is_friend').checked ? 1 : 0;
				p.is_family = document.getElementById('batch_is_family').checked ? 1 : 0;
				p.content_type = parseInt(document.getElementById('batch_content_type').value);
				p.hidden = document.getElementById('batch_hidden').checked ? 2 : 1;
				p.safety_level = parseInt(document.getElementById('batch_safety_level').value);

			}
			meta.load();
		}

		// Save a single photo
		else {
			var p = photos.list[id];
			p.title = document.getElementById('single_title').value;
			p.description = document.getElementById('single_description').value;
			p.tags = document.getElementById('single_tags').value;
			p.is_public = parseInt(document.getElementById('single_is_public').value);
			p.is_friend = document.getElementById('single_is_friend').checked ? 1 : 0;
			p.is_family = document.getElementById('single_is_family').checked ? 1 : 0;
			p.content_type = parseInt(document.getElementById('single_content_type').value);
			p.hidden = document.getElementById('single_hidden').checked ? 2 : 1;
			p.safety_level = parseInt(document.getElementById('single_safety_level').value);
		}

	},

	// Enable the right-side metadata column on the photos page
	enable: function() {
		var is_public = document.getElementById('single_is_public');
		is_public.disabled = false;
		var dis = 1 == parseInt(is_public.value);
		document.getElementById('single_is_friend').disabled = dis;
		document.getElementById('single_is_family').disabled = dis;
		document.getElementById('meta').style.display = '-moz-box';
		document.getElementById('batch_meta').style.display = 'none';
		meta._enable();
	},
	batch: function() {
		meta.load();
		document.getElementById('meta').style.display = 'none';
		document.getElementById('batch_meta').style.display = '-moz-box';
		meta._enable();
	},

	// Common to batch and single enabling
	_enable: function() {
		document.getElementById('no_meta').style.display = 'none';
		buttons.remove.enable();
		document.getElementById('t_rotate_l').className = 'enabled';
		document.getElementById('t_rotate_r').className = 'enabled';
	},

	// Disable the right-side metadata column on the photos page
	disable: function() {
		document.getElementById('meta').style.display = 'none';
		document.getElementById('batch_meta').style.display = 'none';
		document.getElementById('no_meta').style.display = '-moz-box';
		buttons.remove.disable();
		document.getElementById('t_rotate_l').className = 'disabled';
		document.getElementById('t_rotate_r').className = 'disabled';
	},

	// Properly enable/disable the checkboxes available for private photos to be shared with
	// friends and/or family
	is_public: function(value) {

		// Single photo or group of photos?
		var prefix = 1 == photos.selected.length ? 'single' : 'batch';

		if (1 == parseInt(value)) {
			document.getElementById(prefix + '_is_friend').checked = false;
			document.getElementById(prefix + '_is_family').checked = false;
			document.getElementById(prefix + '_is_friend').disabled = true;
			document.getElementById(prefix + '_is_family').disabled = true;
		} else {
			document.getElementById(prefix + '_is_friend').disabled = false;
			document.getElementById(prefix + '_is_family').disabled = false;
		}
	},

	// If a user leaves a partial batch before committing, warn them
	//   If uploadr.conf.confirm_save_batch is off, this will always save rather than abandon
	abandon: function() {
		if ('-moz-box' == document.getElementById('batch_meta').style.display &&
			1 < photos.selected.length) {
			if (uploadr.conf.confirm_save_batch) {
				if (confirm(locale.getString('meta.abandon.text'),
					locale.getString('meta.abandon.title'),
					locale.getString('meta.abandon.ok'),
					locale.getString('meta.abandon.cancel'))) {
					meta.save();
				}
			} else {
				meta.save();
			}
		}
	},

	// Parse a string into an array of tags
	tags: function(str) {
		while (/".*?"/.test(str)) {
			var match = /"(.*?)"/.exec(str);
			str = str.replace(/".*?"/, meta.tags_transform(match[1]));
		}
		var arr;
		var delim;
		if (-1 == str.indexOf(',')) {
			arr = str.split(/\s/);
			delim = ' ';
		} else {
			arr = str.split(/,/);
			delim = ', ';
		}
		var ii = arr.length;
		var out = '';
		for (var i = 0; i < ii; ++i) {
			if ('' != arr[i]) {
				var tmp = delim + meta.tags_untransform(arr[i]);
				if (-1 == out.indexOf(tmp)) {
					out += tmp;
				}
			}
		}
		return out.slice(delim.length);
	},

	// Transform and untransform tags for splitting
	tags_transform: function(tag) {
		while (/\s+/.test(tag)) {
			var match = /(\s+)/.exec(tag);
			tag = tag.replace(/\s+/, '{WHITESPACE-' + match[1].charCodeAt(0) + '}');
		}
		while (/,/.test(tag)) {
			var match = /(,)/.exec(tag);
			tag = tag.replace(/,/, '{COMMA}');
		}
		return tag;
	},
	tags_untransform: function(tag) {
		var quotes = false;
		while (/\{WHITESPACE-[0-9]+\}/.test(tag)) {
			var match = /\{WHITESPACE-([0-9]+)\}/.exec(tag);
			tag = tag.replace(/\{WHITESPACE-[0-9]+\}/, String.fromCharCode(parseInt(match[1])));
			quotes = true;
		}
		while (/\{COMMA\}/.test(tag)) {
			var match = /\{COMMA\}/.exec(tag);
			tag = tag.replace(/\{COMMA\}/, ',');
			quotes = true;
		}
		return (quotes ? '"' : '') + tag.replace(/^\s+/, '').replace(/\s+$/, '') +
			(quotes ? '"' : '');
	},

	// Create a new set if we have any left
	create_set: function() {
		if (-1 == users.sets || 0 < users.sets) {
			var name = prompt('', //locale.getString('meta.sets.create.text'),
				locale.getString('meta.sets.create.title'));
			if (!name) {
				return;
			}
			meta.created_sets.push(name);
			meta.sets[name] = name;
			var prefixes = ['single', 'batch'];
			for each (var prefix in prefixes) {
				var ul = document.getElementById(prefix + '_sets_add');
				if ('sets_none' == ul.firstChild.className) {
					ul.removeChild(ul.firstChild);
				}
				var li = document.createElementNS(NS_HTML, 'li');
				li.id = prefix + '_sets_' + name;
				li.className = 'sets_plus';
				li.appendChild(document.createTextNode(name));
				ul.insertBefore(li, ul.firstChild);
			}
			meta.add_to_set({target: ul.firstChild});
			if (meta.created_sets.length == users.sets) {
				var prefix = 1 == photos.selected.length ? 'single' : 'batch';
				document.getElementById(prefix + '_sets_create').style.visibility = 'hidden';
			}
		}
	},

	// Add selected photos to the selected set
	add_to_set: function(e) {

		// Get the item that was clicked
		if ('li' != e.target.nodeName || 'sets_plus' != e.target.className) {
			return;
		}
		var li = e.target;
		var set_id = li.id.replace(/^(single|batch)_sets_/, '');
		var name = li.firstChild.nodeValue;

		// Add each selected photo to this set
		var ii = photos.selected.length;
		for (var i = 0; i < ii; ++i) {
			var p = photos.list[photos.selected[i]];
			if (-1 == p.sets.indexOf(set_id)) {
				p.sets.push(set_id);
			}
		}

		// Update the UI
		var prefix = 1 == photos.selected.length ? 'single' : 'batch';
		var ul = document.getElementById(prefix + '_sets_added');
		if ('sets_none' == ul.firstChild.className) {
			ul.removeChild(ul.firstChild);
		}
		var li = document.createElementNS(NS_HTML, 'li');
		li.id = prefix + '_sets_' + set_id;
		li.className = 'sets_trash';
		li.appendChild(document.createTextNode(name));
		ul.appendChild(li);

	},

	remove_from_set: function(e) {

		// Get the item that was clicked
		if ('li' != e.target.nodeName || 'sets_trash' != e.target.className) {
			return;
		}
		var li = e.target;
		var set_id = li.id.replace(/^(single|batch)_sets_/, '');
		var name = li.firstChild.nodeValue;

		// Remove each selected photo from this set
		var ii = photos.selected.length;
		for (var i = 0; i < ii; ++i) {
			var p = photos.list[photos.selected[i]];
			var new_sets = [];
			var jj = p.sets.length;
			for (var j = 0; j < jj; ++j) {
				if (set_id != p.sets[j]) {
					new_sets.push(p.sets[j]);
				}
			}
			p.sets = new_sets;
		}

		// Update the UI
		li.parentNode.removeChild(li);
		var prefix = 1 == photos.selected.length ? 'single' : 'batch';
		var ul = document.getElementById(prefix + '_sets_added');
		if (0 == ul.getElementsByTagName('li').length) {
			li = document.createElementNS(NS_HTML, 'li');
			li.className = 'sets_none';
			li.appendChild(document.createTextNode(locale.getString('meta.sets.added.none')));
			ul.appendChild(li);
		}

	},

	// Note default values in the meta panes
	defaults: function(map) {
		var def = ' ' + locale.getString('meta.default');
		for (var m in map) {
			for each (var prefix in ['single_', 'batch_']) {
				var node = document.getElementById(prefix + m);
				var loop = true;
				if ('menulist' == node.nodeName) {
					node = node.getElementsByTagName('menupopup')[0].getElementsByTagName(
						'menuitem');
				} else if ('radiogroup' == node.nodeName) {
					node = node.getElementsByTagName('radio');
				} else if ('checkbox' == node.nodeName) {
					var checked_value = -1 == node.id.indexOf('hidden') ? 1 : 2;
					node.label = node.label.replace(def, '');
					if (checked_value == map[m]) {
						node.label += def;
						loop = false;
					}
				}
				if (loop) {
					var ii = node.length;
					for (var i = 0; i < ii; ++i) {
						node[i].label = node[i].label.replace(def, '');
						if (parseInt(node[i].value) == map[m]) {
							node[i].label += def;
						}
					}
				}
			}
		}
	},

	// Only show sets to logged-in users
	login: function() {
		document.getElementById('hide_single_sets').style.visibility = 'visible';
		document.getElementById('hide_batch_sets').style.visibility = 'visible';
		document.getElementById('hide_single_explain').style.display = 'none';
		document.getElementById('hide_batch_explain').style.display = 'none';
	},
	logout: function() {
		document.getElementById('hide_single_sets').style.visibility = 'hidden';
		document.getElementById('hide_batch_sets').style.visibility = 'hidden';
		document.getElementById('hide_single_explain').style.display = '-moz-box';
		document.getElementById('hide_batch_explain').style.display = '-moz-box';
	}

};