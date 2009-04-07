package {
	
	import flash.utils.Proxy;
	import flash.utils.flash_proxy;
	import flash.display.Sprite;
	
	dynamic public class LayoutWrapper extends Proxy{
		private var _obj:Object;
		private var __width:Number;
		private var __height:Number;
		
		public function LayoutWrapper(o:Object){
			this._obj = o;
			
		}
		
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
				//trace("ERROR: defaulting to 0");
				return undefined;
			 	//trace(name + " does not exist");
			 }

		}
		
		override flash_proxy function callProperty(name:*, ... args):*{
			return _obj[name.localName].apply(_obj, args);
		}
		
		
		public function get w(){
			if(!this.__width)
				if(this._obj.w)
					return this._obj.w
				else
					return this.width;
		}
		
		public function set w(x:Number){
			this.__width = x;
		}
		
		public function get h(){
			if(!this.__height)
				if(this._obj.h)
					return this._obj.h
				else
					return this.height;
		}
		
		public function set h(x:Number){
			this.__height = x;
		}
		
		public function setSize(w:Number, h:Number){
			this.__width = w;
			this.__height = h;
			 try{
			 	return this._obj.setSize(w,h);
			 }
			 catch(e:Error){};
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

