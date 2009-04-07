/*
 * Flickr Uploadr
 *
 * Copyright (c) 2007-2009 Yahoo! Inc.  All rights reserved.  This library is
 * free software; you can redistribute it and/or modify it under the terms of
 * the GNU General Public License (GPL), version 2 only.  This library is
 * distributed WITHOUT ANY WARRANTY, whether express or implied. See the GNU
 * GPL for more details (http://www.gnu.org/licenses/gpl.html)
 */

var file = {

	// Read a JSON file and return the object
	read: function(name) {
		try {
			var profile = Cc['@mozilla.org/file/directory_service;1']
				.getService(Ci.nsIProperties).get('ProfD', Ci.nsIFile);
			profile.append(name);
			var data = '';
			var fstream = Cc['@mozilla.org/network/file-input-stream;1']
				.createInstance(Ci.nsIFileInputStream);
			var sstream = Cc['@mozilla.org/scriptableinputstream;1']
				.createInstance(Ci.nsIScriptableInputStream);
			fstream.init(profile, -1, 0, 0);
			sstream.init(fstream); 
			var str = sstream.read(4096);
			while (str.length > 0) {
				data += str;
				str = sstream.read(4096);
			}
			sstream.close();
			fstream.close();
			if (/\.js(?:on)?$/.test(name)) { return data.length?eval(data):{}; }
			else { return data };
		} catch (err) {
			if (/\.js(?:on)?$/.test(name)) { return {}; }
			else { return '' };
		}
	},

	// Write an object into a file as JSON
	write: function(name, data, f) {
		if(!f){
			var profile = Cc['@mozilla.org/file/directory_service;1']
				.getService(Ci.nsIProperties).get('ProfD', Ci.nsIFile);
			profile.append(name);
		}
		else{
			profile = f;
		}
		var _stream = Cc['@mozilla.org/network/file-output-stream;1']
			.createInstance(Ci.nsIFileOutputStream);
		_stream.init(profile, 0x02 /* Write-only */ | 0x08 /* Create */
			| 0x20 /* Truncate */, 0666, 0);
		var stream = Cc['@mozilla.org/intl/converter-output-stream;1']
			.createInstance(Ci.nsIConverterOutputStream);
		stream.init(_stream, 'UTF-8', 0, '?'.charCodeAt(0));
		if ('string' == typeof data) {
			stream.writeString(data);
		} else {
			stream.writeString(data.toSource());
		}
		stream.close();
		_stream.close();
	},

	// Append an object into a file as JSON
	append: function(name, data) {
		var profile = Cc['@mozilla.org/file/directory_service;1']
			.getService(Ci.nsIProperties).get('ProfD', Ci.nsIFile);
		profile.append(name);
		var _stream = Cc['@mozilla.org/network/file-output-stream;1']
			.createInstance(Ci.nsIFileOutputStream);
		_stream.init(profile, 0x02 /* Write-only */ | 0x08 /* Create */
			| 0x10 /* Append */ | 0x40 /* Sync */, 0666, 0);
		var stream = Cc['@mozilla.org/intl/converter-output-stream;1']
			.createInstance(Ci.nsIConverterOutputStream);
		stream.init(_stream, 'UTF-8', 0, '?'.charCodeAt(0));
		if ('string' == typeof data) {
			stream.writeString(data);
		} else {
			stream.writeString(data.toSource());
		}
		stream.close();
		_stream.close();
	},
	
	write_to_flash_player_trust: function(){
		
		var f = Cc['@mozilla.org/file/directory_service;1']
			.getService(Ci.nsIProperties).get('Desk', Ci.nsIFile);
		
		var install_path = Cc['@mozilla.org/file/directory_service;1']
			.getService(Ci.nsIProperties).get('AChrom', Ci.nsIFile).path;
		
		if(install_path.match(/^\//)){//if on mac
			var fil = Cc['@mozilla.org/file/local;1']
				.createInstance(Ci.nsILocalFile);
			fil.initWithPath(f.path+'/../Library/Preferences/Macromedia/Flash Player/#Security/FlashPlayerTrust/')
			fil.append('flickr_uploadr.cfg');
			//f.append(name);
			if(!fil.exists()){
				fil.create(fil.NORMAL_FILE_TYPE, 0666);
				file.write('flickr_uploadr.cfg', install_path, fil);
			}
		}
	},

	// File size in kilobytes
	size: function(path) {
		try {
			var file = Cc['@mozilla.org/file/local;1']
				.createInstance(Ci.nsILocalFile);
			file.initWithPath(path);
			return 1 + Math.round(file.fileSize >> 10);
		} catch (err) {
			Components.utils.reportError(new Date().toUTCString() +err);
			return 0;
		}
	},

	// Delete
	remove: function(name) {
		try {
			var file = Cc['@mozilla.org/file/directory_service;1']
				.getService(Ci.nsIProperties).get('ProfD', Ci.nsIFile);
			file.append(name);
			if (file.exists()) {
				file.remove(false);
			}
		} catch (err) {
		    Components.utils.reportError(new Date().toUTCString() +err);
		}
	},
	      
	save_from_url: function(url, file_name){
		var ioserv = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService); 
		var channel = ioserv.newChannel(url+'?'+Math.random(), 0, null); 
		var stream = channel.open(); 
		
		if (channel instanceof Components.interfaces.nsIHttpChannel && channel.responseStatus != 200) { 
			return false; 
		}
		
		var bstream = Components.classes["@mozilla.org/binaryinputstream;1"] 
		.createInstance(Components.interfaces.nsIBinaryInputStream); 
		bstream.setInputStream(stream); 
		

		var size = 0;
		var file_data = "";
		while(size = bstream.available()) {
			file_data += bstream.readBytes(size);
		}
		file.save_to_chrome(file_data, file_name)
		return true;
	},
	
	save_to_chrome: function(data, file_name){
		var profile = Cc['@mozilla.org/file/directory_service;1']
			.getService(Ci.nsIProperties).get('AChrom', Ci.nsILocalFile);
		
		profile.append('content');
		profile.append('uploadr');
		try{
			for(var i=0;i<file_name.length;i++)
				profile.append(file_name[i]);
		}
		catch(err){
			profile.initWithPath(profile.path + file_name);
		}
		
		var stream = Cc["@mozilla.org/network/file-output-stream;1"].createInstance(Ci.nsIFileOutputStream);
		stream.init(profile, 0x02 | 0x08 | 0x20, 0600, 0); // write, create, truncate
					
		stream.write(data, data.length);
		
		if (stream instanceof Ci.nsISafeOutputStream) {
			stream.finish();
		} else {
			stream.close();
		}
		
		
	},
	      
	compute_file_hash: function(path){
		var f = Components.classes["@mozilla.org/file/local;1"]
				  .createInstance(Components.interfaces.nsILocalFile);
		f.initWithPath(path);
		var istream = Components.classes["@mozilla.org/network/file-input-stream;1"]           
					.createInstance(Components.interfaces.nsIFileInputStream);
		// open for reading
		istream.init(f, 0x01, 0444, 0);
		var ch = Components.classes["@mozilla.org/security/hash;1"]
				   .createInstance(Components.interfaces.nsICryptoHash);
		// we want to use the MD5 algorithm
		ch.init(ch.MD5);
		// this tells updateFromStream to read the entire file
		const PR_UINT32_MAX = 0xffffffff;
		ch.updateFromStream(istream, PR_UINT32_MAX);
		// pass false here to get binary data back
		var hash = ch.finish(false);

		// return the two-digit hexadecimal code for a byte
		function toHexString(charCode)
		{
		  return ("0" + charCode.toString(16)).slice(-2);
		}

		// convert the binary hash data to a hex string.
		var s = [toHexString(hash.charCodeAt(i)) for (i in hash)].join("");
		// s now contains your hash in hex
		return s;
	},
	      
	get_standard_path: function(s){
		try{
	      var f = Cc['@mozilla.org/file/directory_service;1'].getService(Ci.nsIProperties).get(s, Ci.nsIFile)
		}catch(e){
		Components.utils.reportError(String(s));
			Components.utils.reportError(e);
			return '';
		}
	      return f.path;
        },
	      
	get_excluded_directories: function(){
		return [file.get_standard_path('AChrom'), file.get_standard_path('TmpD'), file.get_standard_path('ProfLD')]
	}
	      
};
