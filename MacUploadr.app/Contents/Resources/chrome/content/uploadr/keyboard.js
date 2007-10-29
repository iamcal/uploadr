var keyboard = {

	// Reference to the currently focused text field
	_select_all: null,

	// Select all photos or all text
	select_all: function() {
		if (null == keyboard._select_all) {
			if (0 == photos.count) {
				return;
			}
			photos.selected = [];
			var p = photos.list;
			var ii = p.length;
			for (var i = 0; i < ii; ++i) {
				photos.selected.push(p[i].id);
			}
			var list = document.getElementById('photos_list').getElementsByTagName('li');
			ii = list.length;
			for (var i = 0; i < ii; ++i) {
				var img = list[i].getElementsByTagName('img')[0];
				if ('error' != img.className && 'loading' != img.className) {
					img.className = 'selected';
				}
			}
			meta.batch();
		} else {
			keyboard._select_all.select();
		}
	},

	// Events for pressed arrow keys
	arrows: {

		up: function(e) {
			keyboard.arrows._arrow(e, grid.width());
		},

		right: function(e) {
			keyboard.arrows._arrow(e, -1);
		},

		down: function(e) {
			keyboard.arrows._arrow(e, -grid.width());
		},

		left: function(e) {
			keyboard.arrows._arrow(e, 1);
		},

		// Abstract away the actual arrow key actions
		_arrow: function(e, inc) {
			if ('photos' != pages.current() || null == photos.last) {
				return;
			}
			var i = photos.last + inc;
			var next = photos.list[i];
			i = photos.last + inc;
			var ii = photos.list.length;
			while (null == next && i >= 0 && i < ii) {
				next = photos.list[i];
				i = photos.last + inc;
			}
			if (null != next) {
				mouse.click({
					target: document.getElementById('photo' + next.id).getElementsByTagName('img')[0],
					shiftKey: e.shiftKey,
					ctrlKey: e.ctrlKey,
					metaKey: e.metaKey
				});
			}
		}

	}

};