package {
	
	import flash.utils.Proxy;
	import flash.utils.flash_proxy;
	import flash.display.Sprite;
	
	dynamic public class S extends Sprite{
		private var __width:Number;
		private var __height:Number;
		public var lp:Number;
		public var rp:Number;
		public var bp:Number;
		public var tp:Number;
		public var hs:Number;
		public var vs:Number;
		public var method:String;
		
		public function S(){
			
		}
		
		/*
		override flash_proxy function setProperty(name:*, value:*):void {
			this._obj[name] = value;
		}
		
		override flash_proxy function getProperty(name:*):*{
			 if(name == "lp" || name == "rp" || name=="bp" || name=="tp" || name=="hs" || name=="vs")
			 	if(!this._obj[name])
					return 0;
				else
					return this._obj[name];
					
			 try{
			 	return this._obj[name]
			 }
			 catch(e:Error){
				trace("ERROR: defaulting to 0");
				return undefined;
			 	//trace(name + " does not exist");
			 }

		}
		
		override flash_proxy function callProperty(name:*, ... args):*{
			return _obj[name.localName].apply(_obj, args);
		}
		*/
		
		
		public function get w(){
			if(!this.__width)
				return this.width;
			else
				return this.__width;
		}
		
		public function set w(x:Number){
			this.__width = x;
		}
		
		public function get h(){
			if(!this.__height)
				return this.height;
			else
				return this.__height;
		}
		
		public function set h(x:Number){
			this.__height = x;
		}
		
		public function setSize(w:Number, h:Number){
			this.__width = w;
			this.__height = h;
		}
		
		
		
	}
}
			
/*
var ms = new XML(describeType(this));
//Output.trace(ms.accessor);
for each(var j in ms.accssor){
	//trace(j);
}
*/
