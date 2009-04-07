package data{
	import com.adobe.serialization.json.JSON;
	
	import flash.events.Event;
	import flash.net.FileReference;
	import flash.net.URLLoader;
	import flash.net.URLRequest;
	
	public class Request{
		private var loader:URLLoader;		
		//http://api.flickr.com/services/rest/?method=flickr.photos.search&jump_to=11144&user_id=34427469121@N01&per_page=200&extras=o_dims,rotation,original_format,media&&api_key=697df769a56c3cda609d386ff7ab7272&auth_hash=27941b7f51453ba152d5473fac40e0da
		//http://www.flickr.com/services/rest/?method=flickr.photos.search&cb=1212435758660&format=rest&auth_token=&auth_hash=a6232277e690a9b9d426131cdc2f49eb&api_key=3ebaf4970cebdcddfd72f639e0de3842&src=flash&extras=o%5Fdims%2Crotation%2Coriginal%5Fformat%2Cmedia&tags=urban&tag_mode=all&per_page=200&page=1&sort=

		
		private var response_function:Function;
		private var offsite_key_fetched:Boolean;
		private var method:String;
		private var url:String;
		
		private var error_function:Function;
		
		public function Request(error:Function = null){
			this.error_function = error;
			//if(Globals.VARS.offsite)
				//this.getOffsiteKey();
			this.loader = new URLLoader;
			this.loader.addEventListener(Event.COMPLETE, responseLoaded);
			
			this.loader.addEventListener(flash.events.HTTPStatusEvent.HTTP_STATUS, httpStatus);
		}
	
	
		//private function getOffsiteKey(){

		//}
		
		public function httpStatus(e){
		
		}
			
		public function call(method, params, response:Function, error:Function=null){
			if(Globals.VARS.offsite && !this.offsite_key_fetched){
				
			}
			var param_string = ""
			for (var j in params){
				if(params[j])
					param_string+= j+"=" + params[j]+'&';
			}
			
			this.method = method;
			this.url = Globals.api_host + "method=" + method + "&" + param_string + "api_key=" + Globals.API_KEY;
			if(!Globals.VARS.offsite)
				this.url+="&auth_hash=" + Globals.AUTH_HASH;
			this.response_function = response;
			if(error) 
				this.error_function = error; 
			
			this.loader.load(new URLRequest(url));
		}
    
    /*
    for(var i:Number = 0; i < list.length; i++) {
        item = list[i];
        trace("name: " + item.name);
        trace(item.addListener(this));
        item.upload("http://www.yourdomain.com/");
    }
listener.onOpen = function(file:FileReference):Void {
    trace("onOpen: " + file.name);
}

listener.onProgress = function(file:FileReference, bytesLoaded:Number, bytesTotal:Number):Void {
    trace("onProgress with bytesLoaded: " + bytesLoaded + " bytesTotal: " + bytesTotal);
}

listener.onComplete = function(file:FileReference):Void {
    trace("onComplete: " + file.name);
}

listener.onHTTPError = function(file:FileReference, httpError:Number):Void {
    trace("onHTTPError: " + file.name + " httpError: " + httpError);
}

listener.onIOError = function(file:FileReference):Void {
    trace("onIOError: " + file.name);
}

listener.onSecurityError = function(file:FileReference, errorString:String):Void {
    trace("onSecurityError: " + file.name + " errorString: " + errorString);
}
    */
		public function flickr_upload( fileReference:FileReference, title:String = "",
								description:String = "", tags:String = "", is_public:Boolean = false,
								is_friend:Boolean = false, is_family:Boolean = false):void {
			
			
			// The upload method requires signing, so go through
			// the signature process
			/*
			var sig:String = _service.secret;
			sig += "api_key" + _service.api_key;
			sig += "auth_token" + _service.token;
			sig += "description" + description;
			sig += "is_family" + ( is_family ? 1 : 0 );
			sig += "is_friend" + ( is_friend ? 1 : 0 );
			sig += "is_public" + ( is_public ? 1 : 0 );
			sig += "tags" + tags;
			sig += "title" + title;
			*/
			
			var upload_url:String = 'http://backstage.flickr.com/services/upload/?';
			upload_url += "api_key=" + Globals.API_KEY;
			upload_url += "&auth_hash=" + Globals.AUTH_HASH;
			upload_url += "&description=" + description;
			upload_url += "&is_family=" + ( is_family ? 1 : 0 );
			upload_url += "&is_friend=" + ( is_friend ? 1 : 0 );
			upload_url += "&is_public=" + ( is_public ? 1 : 0 );
			upload_url += "&tags=" + tags;
			upload_url += "&title=" + title;
			//upload_url += "&api_sig=" + MD5.hash( sig );
			
			fileReference.upload( new URLRequest(upload_url) );
			
		}
		
		
		private function responseLoaded(response){
			var rawData = this.loader.data.split("jsonFlickrApi(").join("");

			//decode the data to ActionScript using the JSON API
			var obj:Object = JSON.decode(rawData);
			
			
			this.response_function(obj);
			return;
			
		}
		
	}
}

