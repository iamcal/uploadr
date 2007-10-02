var file = {

	read: function(name) {
		try {
			var profile = Cc['@mozilla.org/file/directory_service;1'].getService(
				Ci.nsIProperties).get('ProfD', Ci.nsIFile);
			profile.append(name);
			var data = '';
			var fstream = Cc['@mozilla.org/network/file-input-stream;1'].createInstance(
				Ci.nsIFileInputStream);
			var sstream = Cc['@mozilla.org/scriptableinputstream;1'].createInstance(
				Ci.nsIScriptableInputStream);
			fstream.init(profile, -1, 0, 0);
			sstream.init(fstream); 
			var str = sstream.read(4096);
			while (str.length > 0) {
				data += str;
				str = sstream.read(4096);
			}
			sstream.close();
			fstream.close();
			return eval(data);
		} catch (err) {
			return {};
		}
	},

	write: function(name, data) {
		var profile = Cc['@mozilla.org/file/directory_service;1'].getService(
			Ci.nsIProperties).get('ProfD', Ci.nsIFile);
		profile.append(name);
		var _stream = Cc['@mozilla.org/network/file-output-stream;1'].createInstance(
			Ci.nsIFileOutputStream);
		_stream.init(profile, 0x02 /* Write-only */ | 0x08 /* Create */ | 0x20 /* Truncate */,
			0666, 0);
		var stream = Cc['@mozilla.org/intl/converter-output-stream;1'].createInstance(
			Ci.nsIConverterOutputStream);
		stream.init(_stream, 'UTF-8', 0, '?'.charCodeAt(0));
		if ('string' == typeof data) {
			stream.writeString(data);
		} else {
			stream.writeString(data.toSource());
		}
		stream.close();
	},

	size: function(path) {
		var file = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsILocalFile);
		file.initWithPath(path);
		return 1 + Math.round(file.fileSize >> 10);
	}

}