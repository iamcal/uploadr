package {
	
	import flash.display.Loader;
	import flash.display.Sprite;
	import flash.net.URLRequest;
	import flash.events.Event;
	
	dynamic public class AbstractView extends S{
	
		protected var m:Model;
		
		public function AbstractView(mod:Model){
			super();
			this.m = mod;
			this.m.registerView(this);
		}
	}
}

