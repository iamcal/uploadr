/*
 * Flickr Uploadr
 *
 * Copyright (c) 2007-2009 Yahoo! Inc.  All rights reserved.  This library is
 * free software; you can redistribute it and/or modify it under the terms of
 * the GNU General Public License (GPL), version 2 only.  This library is
 * distributed WITHOUT ANY WARRANTY, whether express or implied. See the GNU
 * GPL for more details (http://www.gnu.org/licenses/gpl.html)
 */

var grid = {

	// Base locations for grid calculations (pixels)
	base: {
		x: 5,
		y: 100
	},

	// How many photos are in each full row?
	width: function() {
		block_normalize();
		var p = photos.list;
		var top = -1;
		var width = 0;
		for (var i = p.length; i >= 0; --i) {
			if (null != p[i]) {
				var test = document.getElementById('photo' + i).offsetTop;
				if (-1 != top && test > top) {
					return width;
				}
				top = test;
				++width;
			}
		}
		unblock_normalize();
		return 0;
	},

	// Get photos in a bounding box
	bounding_box: function(x1, y1, x2, y2) {
		const OFFSET_X = -mouse.box.x - grid.base.x;
		const OFFSET_Y = -mouse.box.y - grid.base.y;
		var pos = {x: {}, y: {}};
		mouse.box.getPosition(pos.x, pos.y);

		// Get our points in order
		if (x2 < x1) {
			var tmp = x2;
			x2 = x1;
			x1 = tmp;
		}
		if (y2 < y1) {
			var tmp = y2;
			y2 = y1;
			y1 = tmp;
		}

		// Walk the photos and see which are in the box
		block_normalize();
		var p = photos.list;
		for (var i = p.length; i >= 0; --i) {
			if (null != p[i]) {
				var img = document.getElementById('photo' + i)
					.getElementsByTagName('img')[0];
				if (-1 == img.className.indexOf('error')
					&& -1 == img.className.indexOf('loading')) {
					if (img.offsetLeft + OFFSET_X + img.width >= x1 &&
						img.offsetLeft + OFFSET_X <= x2 &&
						img.offsetTop + OFFSET_Y + img.height >= y1 &&
						img.offsetTop + OFFSET_Y <= y2) {
						img.className = 'selecting';
					} else {
						img.className = '';
					}
				}
			}
		}
        unblock_normalize();
	}

};