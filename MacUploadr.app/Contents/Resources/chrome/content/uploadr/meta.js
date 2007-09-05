var meta = {

	// Load a photo's metadata from JS into the DOM
	load: function(id) {
		var p = photos.list[id];
		document.getElementById('p_title').value = p.title;
		document.getElementById('p_description').value = p.description;
		document.getElementById('p_tags').value = p.tags;
		document.getElementById('p_is_public').value = p.is_public;
		document.getElementById('p_is_friend').checked = 1 == p.is_friend;
		document.getElementById('p_is_family').checked = 1 == p.is_family;
		document.getElementById('p_content_type').selectedIndex = p.content_type - 1;
		document.getElementById('p_hidden').selectedIndex = p.hidden - 1;
		document.getElementById('p_safety_level').selectedIndex = p.safety_level - 1;
	},

	// Save a photo's metadata from the DOM into JS
	save: function(id) {
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
	},

	// Enable the right-side metadata column on the photos page
	enable: function() {
		document.getElementById('p_title').disabled = false;
		document.getElementById('p_description').disabled = false;
		document.getElementById('p_tags').disabled = false;
		var is_public = document.getElementById('p_is_public');
		is_public.disabled = false;
		var dis = 1 == parseInt(is_public.value);
		document.getElementById('p_is_friend').disabled = dis;
		document.getElementById('p_is_family').disabled = dis;
		document.getElementById('p_content_type').disabled = false;
		document.getElementById('p_hidden').disabled = false;
		document.getElementById('p_safety_level').disabled = false;
	},

	// Disable the right-side metadata column on the photos page
	disable: function() {
		document.getElementById('main').focus();
		document.getElementById('p_title').value = '';
		document.getElementById('p_title').disabled = true;
		document.getElementById('p_description').value = '';
		document.getElementById('p_description').disabled = true;
		document.getElementById('p_tags').value = '';
		document.getElementById('p_tags').disabled = true;
		document.getElementById('p_is_public').value = true;
		document.getElementById('p_is_public').disabled = true;
		document.getElementById('p_is_friend').checked = false;
		document.getElementById('p_is_friend').disabled = true;
		document.getElementById('p_is_family').checked = false;
		document.getElementById('p_is_family').disabled = true;
		document.getElementById('p_content_type').disabled = true;
		document.getElementById('p_hidden').disabled = true;
		document.getElementById('p_safety_level').disabled = true;
	}

};