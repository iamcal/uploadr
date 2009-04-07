package data{
	import flash.events.Event;
	import flash.net.URLLoader;
	import flash.net.URLRequest;
	
	public class FlickrAPI{
		private var loader:URLLoader;		
		//http://api.flickr.com/services/rest/?method=flickr.photos.search&jump_to=11144&user_id=34427469121@N01&per_page=200&extras=o_dims,rotation,original_format,media&&api_key=697df769a56c3cda609d386ff7ab7272&auth_hash=27941b7f51453ba152d5473fac40e0da
		//http://www.flickr.com/services/rest/?method=flickr.photos.search&cb=1212435758660&format=rest&auth_token=&auth_hash=a6232277e690a9b9d426131cdc2f49eb&api_key=3ebaf4970cebdcddfd72f639e0de3842&src=flash&extras=o%5Fdims%2Crotation%2Coriginal%5Fformat%2Cmedia&tags=urban&tag_mode=all&per_page=200&page=1&sort=
		private var error_function:Function;
		
		public function FlickrAPI(error:Function = null){
			this.error_function = error;
			//if(Globals.VARS.offsite)
				//this.getOffsiteKey();
		}
		
		public function call(method, params, response:Function, error:Function=null){
			var r = new Request(this.error_function);
			r.call(method, params, response, error);
			
		}
	}
}
