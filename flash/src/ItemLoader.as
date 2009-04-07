package{
	
	import flash.display.Sprite;
	import flash.net.URLRequest;
	import flash.system.Security;
	import flash.events.*;
	import flash.display.*;
	import flash.utils.Timer;
	import flash.system.LoaderContext;
	import flash.errors.IOError;
	import flash.events.SecurityErrorEvent;
	import flash.events.IOErrorEvent;
	
	
	dynamic public class ItemLoader extends S{
		private var url:String;
		private var loader:Loader;
		private var context:LoaderContext;
		private var callback:Function;
		private var progress_callback:Function;
		private var error_callback:Function;
		private var timer:Timer;
		private var id:String;
		private var security_checked:Boolean;
		
		public function ItemLoader(u:String, f:Function=null, i:String = null, progress_function:Function=null, error_function:Function=null){
			this.id = i;
			this.url = u;
			this.callback = f;
			this.progress_callback = progress_function;
			this.error_callback = error_function;
			this.loader = new Loader();
			
			this.context = new LoaderContext();
			this.context.checkPolicyFile = true;
			
			this.loader.contentLoaderInfo.addEventListener(Event.COMPLETE, onLoadComplete);
			this.loader.contentLoaderInfo.addEventListener(ProgressEvent.PROGRESS, onLoadProgress);
			this.loader.contentLoaderInfo.addEventListener(IOErrorEvent.IO_ERROR, onIOError);
			this.loader.addEventListener(IOErrorEvent.IO_ERROR, onIOError);
			this.loader.addEventListener(SecurityErrorEvent.SECURITY_ERROR, onSecurityError);
			Globals.trace('url:' + this.url);
			this.loader.load(new URLRequest(this.url), this.context);
			this.time_out = new Timer(8000,1);
			this.time_out.addEventListener("timer", this.onTimeOut);
			this.time_out.start();
		}	
		
		function onTimeOut(e:Event){
			trace("ERROR: timeout, couldn't load" +this.url );
			if(this.error_callback)
				this.error_callback("Timed Out", this.id);
		}
		
		function onLoadProgress(e:ProgressEvent){
			if(this.progress_callback)
				this.progress_callback(e.bytesLoaded/e.bytesTotal, this.id);
		}
		
		function onSecurityError(e:SecurityError) {
			this.time_out.stop();
			if(this.error_callback)
				this.error_callback(e.message, this.id);
			Globals.trace("Security ERROR: " + e.message);
		}
		
		function onIOError(e){
			this.time_out.stop();
			if(this.error_callback)
				this.error_callback(e.text, this.id);
			Globals.trace("IO ERROR: " + e.text);
			trace("ERROR: io error, couldn't load" +this.url );
		}
		
		function onLoadComplete(e:Event){
/*

OH YAY... FUN STUFF, thanks Adobe! (need this for bad thumbs which load from l.yimg):

Be careful with checkPolicyFile if you are downloading an object from a URL that may 
use server-side HTTP redirects. Policy files are always retrieved from the corresponding 
initial URL that you specify in URLRequest.url. If the final object comes from a different 
URL because of HTTP redirects, then the initially downloaded policy files might not be applicable
to the object's final URL, which is the URL that matters in security decisions. If you find yourself 
in this situation, you can examine the value of LoaderInfo.url after you have received 
a ProgressEvent.PROGRESS or Event.COMPLETE event, which tells you the object's final URL. 
Then call the Security.loadPolicyFile() method with a policy file URL based on the object's final URL. 
Then poll the value of LoaderInfo.childAllowsParent until it becomes true.

from: http://livedocs.adobe.com/flash/9.0/ActionScriptLangRefV3/flash/system/LoaderContext.html

*/
			if(!this.security_checked && this.loader.contentLoaderInfo.url!=this.url){
				Security.loadPolicyFile('http://'+this.loader.contentLoaderInfo.url.split("://")[1].split("/")[0]+"/crossdomain.xml");
				//TODO: throw error if timer ends without getting the child
				this.security_checked = true;
				this.timer = new Timer(200,200)
				this.timer.addEventListener("timer", this.pollChildAllowsParent);
				this.timer.start();
				return;
			}
				
			this.time_out.stop();
			
			
			try{
				var c = this.loader.content;
				c = Bitmap(c);
				c.smoothing = true;
			}
			catch(e:Error){
				trace("error loading : " +this.loader.contentLoaderInfo.url);
				trace("error: " +e.message);
			}
			if(c){
				if(this.callback){
					this.callback(c,this.id);
					Globals.trace('callback time!');
				}
				else{
					Globals.trace('addchild time!');
					Globals.trace(c.y);
					this.addChild(c);
				}
			}
		}
		
		function pollChildAllowsParent(e:Event){
			if(this.loader.contentLoaderInfo.childAllowsParent){
				this.timer.stop();
				this.onLoadComplete(e);	
			}
		}
		

		
	}
}

