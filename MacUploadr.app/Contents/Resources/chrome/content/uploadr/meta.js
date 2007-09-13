var meta = {

	// Load a photo's metadata from JS into the DOM
	load: function(id) {

		// Load the defaults for a partial batch
		if (null == id) {
			document.getElementById('m_title').value = '';
			document.getElementById('m_description').value = '';
			document.getElementById('m_tags').value = '';
			var is_public = document.getElementById('m_is_public');
			is_public.value = settings.is_public;
			var dis = 1 == parseInt(is_public.value);
			var is_friend = document.getElementById('m_is_friend');
			is_friend.checked = 1 == settings.is_friend;
			document.getElementById('m_is_friend').disabled = dis;
			var is_family = document.getElementById('m_is_family');
			is_family.checked = 1 == settings.is_family;
			is_family.disabled = dis;
			document.getElementById('m_content_type').selectedIndex = settings.content_type - 1;
			document.getElementById('m_hidden').selectedIndex = settings.hidden - 1;
			document.getElementById('m_safety_level').selectedIndex = settings.safety_level - 1;
		}

		// Load the values from a specific photo
		else {
			var p = photos.list[id];
			var img = document.getElementById('photo' + id).getElementsByTagName('img')[0];
			document.getElementById('meta_primary').style.display = '-moz-box';
			document.getElementById('meta_secondary').style.display = 'none';
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
			document.getElementById('p_title').value = p.title;
			document.getElementById('p_description').value = p.description;
			document.getElementById('p_tags').value = p.tags;
			document.getElementById('p_is_public').value = p.is_public;
			document.getElementById('p_is_friend').checked = 1 == p.is_friend;
			document.getElementById('p_is_family').checked = 1 == p.is_family;
			document.getElementById('p_content_type').selectedIndex = p.content_type - 1;
			document.getElementById('p_hidden').selectedIndex = p.hidden - 1;
			document.getElementById('p_safety_level').selectedIndex = p.safety_level - 1;
		}

	},

	// Save photo metadata from the DOM into JS
	save: function(id) {

		// Save a partial batch into the selected photos
		if (null == id) {

			// Could ask for permission/confirmation here, but let's not get pushy

			var ii = photos.selected.length;
			for (var i = 0; i < ii; ++i) {

				// Overwrite most stuff
				var p = photos.list[photos.selected[i]];
				var title = document.getElementById('m_title').value;
				if ('' != title) {
					p.title = title;
				}
				var description = document.getElementById('m_description').value;
				if ('' != description) {
					p.description += ('' == p.description ? '' : '\n\n') + description;
				}
				p.is_public = parseInt(document.getElementById('m_is_public').value);
				p.is_friend = document.getElementById('m_is_friend').checked ? 1 : 0;
				p.is_family = document.getElementById('m_is_family').checked ? 1 : 0;
				p.content_type = document.getElementById('m_content_type').selectedIndex + 1;
				p.hidden = document.getElementById('m_hidden').selectedIndex + 1;
				p.safety_level = document.getElementById('m_safety_level').selectedIndex + 1;

				// But tags are the special case, we append, but smartly to remove duplicates
				p.tags = meta.tags(p.tags + ' ' + document.getElementById('m_tags').value);

			}
			meta.load();
		}

		// Save a single photo
		else {
			var p = photos.list[id];
			p.title = document.getElementById('p_title').value;
			p.description = document.getElementById('p_description').value;
			p.tags = document.getElementById('p_tags').value;
			p.is_public = parseInt(document.getElementById('p_is_public').value);
			p.is_friend = document.getElementById('p_is_friend').checked ? 1 : 0;
			p.is_family = document.getElementById('p_is_family').checked ? 1 : 0;
			p.content_type = document.getElementById('p_content_type').selectedIndex + 1;
			p.hidden = document.getElementById('p_hidden').selectedIndex + 1;
			p.safety_level = document.getElementById('p_safety_level').selectedIndex + 1;
		}

	},

	// Enable the right-side metadata column on the photos page
	enable: function() {
		var is_public = document.getElementById('p_is_public');
		is_public.disabled = false;
		var dis = 1 == parseInt(is_public.value);
		document.getElementById('p_is_friend').disabled = dis;
		document.getElementById('p_is_family').disabled = dis;
		document.getElementById('meta').style.display = '-moz-box';
		document.getElementById('partial_meta').style.display = 'none';
		document.getElementById('no_meta').style.display = 'none';
	},

	partial: function() {
		meta.load();
		document.getElementById('m_prompt').firstChild.nodeValue =
			locale.getFormattedString('meta.partial.prompt', [photos.selected.length]);
		document.getElementById('meta').style.display = 'none';
		document.getElementById('partial_meta').style.display = '-moz-box';
		document.getElementById('no_meta').style.display = 'none';
	},

	// Disable the right-side metadata column on the photos page
	disable: function() {
		document.getElementById('meta').style.display = 'none';
		document.getElementById('partial_meta').style.display = 'none';
		document.getElementById('no_meta').style.display = '-moz-box';
	},

	// If a user leaves a partial batch before committing, warn them
	abandon: function() {
		if ('-moz-box' == document.getElementById('partial_meta').style.display &&
			1 < photos.selected.length && (
				'' != document.getElementById('m_title').value ||
				'' != document.getElementById('m_description').value ||
				'' != document.getElementById('m_tags').value ||
				settings.is_public != parseInt(document.getElementById('m_is_public').value) ||
				settings.is_friend != document.getElementById('m_is_friend').checked ? 1 : 0 ||
				settings.is_family != document.getElementById('m_is_family').checked ? 1 : 0 ||
				settings.content_type !=
					document.getElementById('m_content_type').selectedIndex + 1 ||
				settings.hidden != document.getElementById('m_hidden').selectedIndex + 1 ||
				settings.safety_level !=
					document.getElementById('m_safety_level').selectedIndex + 1
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
	}

};