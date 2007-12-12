/*
 * Flickr Uploadr
 *
 * Copyright (c) 2007 Yahoo! Inc.  All rights reserved.  This library is free
 * software; you can redistribute it and/or modify it under the terms of the
 * GNU General Public License (GPL), version 2 only.  This library is
 * distributed WITHOUT ANY WARRANTY, whether express or implied. See the GNU
 * GPL for more details (http://www.gnu.org/licenses/gpl.html)
 */

var upgrade = {

	check: function(){

		var um = Cc["@mozilla.org/updates/update-manager;1"].getService(
			Ci.nsIUpdateManager);
		var prompter = Cc["@mozilla.org/updates/update-prompt;1"].createInstance(
			Ci.nsIUpdatePrompt);

		// If there's an update ready to be applied, show the "Update Downloaded"
		// UI instead and let the user know they have to restart the browser for
		// the changes to be applied. 

		if (um.activeUpdate && um.activeUpdate.state == "pending") {
			prompter.showUpdateDownloaded(um.activeUpdate);
		} else {
			prompter.checkForUpdates();
		}
	},

	build_menu: function(){
		var updates = Cc["@mozilla.org/updates/update-service;1"].getService(
			Ci.nsIApplicationUpdateService);
		var um = Cc["@mozilla.org/updates/update-manager;1"].getService(
			Ci.nsIUpdateManager);
		var checkForUpdates	= document.getElementById("menu_updates");
		var strings		= document.getElementById("locale");
		var activeUpdate	= um.activeUpdate;
		function getStringWithUpdateName(key) {
			if (activeUpdate && activeUpdate.name) {
				return strings.getFormattedString(key, [activeUpdate.name]);
			}
			return strings.getString(key + "Fallback");
		}
		var key = "default";
		if (activeUpdate) {
			switch (activeUpdate.state) {
				case "downloading":
					key = updates.isDownloading ? "downloading" : "resume";
					break;
				case "pending":
					key = "pending";
					break;
			}
		}
		checkForUpdates.label = getStringWithUpdateName("updatesItem_" + key);
		if (um.activeUpdate && updates.isDownloading) {
			checkForUpdates.setAttribute("loading", "true");
		} else {
			checkForUpdates.removeAttribute("loading");
		}
	}

};