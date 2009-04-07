package {	
	
	//import flash.data.*;
	import flash.utils.*;
	import flash.external.ExternalInterface;
	import flash.display.Sprite;
	import flash.net.navigateToURL;
	import flash.net.URLRequest;
	import flash.net.URLVariables;
	import flash.net.SharedObject;
	import flash.text.TextField;
	
	dynamic public class Globals{
	
		static public var SERVER:String;
		static public var VARS;
		static public var stage;
		static public var INTL_VARS:URLVariables;
		static public var LOCAL_API_KEY;
		static public var LOCAL_AUTH_HASH;
		static public var USE_LOCAL_CACHE:Boolean;
		static public var BUTTON_HOVER = 0x333333;
		static public var BUTTON_DEFAULT = 0x2A2A2A;
		static public var BOUNDS_BUFFER = 300;
		static public var alwaysShowInfo:Boolean;
		static public var over_dialog:Boolean;
		static public var content:S;
		static public var debug:TextField;
		static public var SO:SharedObject;
		//static public var show_back_txt:String;
		static public var model:Model;
		//static public var show_back_url:String;
		//static public var pause_dialog;
		static public var topbar;
		static public var description;
		static public var photo_grid;
		static public var preview;
		static public var size:String;
		static private var API_URL = "http://api.flickr.com/services/rest/?";
		static private var DEV_API_URL = "http://api.dev.flickr.com/services/rest/?";
		static private var BACKSTAGE_API_URL = "http://backstage.flickr.com/services/rest/?";
		static private var BETA_API_URL = "http://beta1.flickr.com/services/rest/?";

		public static const MILLISECOND:Number = 1;
		public static const SECOND:Number = MILLISECOND * 1000;
		public static const MINUTE:Number = SECOND * 60;
		public static const HOUR:Number = MINUTE * 60;
		public static const DAY:Number = HOUR * 24;
		public static const WEEK:Number = DAY * 7;
		public static const MONTH:Number = DAY * 30;
		public static const YEAR:Number = DAY * 365;
		
		static public var thumb_size = 200;
		
		
		static public var H;
		static public var W;
		
		
		static public function init(root, stage){
			Globals.VARS =  root.loaderInfo.parameters;
			Globals.VARS.offsite = true;
			Globals.stage = stage;
			
			if(root.loaderInfo.url.split('file:/').length > 1 || root.loaderInfo.url.split('app:/').length > 1){
				Globals.USE_LOCAL_CACHE = true;
				Globals.SERVER = 'www';
			}
			else if(root.loaderInfo.url.split('www.flickr').length > 1)
				Globals.SERVER = 'www';
			else if(root.loaderInfo.url.split('//flickr').length > 1)
				Globals.SERVER = '';
			else if(root.loaderInfo.url.split('staging.flickr').length > 1)
				Globals.SERVER = 'staging';
			else if(root.loaderInfo.url.split('backstage.flickr').length > 1)
				Globals.SERVER = 'backstage';
			else if(root.loaderInfo.url.split('dev.flickr').length > 1)
				Globals.SERVER = 'dev';
			else if(root.loaderInfo.url.split('beta1.flickr').length > 1)
				Globals.SERVER = 'beta1';
			else{
				try{
					Globals.SERVER = root.loaderInfo.url.split("http://")[1].split('.')[0]
				}
				catch(e:Error){
					Globals.SERVER = "www";
				}
			}
			
			Globals.SO = SharedObject.getLocal('slideShow_SO');
			
		}
		
		static public function get large():Boolean{
			return Globals.size == "large";
		}
		
		static public function get medium():Boolean{
			return Globals.size == "medium";
		}
		
		static public function get small():Boolean{
			return Globals.size == "small";
		}
		
		static public function get super_small():Boolean{
			return Globals.size == "super_small";
		}
		
		static public function get host():String{
			if(Globals.SERVER != "")
				return "http://"+Globals.SERVER+".flickr.com"
			else
				return "http://flickr.com"
		}
		
		static public function get offsite_api_key_url():String{
			if(Globals.SERVER == "" || Globals.SERVER == "www" || Globals.SERVER == "backstage" || Globals.SERVER == "beta1" || Globals.SERVER == "staging")
				return "http://api.flickr.com/services/api_slidekey.gne";
			else
				return "http://api.dev.flickr.com/services/api_slidekey.gne";
				
		}
		
		static public function openStream(){
			//Globals.openURL(Globals.host + "/photos/" + Globals.model.current_info.owner_id);
		}
		
		static public function openURL(u:String, to:String="_blank"){
			if(Globals.VARS.offsite){
				to = "_blank";
			}
			
			if(u.split("://").length == 1)
				u = Globals.host + u;
			
			var request:URLRequest = new URLRequest(u);
			//if(to!="_self")
				//Globals.pause_dialog.visible = true;
				
			navigateToURL(request, to);
		}
		
		static public function get api_host():String{
			if(Globals.SERVER == "dev")
				return DEV_API_URL;
			else if(Globals.SERVER == "backstage")
				return BACKSTAGE_API_URL;
			else if(Globals.SERVER == "beta1")
				return BETA_API_URL;
			else
				return API_URL;
		}
		
		static public function get image_host():String{
			if(Globals.SERVER == "dev")
				return ".static-dev.flickr.com/";
			
			return ".static.flickr.com/";
		}
		
		static public function get API_KEY():String{
			return Globals.VARS.magisterLudi ? Globals.VARS.magisterLudi:Globals.LOCAL_API_KEY;
		}
		
		static public function get AUTH_HASH():String{
			return Globals.VARS.auth_hash ? Globals.VARS.auth_hash:Globals.LOCAL_AUTH_HASH;
		}
		
		
				
		static public function traceObject(o){
			for(var j in o){
				Globals.trace(j+": " + o[j]);
			}
		}
		
		static public function trace(s){
			//Debug.log(s);
			//Globals.debug.text=String(s)+'\n'+Globals.debug.text.substr(0, 5000);
		}
		
		static public function get user_id():String{
			return Globals.VARS.user_id ? Globals.VARS.user_id : (Globals.VARS.nsid? Globals.VARS.nsid : '68756453@N00');
		}
		
		static public function replaceAll(source:String, find:String, replace:String){
			var counter:int=0;
			while (counter<source.length) {
				var start = source.indexOf(find, counter);
				if (start == -1) {
					break;
				} else {
					var before=source.substr(0,start)
					var after=source.substr(start+find.length,source.length)
					source=before+replace+after
					var counter=before.length+replace.length
							
				}
			}
			return source;
		}

		static public function toAsciiOnly(source){
			var out='';
			//var min_acii = 'a'.charCodeAt(0);
			for(var i=0;i<source.length;i++){
				out+=source.charCodeAt(i);//-min_acii)%26+min_acii;
			}
			return out;
		}
				
	}
}
