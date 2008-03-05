/*
 * Flickr Uploadr
 *
 * Copyright (c) 2007-2008 Yahoo! Inc.  All rights reserved.  This library is
 * free software; you can redistribute it and/or modify it under the terms of
 * the GNU General Public License (GPL), version 2 only.  This library is
 * distributed WITHOUT ANY WARRANTY, whether express or implied. See the GNU
 * GPL for more details (http://www.gnu.org/licenses/gpl.html)
 */

// API wrapped up with a bow
var wrap = {

	// Authentication - don't use this directly, use users.login()
	auth: {

		checkToken: function(token) {
			flickr.auth.checkToken(wrap.auth._checkToken, token);
		},
		_checkToken: function(rsp) {
			if ('object' != typeof rsp || 'ok' != rsp.getAttribute('stat')) {
				users.logout(false);
			} else {
				users.token = rsp.getElementsByTagName('token')[0]
					.firstChild.nodeValue;
				var user = rsp.getElementsByTagName('user')[0];
				users.nsid = user.getAttribute('nsid');
				users.username = user.getAttribute('username');

				// Complete the login process
				users._login();

			}
			buttons.login.enable();
		},

		getFrob: function(fresh) {
			flickr.auth.getFrob(wrap.auth._getFrob, fresh);
		},
		_getFrob: function(rsp, fresh) {
			if ('object' != typeof rsp || 'ok' != rsp.getAttribute('stat')) {

				// Explain what's going on
				alert(locale.getString('auth.error.text'),
					locale.getString('auth.error.title'));

				users.logout(false);
			} else {
				users.frob = rsp.getElementsByTagName('frob')[0]
					.firstChild.nodeValue;
				if (!confirm(locale.getString('auth.prompt.text'),
					locale.getString('auth.prompt.title'),
					locale.getString('auth.prompt.ok'),
					locale.getString('auth.prompt.cancel'))) {
					buttons.login.enable();
					return;
				}
				var url = api.start({
					'perms': 'write',
					'frob': users.frob,
				}, 'http://' + SITE_HOST + '/services/auth/' +
					(fresh ? 'fresh/' : ''), true);
				document.getElementById('auth_url').value = url;
				pages.go('auth');
			}
			buttons.login.enable();
		},

		getToken: function(frob) {
			flickr.auth.getToken(wrap.auth._getToken, frob);
		},
		_getToken: function(rsp) {
			if ('object' != typeof rsp || 'ok' != rsp.getAttribute('stat')) {
				users.logout(false);
			} else {
				users.token = rsp.getElementsByTagName('token')[0]
					.firstChild.nodeValue;
				var user = rsp.getElementsByTagName('user')[0];
				users.nsid = user.getAttribute('nsid');
				users.username = user.getAttribute('username');

				// Complete the login process
				users._login();

			}
		}

	},

	// Like the auth section, this is used by users.login() and won't
	// need to be called
	people: {

		// Sets up the photostream header
		getInfo: function(token, nsid) {
			flickr.people.getInfo(wrap.people._getInfo, token, nsid);
		},
		_getInfo: function(rsp, nsid) {
			if ('object' == typeof rsp && 'ok' == rsp.getAttribute('stat')) {
				var p = rsp.getElementsByTagName('person')[0];
				var s = p.getAttribute('iconserver');
				if (0 != parseInt(s)) {
					document.getElementById('buddyicon').src =
						'http://farm' + p.getAttribute('iconfarm') +
						'.static.flickr.com/' + s + '/buddyicons/' +
						nsid + '.jpg';
				} else {
					document.getElementById('buddyicon').src =
						'http://flickr.com/images/buddyicon.jpg';
				}
				if (1 == parseInt(p.getAttribute('ispro'))) {
					document.getElementById('photostream_pro')
						.style.display = 'inline';
				} else {
					document.getElementById('photostream_pro')
						.style.display = 'none';
				}
			}
		},

		getUploadStatus: function(token) {
			flickr.people.getUploadStatus(wrap.people._getUploadStatus,
				token);
		},
		_getUploadStatus: function(rsp) {
			if ('object' != typeof rsp || 'ok' != rsp.getAttribute('stat')) {

				// This can cause infinite looping, so stoppit
				//wrap.people.getUploadStatus();

			} else {
				var user = rsp.getElementsByTagName('user')[0];
				users.is_pro = 1 == parseInt(user.getAttribute('ispro'));
				var bw = user.getElementsByTagName('bandwidth')[0];
				if (1 == parseInt(bw.getAttribute('unlimited'))) {
					users.bandwidth = null;
				} else {
					users.bandwidth = {
						total: parseInt(bw.getAttribute('maxkb')),
						used: parseInt(bw.getAttribute('usedkb')),
						remaining: parseInt(bw.getAttribute('remainingkb'))
					};
				}
				users.filesize = parseInt(user.getElementsByTagName(
					'filesize')[0].getAttribute('maxkb'));
				sets = user.getElementsByTagName('sets')[0]
					.getAttribute('remaining');
				if ('lots' == sets) {
					users.sets = -1;
				} else {
					users.sets = parseInt(sets);
				}
				ui.users_updated();
				users.update();
			}
			buttons.upload.enable();
		}

	},

	photos: {

		upload: {

			checkTickets: function(token, tickets) {
				block_exit();
				flickr.photos.upload.checkTickets(
					wrap.photos.upload._checkTickets, token, tickets);
			},
			_checkTickets: function(rsp) {
				var again = false;
				if ('object' == typeof rsp &&
					'ok' == rsp.getAttribute('stat')) {
					upload.tickets_retry = 0;
					var tickets = rsp.getElementsByTagName('uploader')[0]
						.getElementsByTagName('ticket');
					var ii = tickets.length;
					for (var i = 0; i < ii; ++i) {
						var ticket_id = tickets[i].getAttribute('id');
						var complete = parseInt(tickets[i]
							.getAttribute('complete'));
						if ('undefined' != typeof upload.tickets[ticket_id]) {

							// Error'd photo
							if (2 == complete) {
								--upload.tickets_count;
								upload._sync(false, upload.tickets[ticket_id]);
								delete upload.tickets[ticket_id];
							}

							// Completed photo
							else if (1 == complete) {
								--upload.tickets_count;

								// Check this photo against stored timestamps
								var imported = parseInt(tickets[i]
									.getAttribute('imported'));
								if (0 == upload.timestamps.earliest ||
									imported < upload.timestamps.earliest) {
									upload.timestamps.earliest = imported;
								}
								if (0 == upload.timestamps.latest ||
									imported > upload.timestamps.latest) {
									upload.timestamps.latest = imported;
								}

								upload._sync(parseInt(tickets[i]
									.getAttribute('photoid')),
									upload.tickets[ticket_id]);
								delete upload.tickets[ticket_id];
							}

							// Incomplete photos need to keep spinning
							else {
								again = true;
							}

						}
					}
				}

				// Error'd checkTickets need to keep spinning
				else {
					again = true;
				}

				if (again) {

					// Valid response or still have retries remaining
					if ('object' == typeof rsp) {
						upload._check_tickets();
					} else if (conf.tickets_retry_count >
						upload.tickets_retry_count) {
						++upload.tickets_retry_count;
						upload._check_tickets();
					}

					// Need to call it quits
					else {
						upload.cancel = true;
						upload.tickets_count = 0;
						upload.tickets = {};
						upload.done();
					}

				}
				unblock_exit();
			}

		}

	},

	photosets: {

		addPhoto: function(token, photoset_id, photo_id){
			block_exit();
			flickr.photosets.addPhoto(wrap.photosets._addPhoto,
				token, photoset_id, photo_id);
		},
		_addPhoto: function(rsp, id) {
			if ('object' != typeof rsp || 'ok' != rsp.getAttribute('stat')) {
				photos.sets = false;
			}
			meta.sets_map[id].shift();
			if (0 != meta.sets_map[id].length) {
				wrap.photosets.addPhoto(id, meta.sets_map[id][0]);
			} else {
				upload.finalize();
			}
			unblock_exit();
		},

		create: function(token, title, description, primary_photo_id) {
			block_exit();
			flickr.photosets.create(wrap.photosets._create,
				token, title, description, primary_photo_id);
		},
		_create: function(rsp, id) {
			meta.sets_map[id].shift();
			if ('object' != typeof rsp || 'ok' != rsp.getAttribute('stat')) {
				photos.sets = false;
				meta.sets_map[id] = [];
				upload.finalize();
			} else {

				// Update the map with this new set ID
				var list = meta.sets_map[id];
				var set_id = rsp.getElementsByTagName('photoset')[0]
					.getAttribute('id');
				meta.sets_map[set_id] = list;
				delete meta.sets_map[id];

				// Remove this from the list of sets to be created
				var index = meta.created_sets.indexOf(id);
				meta.created_sets[index] = null;
				meta.created_sets_desc[index] = null;

				// Update remaining photos in case we fail
				var ii = photos.failed.length;
				for (var i = 0; i < ii; ++i) {
					var index = photos.failed[i].sets.indexOf(id);
					if (-1 != index) {
						photos.failed[i].sets[index] = set_id;
					}
				}
				var ii = photos.uploading.length;
				for (var i = 0; i < ii; ++i) {
					if (null != photos.uploading[i]) {
						var index = photos.uploading[i].sets.indexOf(id);
						if (-1 != index) {
							photos.uploading[i].sets[index] = set_id;
						}
					}
				}

				if (0 != meta.sets_map[set_id].length) {
					wrap.photosets.addPhoto(set_id,
						meta.sets_map[set_id][0]);
				} else {
					upload.finalize();
				}
			}
			unblock_exit();
		},

		getList: function(token, nsid) {
			flickr.photosets.getList(wrap.photosets._getList, token, nsid);
		},
		_getList: function(rsp) {
			if ('object' == typeof rsp && 'ok' == rsp.getAttribute('stat')) {
				meta.sets = {};
				var sets = rsp.getElementsByTagName('photosets')[0]
					.getElementsByTagName('photoset');
				var ii = sets.length;
				var order = [];
				for (var i = 0; i < ii; ++i) {
					order.push([sets[i].getAttribute('id'),
						sets[i].getElementsByTagName('title')[0]
						.firstChild.nodeValue]);
				}
				order.sort(function(a, b) {
					return a[1].toLowerCase() > b[1].toLowerCase();
				});
				for each (var name in meta.created_sets) {
					meta.sets[name] = name;
				}
				for (var i = 0; i < ii; ++i) {
					meta.sets[order[i][0]] = order[i][1];
				}
				var prefixes = ['single', 'batch'];
				for each (var prefix in prefixes) {
					var ul = document.getElementById(prefix + '_sets_add');
					while (ul.hasChildNodes()) {
						ul.removeChild(ul.firstChild);
					}
					if (0 == ii && 0 == meta.created_sets.length) {
						var li = document.createElementNS(NS_HTML, 'li');
						li.className = 'sets_none';
						li.appendChild(document.createTextNode(
							locale.getString('meta.sets.add.none')));
						ul.appendChild(li);
					} else {
						for (var set_id in meta.sets) {
							var li = document.createElementNS(NS_HTML, 'li');
							li.id = prefix + '_sets_add_' + set_id;
							li.className = 'sets_plus';
							li.appendChild(document.createTextNode(
								meta.sets[set_id]));
							ul.appendChild(li);
						}
					}
				}

				// Update a single selected photo
				if (1 == photos.selected.length) {
					var ul = document.getElementById('single_sets_added');
					var p = photos.list[photos.selected[0]];
					var ii = p.sets.length;
					if (0 != ii) {
						while (ul.hasChildNodes()) {
							ul.removeChild(ul.firstChild);
						}
						for (var i = 0; i < ii; ++i) {
							var li = document.createElementNS(NS_HTML, 'li');
							li.id = 'single_sets_' + p.sets[i];
							li.className = 'sets_trash';
							li.appendChild(document.createTextNode(
								meta.sets[p.sets[i]]));
							ul.appendChild(li);
						}
					}
				}

			}
			status.clear();
		}

	},

	// Preferences are fetched from the site when no stored version can be found
	prefs: {

		getContentType: function(token) {
			flickr.prefs.getContentType(wrap.prefs._getContentType, token);
		},
		_getContentType: function(rsp) {
			if ('object' == typeof rsp && 'ok' == rsp.getAttribute('stat')) {
				settings.content_type =
					parseInt(rsp.getElementsByTagName('person')[0]
					.getAttribute('content_type'));
				settings.save();
				meta.defaults({content_type: settings.content_type});
			}
		},

		getHidden: function(token) {
			flickr.prefs.getHidden(wrap.prefs._getHidden, token);
		},
		_getHidden: function(rsp) {
			if ('object' == typeof rsp && 'ok' == rsp.getAttribute('stat')) {
				settings.hidden =
					parseInt(rsp.getElementsByTagName('person')[0]
					.getAttribute('hidden'));
				settings.save();
				meta.defaults({hidden: settings.hidden});
			}
		},

		getPrivacy: function(token) {
			flickr.prefs.getPrivacy(wrap.prefs._getPrivacy, token);
		},
		_getPrivacy: function(rsp) {
			if ('object' == typeof rsp && 'ok' == rsp.getAttribute('stat')) {
				var privacy =
					parseInt(rsp.getElementsByTagName('person')[0]
					.getAttribute('privacy'));
				settings.is_public = 1 == privacy ? 1 : 0;
				settings.is_friend = 2 == privacy || 4 == privacy ? 1 : 0;
				settings.is_family = 3 == privacy || 4 == privacy ? 1 : 0;
				settings.save();
				meta.defaults({
					is_public: settings.is_public,
					is_friend: settings.is_friend,
					is_family: settings.is_family
				});
			}
		},

		getSafetyLevel: function(token) {
			flickr.prefs.getSafetyLevel(wrap.prefs.getSafetyLevel, token);
		},
		_getSafetyLevel: function(rsp) {
			if ('object' == typeof rsp && 'ok' == rsp.getAttribute('stat')) {
				settings.safety_level =
					parseInt(rsp.getElementsByTagName('person')[0]
					.getAttribute('safety_level'));
				settings.save();
				meta.defaults({safety_level: settings.safety_level});
			}
		}

	},

	utils: {

		logUploadStats: function(token, source, num_photos, upload_time,
			bytes, errors) {
			flickr.utils.logUploadStats(null, token, source, num_photos,
				upload_time, bytes, errors)
		}

	}

};