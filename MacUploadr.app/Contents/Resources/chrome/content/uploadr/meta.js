var meta = {

	// Map of set IDs to names
	sets: {},
	created_sets: [],
	sets_map: {},

	// Load a photo's metadata from JS into the DOM
	load: function(id) {

		// Load the defaults for a partial batch
		if (null == id) {
			document.getElementById('batch_title').value = '';
			document.getElementById('batch_description').value = '';
			document.getElementById('batch_tags').value = '';
			document.getElementById('batch_is_public_unchanged').checked = true;
			var is_public = document.getElementById('batch_is_public');
			is_public.value = settings.is_public;
			var dis = 1 == parseInt(is_public.value);
			var is_friend = document.getElementById('batch_is_friend');
			is_friend.checked = 1 == settings.is_friend;
			document.getElementById('batch_is_friend').disabled = dis;
			var is_family = document.getElementById('batch_is_family');
			is_family.checked = 1 == settings.is_family;
			is_family.disabled = dis;
			document.getElementById('batch_content_type_unchanged').checked = true;
			document.getElementById('batch_content_type').selectedIndex = settings.content_type - 1;
			document.getElementById('batch_hidden_unchanged').checked = true;
			document.getElementById('batch_hidden').selectedIndex = settings.hidden - 1;
			document.getElementById('batch_safety_level_unchanged').checked = true;
			document.getElementById('batch_safety_level').selectedIndex = settings.safety_level - 1;
			document.getElementById('batch_set').selectedIndex = 0;
		}

		// Load the values from a specific photo
		else {
			var p = photos.list[id];
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
			document.getElementById('meta_dim').value = locale.getFormattedString('meta.dim',
				[p.width, p.height]);
			document.getElementById('meta_size').value = locale.getFormattedString('meta.size',
				[(Math.round(uploadr.fsize(p.path) / 102.4) / 10) + ' MB']);
			document.getElementById('single_title').value = p.title;
			document.getElementById('single_description').value = p.description;
			document.getElementById('single_tags').value = p.tags;
			document.getElementById('single_is_public').value = p.is_public;
			document.getElementById('single_is_friend').checked = 1 == p.is_friend;
			document.getElementById('single_is_family').checked = 1 == p.is_family;
			document.getElementById('single_content_type').selectedIndex = p.content_type - 1;
			document.getElementById('single_hidden').selectedIndex = p.hidden - 1;
			document.getElementById('single_safety_level').selectedIndex = p.safety_level - 1;

			// Sets list
			var ul = document.getElementById('single_sets_list');
			while (ul.hasChildNodes()) {
				ul.removeChild(ul.firstChild);
			}
			if (null != meta.sets) {
				var ii = p.sets.length;
				for (var i = 0; i < ii; ++i) {
					meta.select_set(ul, p.sets[i], meta.sets[p.sets[i]]);
				}
			}
			document.getElementById('single_set').selectedIndex = 0;

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

				// Overwrite privacy, content type, hidden and safety level if they changed
				if (!document.getElementById('batch_is_public_unchanged').checked) {
					p.is_public = parseInt(document.getElementById('batch_is_public').value);
					p.is_friend = document.getElementById('batch_is_friend').checked ? 1 : 0;
					p.is_family = document.getElementById('batch_is_family').checked ? 1 : 0;
				}
				if (!document.getElementById('batch_content_type_unchanged').checked) {
					p.content_type = document.getElementById('batch_content_type').selectedIndex + 1;
				}
				if (!document.getElementById('batch_hidden_unchanged').checked) {
					p.hidden = document.getElementById('batch_hidden').selectedIndex + 1;
				}
				if (!document.getElementById('batch_safety_level_unchanged').checked) {
					p.safety_level = document.getElementById('batch_safety_level').selectedIndex + 1;
				}

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
			p.content_type = document.getElementById('single_content_type').selectedIndex + 1;
			p.hidden = document.getElementById('single_hidden').selectedIndex + 1;
			p.safety_level = document.getElementById('single_safety_level').selectedIndex + 1;
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
		document.getElementById('single_privacy').style.display = 'none';
		document.getElementById('single_melons').style.display = 'none';
		document.getElementById('single_sets').style.display = 'none';
		document.getElementById('batch_meta').style.display = 'none';
		document.getElementById('no_meta').style.display = 'none';
	},

	batch: function() {
		meta.load();
		document.getElementById('batch_prompt').firstChild.nodeValue =
			locale.getFormattedString('meta.batch.prompt', [photos.selected.length]);
		document.getElementById('meta').style.display = 'none';
		document.getElementById('batch_meta').style.display = '-moz-box';
		document.getElementById('batch_privacy').style.display = 'none';
		document.getElementById('batch_melons').style.display = 'none';
		document.getElementById('batch_sets').style.display = 'none';
		document.getElementById('no_meta').style.display = 'none';
	},

	// Disable the right-side metadata column on the photos page
	disable: function() {
		document.getElementById('meta').style.display = 'none';
		document.getElementById('batch_meta').style.display = 'none';
		document.getElementById('no_meta').style.display = '-moz-box';
	},

	// If a user leaves a partial batch before committing, warn them
	abandon: function() {
		if ('-moz-box' == document.getElementById('batch_meta').style.display &&
			1 < photos.selected.length && (
				'' != document.getElementById('batch_title').value ||
				'' != document.getElementById('batch_description').value ||
				'' != document.getElementById('batch_tags').value ||
				!document.getElementById('batch_is_public_unchanged').checked ||
				!document.getElementById('batch_content_type_unchanged').checked ||
				!document.getElementById('batch_hidden_unchanged').checked ||
				!document.getElementById('batch_safety_level_unchanged').checked
			)) {
			if (confirm(locale.getString('meta.abandon'), locale.getString('meta.abandon.title'))) {
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

	// Show a set in the list of selected sets
	select_set: function(ul, set_id, name) {
		var li = document.createElementNS(NS_HTML, 'li');
		li.appendChild(document.createTextNode(name + ' '));
		var a = document.createElementNS(NS_HTML, 'a');
		a.appendChild(document.createTextNode(String.fromCharCode(215)));
		a.onclick = function(e) {
			var ii = photos.selected.length;
			for (var i = 0; i < ii; ++i) {
				var p = photos.list[photos.selected[i]];
				var j = p.sets.indexOf(set_id);
				if (-1 != j) {
					delete p.sets[j];
				}
			}
			e.target.parentNode.parentNode.removeChild(e.target.parentNode);
		};
		li.appendChild(a);
		ul.appendChild(li);
	}

};