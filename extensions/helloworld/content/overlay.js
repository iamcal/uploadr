// Flickr Uploadr Extension API Example
// Richard Crowley
// 2008-03-21

// Based on MozillaZine's Hello World extension.  I highly recommend reading
// through their article before diving in:
//   http://kb.mozillazine.org/Getting_started_with_extension_development

// Uploadr has special hooks that you can use to add functionality at
// common points.  This is the documentation for those hooks.  Outside
// of these, regular DOM scripting can handle everything else.

// Every hook has an add method and a remove method.  The return value of
// the add method is the argument to the remove method.  This allows
// functionality equivalent to addEventListener and removeEventListener
// without all the typing.
var my_after_login = extension.after_login.add(function(user) { /*...*/ });
extension.after_login.remove(my_after_login);

// After login: called after a user's token is fetched/verified.  Note that
// this does not mean that all user information has returned from the API.
//   Callback argument: User object
//   See also: users.js
extension.after_login.add(function(user) {
	Cc['@mozilla.org/consoleservice;1'].getService(Ci.nsIConsoleService)
		.logStringMessage('after_login! user: ' + user.toSource());
});

// After add: called after a group of photos are added to Uploadr.
//   Callback argument: array of Photo objects
//   See also: photos.js
extension.after_add.add(function(list) {
	Cc['@mozilla.org/consoleservice;1'].getService(Ci.nsIConsoleService)
		.logStringMessage('after_add! list: ' + list.toSource());
});

// After thumb: called after the background thread finishes creating a
// thumbnail.
//   Callback argument: index into the photos.list array
//   See also: photos.js
extension.after_thumb.add(function(id) {
	Cc['@mozilla.org/consoleservice;1'].getService(Ci.nsIConsoleService)
		.logStringMessage('after_thumb! id: ' + id);
});

// Before remove: called before a group of photos is removed.
//   Callback argument: array of indices into the photos.list array
//   See also: photos.js
extension.before_remove.add(function(list) {
	Cc['@mozilla.org/consoleservice;1'].getService(Ci.nsIConsoleService)
		.logStringMessage('before_remove! list: ' + list.toSource());
});

// After select: called after the set of selected photos changes.
//   Callback argument: array of indices into the photos.list array
//   See also: photos.js
extension.after_select.add(function(list) {
	Cc['@mozilla.org/consoleservice;1'].getService(Ci.nsIConsoleService)
		.logStringMessage('after_select! list: ' + list.toSource());
});

// After select: called after metadata is committed to Photo objects.
//   Callback argument: array of indices into the photos.list array
//   See also: photos.js
extension.after_edit.add(function(list) {
	Cc['@mozilla.org/consoleservice;1'].getService(Ci.nsIConsoleService)
		.logStringMessage('after_edit! list: ' + list.toSource());
});

// After reorder: called after the photo list is reordered for any reason.
//   Callback argument: boolean, true if the user dragged photos around,
//     false if the photos were sorted by date taken
//   See also: mouse.js, threads.js
extension.after_reorder.add(function(from_user) {
	Cc['@mozilla.org/consoleservice;1'].getService(Ci.nsIConsoleService)
		.logStringMessage('after_reorder! from_user: ' + from_user);
});

// Before upload: called before a batch of uploads starts.
//   Callback argument: array of Photo objects
//   See also: photos.js, upload.js
extension.before_upload.add(function(list) {
	Cc['@mozilla.org/consoleservice;1'].getService(Ci.nsIConsoleService)
		.logStringMessage('before_upload! list: ' + list.toSource());
});

// Before one upload: called before an individual photos starts uploading.
//   Callback argument: Photo object
//   See also: upload.js
extension.before_one_upload.add(function(photo) {
	Cc['@mozilla.org/consoleservice;1'].getService(Ci.nsIConsoleService)
		.logStringMessage('before_one_upload! photo: ' + photo.toSource());
});

// After one upload: called after an individual upload finishes.
//   Callback arguments: Photo object, success/failure boolean
//   See also: upload.js
extension.after_one_upload.add(function(photo, success) {
	Cc['@mozilla.org/consoleservice;1'].getService(Ci.nsIConsoleService)
		.logStringMessage('after_one_upload! photo: ' + photo.toSource());
});

// On upload progress: called each time the UI is updated with progress
//   Callback argument: number of kilobytes since last update
//   See also: upload.js
extension.on_upload_progress.add(function(kb) {
	// Stay quiet so as not to annoy people
});

// After upload: called after a batch of uploads finishes.
//   Callback arguments: array of successful Photo objects, array of failed
//     Photo objects
//   See also: photos.js, upload.js
extension.after_upload.add(function(photo_ids, failed) {
	Cc['@mozilla.org/consoleservice;1'].getService(Ci.nsIConsoleService)
		.logStringMessage('after_upload! photo_ids: ' +
		photo_ids.toSource() + ', failed: ' + failed.toSource());
});

// Normal event handlers are available, too
window.addEventListener('load', function(e) {}, false);