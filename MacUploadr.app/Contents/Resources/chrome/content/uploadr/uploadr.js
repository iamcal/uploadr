/*
 * Flickr Uploadr
 *
 * Copyright (c) 2007 Yahoo! Inc.  All rights reserved.  This library is free
 * software; you can redistribute it and/or modify it under the terms of the
 * GNU General Public License (GPL), version 2 only.  This library is
 * distributed WITHOUT ANY WARRANTY, whether express or implied. See the GNU
 * GPL for more details (http://www.gnu.org/licenses/gpl.html)
 */

const Cc = Components.classes;
const Ci = Components.interfaces;
const NS_HTML = 'http://www.w3.org/1999/xhtml';

var uploadr = {
	conf: {

		// Size of thumbnails
		thumbSize: 100,

		// Scrolling threshold for dragging (pixels);
		scroll: 20,

		// Scrollbar width to prevent craziness when clicking the scrollbar (pixels)
		scrollbar_width: 14,

		// Upload mode
		//   Must be 'sync' or 'async'
		mode: 'async',

		// Upload timeout (milliseconds);
		timeout: 60000,

		// Upload progress-checking interval (milliseconds)
		check: 400,

		// How often should the app auto-save metadata? (seconds)
		auto_save: 60,

		// What version am I?
		version: '3.0',

		// What types of API events should be written to the console?
		console: {
			request: false,
			response: false,
			timeout: true
		},

		// Should we warn users when they're about to clobber data when leaving a batch?
		confirm_batch_save: false,

		// Should we auto-select images as they're added? (at least until the user clicks)
		auto_select: false,

	}
};

function checkForUpdates(){

	var um = Components.classes["@mozilla.org/updates/update-manager;1"].getService(Components.interfaces.nsIUpdateManager);
	var prompter = Components.classes["@mozilla.org/updates/update-prompt;1"].createInstance(Components.interfaces.nsIUpdatePrompt);

	// If there's an update ready to be applied, show the "Update Downloaded"
	// UI instead and let the user know they have to restart the browser for
	// the changes to be applied. 

	if (um.activeUpdate && um.activeUpdate.state == "pending"){
		prompter.showUpdateDownloaded(um.activeUpdate);
	}else{
		prompter.checkForUpdates();
	}
}

function buildHelpMenu(){

	var updates = Components.classes["@mozilla.org/updates/update-service;1"].getService(Components.interfaces.nsIApplicationUpdateService);
	var um = Components.classes["@mozilla.org/updates/update-manager;1"].getService(Components.interfaces.nsIUpdateManager);

	var checkForUpdates	= document.getElementById("menu_updates");
	var strings		= document.getElementById("locale");
	var activeUpdate	= um.activeUpdate;

	// If there's an active update, substitute its name into the label
	// we show for this item, otherwise display a generic label.
	function getStringWithUpdateName(key) {
		if (activeUpdate && activeUpdate.name) return strings.getFormattedString(key, [activeUpdate.name]);
		return strings.getString(key + "Fallback");
	}

	// By default, show "Check for Updates..."
	var key = "default";
	if (activeUpdate) {
		switch (activeUpdate.state) {
			case "downloading":
				// If we're downloading an update at present, show the text:
				// "Downloading Firefox x.x..." otherwise we're paused, and show
				// "Resume Downloading Firefox x.x..."
				key = updates.isDownloading ? "downloading" : "resume";
				break;
			case "pending":
				// If we're waiting for the user to restart, show: "Apply Downloaded
				// Updates Now..."
				key = "pending";
				break;
		}
	}

	checkForUpdates.label = getStringWithUpdateName("updatesItem_" + key);

	if (um.activeUpdate && updates.isDownloading){
		checkForUpdates.setAttribute("loading", "true");
	}else{
		checkForUpdates.removeAttribute("loading");
	}
}

function pathFromCommandLine(file){

	Components.classes["@mozilla.org/consoleservice;1"]
		.getService(Components.interfaces.nsIConsoleService)
		.logStringMessage("Got a file " + file);
}

function checkCommandLineQueue(){

	var comp = Components.classes["@mozilla.org/commandlinehandler/general-startup;1?type=flcmdline"]
			.getService(Components.interfaces.IFlickrCommandQueue);

	var queue = comp.getQueue();
	queue = queue.split('|||||');

	for (var i=0; i<queue.length; i++){
		if (queue[i].length){
			pathFromCommandLine(queue[i]);
		}
	}
}