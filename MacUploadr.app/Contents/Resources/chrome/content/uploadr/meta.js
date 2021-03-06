/*
 * Flickr Uploadr
 *
 * Copyright (c) 2007-2009 Yahoo! Inc.  All rights reserved.  This library is
 * free software; you can redistribute it and/or modify it under the terms of
 * the GNU General Public License (GPL), version 2 only.  This library is
 * distributed WITHOUT ANY WARRANTY, whether express or implied. See the GNU
 * GPL for more details (http://www.gnu.org/licenses/gpl.html)
 */

var meta = {

	// Map of set IDs to names
	sets: [],
	created_sets: 0,

	// Show a special status message for their first batch
	first: true,

	// Auto-select, which is cancellable by a click during thumbing
	auto_select: conf.auto_select,

    // Last private setting: 0=private, 1=family, 2=friends, 3=f&f
    last_private_settings: 0,

	// Load a photo's metadata from JS into the DOM
	load: function(id) {

		// Start the sets list all enabled
		var ul = document.getElementById((null == id ? 'batch' : 'single') +
			'_sets_add').getElementsByTagName('li');
		var ii = ul.length;
		for (var i = 0; i < ii; ++i) {
			if ('sets_none' != ul[i].className) {
				ul[i].className = 'sets_plus';
			}
		}
		block_normalize();
		// Load the defaults for a partial batch
		if (null == id) {

			// Proper diction
			var p_count = 0;
			var v_count = 0;
			for each (var id in photos.selected) {
				if (null == photos.list[id]) {
					continue;
				}
				if (photos.is_photo(photos.list[id].path)) {
					++p_count;
				} else {
					++v_count;
				}
			}
			if (p_count && v_count) {
				document.getElementById('batch_who').firstChild.nodeValue = 
					locale.getString('meta.batch.who.items');
			} else if (v_count) {
				document.getElementById('batch_who').firstChild.nodeValue = 
					locale.getString('meta.batch.who.videos');
			} else {
				document.getElementById('batch_who').firstChild.nodeValue = 
					locale.getString('meta.batch.who.photos');				
			}

			// Prompt
			if (meta.first) {
				document.getElementById('batch_prompt').firstChild.nodeValue =
					locale.getString('meta.first');
			} else {
				if (p_count && v_count) {
					document.getElementById('batch_prompt').firstChild.nodeValue =
						locale.getFormattedString('meta.batch.prompt.items',
						[photos.selected.length]);
				} else if (v_count) {
					document.getElementById('batch_prompt').firstChild.nodeValue =
						locale.getFormattedString('meta.batch.prompt.videos',
						[photos.selected.length]);
				} else {
					document.getElementById('batch_prompt').firstChild.nodeValue =
						locale.getFormattedString('meta.batch.prompt.photos',
						[photos.selected.length]);
				}
			}

			// Blank slate metadata
			var s = photos.selected;
			var title = photos.list[s[0]].title;
			var description = photos.list[s[0]].description;
			var tags = photos.list[s[0]].tags;
			var is_public = photos.list[s[0]].is_public;
			var is_friend = photos.list[s[0]].is_friend;
			var is_family = photos.list[s[0]].is_family;
			var content_type = photos.list[s[0]].content_type;
			var hidden = photos.list[s[0]].hidden;
			var safety_level = photos.list[s[0]].safety_level;
			for(var j in s){
				if(title != photos.list[s[j]].title)
					title = '';
				if(description != photos.list[s[j]].description)
					description = '';
				if(tags != photos.list[s[j]].tags)
					tags = '';
				if(is_public != photos.list[s[j]].is_public)
					is_public = 2;
				if(is_friend != photos.list[s[j]].is_friend)
					is_friend = 0;
				if(is_family != photos.list[s[j]].is_family)
					is_family = 0;
				if(content_type != photos.list[s[j]].content_type)
					content_type = 0;
				if(hidden != photos.list[s[j]].hidden)
					hidden = 0;
				if(safety_level != photos.list[s[j]].safety_level)
					safety_level = 0;
			}
			
			document.getElementById('batch_title').value = title;
			document.getElementById('batch_description').value = description;
			document.getElementById('batch_tags').value = tags;
			document.getElementById('batch_is_public').value = is_public;
			
			if(is_public!=0){
				var is_friend = document.getElementById('batch_is_friend');
				is_friend.checked = false;
				is_friend.disabled = true;
				var is_family = document.getElementById('batch_is_family');
				is_family.checked = false;
				is_family.disabled = true;
			}
			else{
				var is_friend = document.getElementById('batch_is_friend');
				is_friend.checked = is_friend;
				is_friend.disabled = !is_friend;
				var is_family = document.getElementById('batch_is_family');
				is_family.checked = is_family;
				is_family.disabled = !is_family;
			}
			
			document.getElementById('batch_content_type').value = content_type;
			document.getElementById('batch_hidden').value = hidden;
			var safety_level = document.getElementById('batch_safety_level');
			safety_level.value = 0;
			//safety_level.selectedItem.label = '';

			// Clear the old sets list
			ul = document.getElementById('batch_sets_added');
			while (ul.hasChildNodes()) {
				ul.removeChild(ul.firstChild);
			}
			var li = document.createElementNS(NS_HTML, 'li')
			li.className = 'sets_none';
			li.appendChild(document.createTextNode(
				locale.getString('meta.sets.added.none')));
			ul.appendChild(li);
			document.getElementById('batch_sets_create').style.display =
				meta.created_sets == users.sets ? 'none' : 'block';

		}

		// Load the values from a specific photo
		else {
			var p = photos.list[id];
			if (null == p) {
			    unblock_normalize();
				return;
			}

			// Proper diction
			if (photos.is_video(p.path)) {
				document.getElementById('single_who').firstChild.nodeValue = 
					locale.getString('meta.single.who.video');
			} else {
				document.getElementById('single_who').firstChild.nodeValue = 
					locale.getString('meta.single.who.photo');
			}

			// Show a preview of the image with file size and dimensions
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
				document.getElementById('meta_dim').value =
					locale.getFormattedString('meta.dim', [p.width, p.height]);
				if (1024 > p.size) {
					document.getElementById('meta_size').value =
						locale.getFormattedString('kb', [p.size]);
				} else {
					document.getElementById('meta_size').value =
						locale.getFormattedString('mb',
						[Math.round(p.size / 102.4) / 10]);
				}
				if (photos.is_video(p.path)) {
					var min = 0, sec = p.duration;
					if (60 <= sec) {
						min = parseInt(sec / 60);
						sec = sec % 60;
					}
                    if (10 > sec) { sec = '0' + sec; }
					document.getElementById('meta_duration').value =
						locale.getFormattedString('meta.duration', [min, sec]);
				} else {
					document.getElementById('meta_duration').value = '';
				}
			}

			// Pre-populate metadata
			document.getElementById('single_title').value = p.title;
			document.getElementById('single_description').value = p.description;
			document.getElementById('single_tags').value = p.tags;
			document.getElementById('single_is_public').value = p.is_public;
			document.getElementById('single_is_friend').checked = 1 == p.is_friend;
			document.getElementById('single_is_family').checked = 1 == p.is_family;
			document.getElementById('single_content_type').value = p.content_type;
			document.getElementById('single_hidden').value = p.hidden;
			document.getElementById('single_safety_level').value = p.safety_level;

			// Sets list
			var ul = document.getElementById('single_sets_added');
			while (ul.hasChildNodes()) {
				ul.removeChild(ul.firstChild);
			}
			var ii = p.sets.length;
			if (0 == ii) {
				var li = document.createElementNS(NS_HTML, 'li');
				li.className = 'sets_none';
				li.appendChild(document.createTextNode(
					locale.getString('meta.sets.added.none')));
				ul.appendChild(li);
			} else {
				for (var i = 0; i < ii; ++i) {
					document.getElementById('single_sets_add_' + p.sets[i])
						.className = 'sets_disabled';
					var li = document.createElementNS(NS_HTML, 'li');
					li.id = 'single_sets_added_' + p.sets[i];
					li.className = 'sets_trash';
					li.appendChild(document.createTextNode(
						meta.sets[p.sets[i]].title));
					ul.appendChild(li);
				}
			}
			document.getElementById('single_sets_create').style.display =
				meta.created_sets == users.sets ? 'none' : 'block';
		}

		// Send the selected photos list to extensions
		extension.after_select.exec(photos.selected);
		unblock_normalize();
	},

	// Save photo metadata from the DOM into JS
	save: function(id) {

		// Save a partial batch into the selected photos
		block_normalize();
		if (null == id) {
			var ii = photos.selected.length;
			for (var i = 0; i < ii; ++i) {
				var p = photos.list[photos.selected[i]];
				if (null == p) {
					unblock_normalize();
					return;
				}

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
				p.tags = meta.tags(p.tags,
					document.getElementById('batch_tags').value);

				// Overwrite privacy, content type, hidden and safety level
				var is_public = parseInt(document.getElementById('batch_is_public').value);
				if (2 != is_public) {
					p.is_public = is_public;
					p.is_friend = document.getElementById('batch_is_friend').checked ? 1 : 0;
					p.is_family = document.getElementById('batch_is_family').checked ? 1 : 0;
				}
				var content_type = parseInt(document.getElementById('batch_content_type').value);
				if (0 != content_type) {
					p.content_type = content_type;
				}
				var hidden = parseInt(document.getElementById('batch_hidden').value);
				if (0 != hidden) {
					p.hidden = hidden;
				}
				var safety_level = parseInt(document.getElementById('batch_safety_level').value);
				if (0 != safety_level) {
					p.safety_level = safety_level;
				}
			}
		}

		// Save a single photo
		else {
			var p = photos.list[id];
			if (null == p) {
				unblock_normalize();
				return;
			}
			p.title = document.getElementById('single_title').value;
			p.description = document.getElementById('single_description').value;
			p.tags = document.getElementById('single_tags').value;
			p.is_public = parseInt(document.getElementById('single_is_public').value);
			p.is_friend = document.getElementById('single_is_friend').checked ? 1 : 0;
			p.is_family = document.getElementById('single_is_family').checked ? 1 : 0;
			p.content_type = parseInt(document.getElementById('single_content_type').value);
			p.hidden = parseInt(document.getElementById('single_hidden').value);
			p.safety_level = parseInt(document.getElementById('single_safety_level').value);
		}

		// Send the selected photos list to extensions
		extension.after_edit.exec(photos.selected);
		unblock_normalize();
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

		// Only allow rotation for photos or mixed selections
		var have_photos = false;
		block_normalize();
		for each (var i in photos.selected) {
			if (null == photos.list[i]) {
				continue;
			}
			have_photos = photos.is_photo(photos.list[i].path) ? true : have_photos;
		}
		unblock_normalize();
		if (have_photos) {
			document.getElementById('t_rotate_l').className = 'enabled';
			document.getElementById('t_rotate_r').className = 'enabled';
		}

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
		block_normalize();
		var prefix = 1 == photos.selected.length ? 'single' : 'batch';
		unblock_normalize();
        
		if (1 == parseInt(value)) {
			meta.last_private_settings = document.getElementById(prefix + '_is_friend').checked | (document.getElementById(prefix + '_is_family').checked << 1);
			document.getElementById(prefix + '_is_friend').checked = false;
			document.getElementById(prefix + '_is_family').checked = false;
			document.getElementById(prefix + '_is_friend').disabled = true;
			document.getElementById(prefix + '_is_family').disabled = true;
		} else {
		    if (document.getElementById(prefix + '_is_friend').disabled === true) {
			    document.getElementById(prefix + '_is_friend').disabled = false;
			    document.getElementById(prefix + '_is_friend').checked = meta.last_private_settings & 1;
		    }
		    if (document.getElementById(prefix + '_is_family').disabled === true) {
			    document.getElementById(prefix + '_is_family').disabled = false;
			    document.getElementById(prefix + '_is_family').checked = meta.last_private_settings & 2;
		    }
		}
	},

	// If a user leaves a partial batch before committing, warn them
	//   If conf.confirm_save_batch is off, this will always save rather than abandon
	abandon: function() {
	    block_normalize();
	    var batchSelected = (1 < photos.selected.length);
	    unblock_normalize();
		if ('-moz-box' == document.getElementById('batch_meta').style.display &&
			batchSelected) {
			if (conf.confirm_save_batch) {
				if (confirm(locale.getString('meta.abandon.text'),
					locale.getString('meta.abandon.title'),
					locale.getString('meta.abandon.ok'),
					locale.getString('meta.abandon.cancel'))) {
					meta.save();
					meta.load();
				}
			} else {
				meta.save();
				meta.load();
			}
		}
	},

	// Parse a string into an array of tags
	tags: function() {
		var out = [];
		var out_delim = ' ';
		var ii = arguments.length;
		for (var i = 0; i < ii; ++i) {
			var str = arguments[i];
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
				out_delim = ', ';
			}
			var jj = arr.length;
			for (var j = 0; j < jj; ++j) {
				if (arr[j]) {
					var tmp = meta.tags_untransform(arr[j]);
					if (-1 == out.indexOf(tmp)) { out.push(tmp); }
				}
			}
		}
		return out.join(out_delim);
	},

	// Transform and untransform tags for splitting
	tags_transform: function(tag) {
		var match;
		while (match = /(\s+)/.exec(tag)) {
			tag = tag.replace(/\s+/,
				'{WHITESPACE-' + match[1].charCodeAt(0) + '}');
		}
		while (/,/.test(tag)) {
			var match = /(,)/.exec(tag);
			tag = tag.replace(/,/, '{COMMA}');
		}
		return tag;
	},
	tags_untransform: function(tag) {
		var match;
		var quotes = false;
		while (match = /\{WHITESPACE-([0-9]+)\}/.exec(tag)) {
			tag = tag.replace(/\{WHITESPACE-[0-9]+\}/,
				String.fromCharCode(parseInt(match[1])));
			quotes = true;
		}
		while (/\{COMMA\}/.test(tag)) {
			var match = /\{COMMA\}/.exec(tag);
			tag = tag.replace(/\{COMMA\}/, ',');
			quotes = true;
		}
		return (quotes ? '"' : '') + tag.replace(/^\s+/, '')
			.replace(/\s+$/, '') + (quotes ? '"' : '');
	},

	// Create a new set if we have any left
	create_set: function() {
		if (-1 == users.sets || 0 < users.sets) {
			var result = {};
			window.openDialog('chrome://uploadr/content/set.xul',
				'dialog_set', 'chrome,modal', result);
			var name = result.name;
			var desc = result.desc;
			if (!name) { return; }
			var currentSets = meta.sets.map(function(x) {return (x ? x.title : "");});
			if (currentSets.indexOf(name) != -1) {
			    return;
			}
			meta.sets.push({
				title: name, // Sorry
				description: desc,
				busy: false,
				add: []
			});
			++meta.created_sets;
			var prefixes = ['single', 'batch'];
			for each (var prefix in prefixes) {
				var ul = document.getElementById(prefix + '_sets_add');
				if ('sets_none' == ul.firstChild.className) {
					ul.removeChild(ul.firstChild);
				}
				var li = document.createElementNS(NS_HTML, 'li');
				li.id = prefix + '_sets_add_' + (meta.sets.length - 1);
				li.className = 'sets_plus';
				li.style.fontWeight = 'bold';
				li.appendChild(document.createTextNode(name));
				ul.insertBefore(li, ul.firstChild);
			}
			block_normalize();
			var prefix = 1 == photos.selected.length ? 'single' : 'batch';
			unblock_normalize();
			meta.add_to_set({target:
				document.getElementById(prefix + '_sets_add').firstChild});
			if (meta.created_sets == users.sets) {
				document.getElementById(prefix + '_sets_create')
					.style.visibility = 'hidden';
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
		li.className = 'sets_disabled';
		var set_index = parseInt(li.id.replace(/^(single|batch)_sets_add_/,
			''));
		var title = li.firstChild.nodeValue;

		// Add each selected photo to this set
		block_normalize();
		var ii = photos.selected.length;
		for (var i = 0; i < ii; ++i) {
			var p = photos.list[photos.selected[i]];
			if (null != p && -1 == p.sets.indexOf(set_index)) {
				p.sets.push(set_index);
			}
		}
        
		// Update the UI
		var prefix = 1 == photos.selected.length ? 'single' : 'batch';
		unblock_normalize();
		var ul = document.getElementById(prefix + '_sets_added');
		if ('sets_none' == ul.firstChild.className) {
			ul.removeChild(ul.firstChild);
		}
		var li = document.createElementNS(NS_HTML, 'li');
		li.id = prefix + '_sets_added_' + set_index;
		li.className = 'sets_trash';
		li.appendChild(document.createTextNode(title));
		ul.appendChild(li);

	},

	remove_from_set: function(e) {

		// Get the item that was clicked
		if ('li' != e.target.nodeName || 'sets_trash' != e.target.className) {
			return;
		}
		var li = e.target;
		var set_index = parseInt(li.id.replace(/^(single|batch)_sets_added_/,
			''));
		var name = li.firstChild.nodeValue;

		// Remove each selected photo from this set
		block_normalize();
		var ii = photos.selected.length;
		for (var i = 0; i < ii; ++i) {
			var p = photos.list[photos.selected[i]];
			if (null == p) { continue; }
			var new_sets = [];
			var jj = p.sets.length;
			for (var j = 0; j < jj; ++j) {
				if (set_index != p.sets[j]) {
					new_sets.push(p.sets[j]);
				}
			}
			p.sets = new_sets;
		}
        
		// Update the UI
		li.parentNode.removeChild(li);
		var prefix = 1 == photos.selected.length ? 'single' : 'batch';
		unblock_normalize();
		var ul = document.getElementById(prefix + '_sets_added');
		if (0 == ul.getElementsByTagName('li').length) {
			li = document.createElementNS(NS_HTML, 'li');
			li.className = 'sets_none';
			li.appendChild(document.createTextNode(
				locale.getString('meta.sets.added.none')));
			ul.appendChild(li);
		}
		document.getElementById(prefix + '_sets_add_' + set_index)
			.className = 'sets_plus';

	},

	// Note default values in the meta panes
	defaults: function(map) {

		// Update the UI
		var def = ' ' + locale.getString('meta.default');
		for (var m in map) {
			for each (var prefix in ['single_', 'batch_']) {
				var node = document.getElementById(prefix + m);
				var loop = true;
				if ('menulist' == node.nodeName) {
					node = node.getElementsByTagName('menupopup')[0]
						.getElementsByTagName('menuitem');
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

		// Go through photos and turn null/NaN into these defaults
		//   Null/NaN shows up on photos added before a user was logged in
		block_normalize();
		var ii = photos.list.length;
		for (var i = 0; i < ii; ++i) {
			var p = photos.list[i];
			if (null != p) {
				for (var m in map) {
					if (isNaN(p[m]) || null == p[m]) {
						p[m] = map[m];
					}
				}
			}
		}
		unblock_normalize();
	},

	// Only show sets to logged-in users
	login: function() {
		document.getElementById('hide_single_sets').style.display = '-moz-box';
		document.getElementById('hide_batch_sets').style.display = '-moz-box';
		document.getElementById('hide_single_explain').style.display = 'none';
		document.getElementById('hide_batch_explain').style.display = 'none';
	},
	logout: function() {
		document.getElementById('hide_single_sets').style.display = 'none';
		document.getElementById('hide_batch_sets').style.display = 'none';
		document.getElementById('hide_single_explain').style.display = '-moz-box';
		document.getElementById('hide_batch_explain').style.display = '-moz-box';
	},

	// Enforce the no-restricted-videos policy
	restricted: function(value) {
		if (3 == parseInt(value)) {

			// Tally up photos and videos
			var p_count = 0;
			var v_count = 0;
			block_normalize();
			for each (var id in photos.selected) {
				var p = photos.list[id];
				if (null == p) {
					continue;
				}
				if (photos.is_photo(p.path)) {
					++p_count;
				} else if (photos.is_video(p.path)) {
					++v_count;
				}
			}
			unblock_normalize();
			// If there are videos then bother them
			if (v_count) {
				var result = {};

				// Decide the plurality string
				//   Each dialog has identical strings but they're coded
				//   as follows for varied pluralities:
				//     XXX.sz.XXX: singular video, zero photos
				//     XXX.sz.XXX: plural videos, zero photos
				//     XXX.pp.XXX: singular video, plural photos
				//     XXX.pp.XXX: plural videos, plural photos
				//   Some strings appear in more than one place and use
				//   'a' to indicate they're reused (not yet, but maybe)
				var pl = (1 == v_count ? 's' : 'p') + (0 == p_count ? 'z' : 'p');

				// Aforementioned bothering
				window.openDialog(
					'chrome://uploadr/content/video_restricted.xul',
					'dialog_video_restricted', 'chrome,modal',
					locale.getString('video.edit.restricted.' + pl + '.title'),
					locale.getString('video.edit.restricted.' + pl + '.explain'),
					locale.getString('video.edit.restricted.' + pl + '.action'),
					locale.getString('video.edit.restricted.' + pl + '.note'),
					locale.getString('video.edit.restricted.' + pl + '.guidelines'),
					locale.getString('video.edit.restricted.' + pl + '.ok'),
					locale.getString('video.edit.restricted.' + pl + '.cancel'),
					'', result);

				// Remove selected videos and restrict selected photos
				if ('cancel' == result.result) {
					var new_selected = [];
					block_normalize();
					for each (var id in photos.selected) {
						if (null == photos.list[id]) { continue; }

						// Remove videos
						if (photos.is_video(photos.list[id].path)) {
							var li = document.getElementById('photo' + id);
							li.parentNode.removeChild(li);
							photos.batch_size -= photos.list[id].size;
							photos.video_batch_size -= photos.list[id].size;
							if (users.nsid && !users.is_pro &&
								users.bandwidth &&
								0 < users.bandwidth.remaining -
								photos.batch_size + photos.video_batch_size) {
								status.clear();
							}
							photos.list[id] = null;
							--photos.count;
							--photos.videoCount;
						}

						// Restrict photos
						else {
							new_selected.push(id);
							photos.list[id].safety_level = 3;
						}

					}
					ui.bandwidth_updated();
					photos.selected = new_selected;
					if (photos.selected.length) {
						if (1 == photos.selected.length) {
							meta.load(photos.selected[0]);
							meta.enable();
						} else {
							meta.load();
							meta.batch();
						}
					} else {
						meta.disable();
						photos._remove();
					}
					unblock_normalize();
					// If remove is blocked then we know photos.normalize
					// will be called as it is unblocked
					//   We're breaking the rules a bit here but the rules
					//   are just for the UI
					if (0 == _block_remove) { photos.normalize(); }

				}

				// Set a different safety level for videos
				//   This will be applied when the selection changes,
				//   just like always
				else if ('ok' == result.result && result.safety_level) {

					// Update the safety level of only the videos
					block_normalize();
					for each (var id in photos.selected) {
						if (null == photos.list[id]) { continue; }
						if (photos.is_video(photos.list[id].path)) {
							photos.list[id].safety_level =
								result.safety_level;
						} else {
							photos.list[id].safety_level = 3;
						}
					}
					// If just one video is selected adjust the safety level
					if (1 == photos.selected.length) {
						document.getElementById('single_safety_level')
							.value = result.safety_level;
					}
					// If multiple photos are selected, indicate the safety
					// level inconsistency in the display
					else {
						var safety_level = document.getElementById(
							'batch_safety_level');
						safety_level.value = 0;
						safety_level.selectedItem.label =
							locale.getString('video.safety_level.mixed');
					}
					unblock_normalize();
				}

			}

		}

		// If they select something besides restricted, clean up
		else {
			document.getElementById('batch_safety_level')
				.getElementsByTagName('menupopup')[0]
				.getElementsByTagName('menuitem')[0].label = '';
		}

	}

};
