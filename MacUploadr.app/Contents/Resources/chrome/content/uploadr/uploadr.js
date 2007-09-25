// This used to be the main script for the Uploadr, but things have slowly grown and been
// refactored into new homes

const Cc = Components.classes;
const Ci = Components.interfaces;
const NS_HTML = 'http://www.w3.org/1999/xhtml';

// A placeholder, because the events_*.js files all create objects within events
var events = {};

var uploadr = {

	// Configuration
	conf: {

		// Size of thumbnails
		thumbSize: 100,

	},

	// Handle files dragged on startup
	drag: function() {
		Components.utils.reportError('uploadr.drag(): ' + window.arguments[0]);
		var cl = window.arguments[0].QueryInterface(Ci.nsICommandLine);
		var ii = cl.length;
		for (var i = 0; i < ii; ++i) {
			if ('-url' == cl.getArgument(i)) {
				photos._add(Cc['@mozilla.org/network/protocol;1?name=file'].getService(
					Ci.nsIFileProtocolHandler).getFileFromURLSpec(cl.getArgument(++i)).path);
			}
		}
		threads.worker.dispatch(new Sort(), threads.worker.DISPATCH_NORMAL);
	},

	// Profile file IO
	fread: function(name) {
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
	fwrite: function(name, data) {
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

	// Get the size of a file
	fsize: function(path) {
		var file = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsILocalFile);
		file.initWithPath(path);
		return 1 + Math.round(file.fileSize >> 10);
	}

};