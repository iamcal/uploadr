package {
	
	import flash.utils.Proxy;
	import flash.utils.flash_proxy;
	import flash.filters.BlurFilter;
	import flash.display.Sprite;
	import flash.filters.DropShadowFilter;
	
	dynamic public class S extends Sprite{
		private var __width:Number;
		private var __height:Number;
		public var lp:Number;
		public var rp:Number;
		public var bp:Number;
		public var tp:Number;
		public var hs:Number;
		public var vs:Number;
		public var no_lay:Boolean;
		public var method:String;
		
		public function S(){
		
		}
		
		public function get rx():Number{
			return this.x + this.width;
		}
		
		public function get by():Number{
			return this.y + this.height;
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
		
		
		public function set blurAmount(x:Number){
			var array_filter:Array=new Array();
			var filter:BlurFilter=new BlurFilter(x,x,3);
			array_filter.push(filter);
			this.filters=array_filter;
			
			
		}
		
		
		public function setBackgroundColor(c){
			var m:Sprite = new Sprite();
			m.graphics.beginFill(c);
			m.graphics.drawRect(0, 0, this.h, this.w);
			this.addChild(m);
		}
		public function set shadow(x:Boolean){
			if(x){
				var f = new Array();
				f.push(new DropShadowFilter(3,45,0,.6,4,4,1,1,false,false,false));
				this.filters = f;
			}
			else{
				this.filters =null;
			}
		}
			
		
		/*
		public function turnOnMask(){
			var m:Sprite = new Sprite();
			m.graphics.beginFill(0xFF0000);
			m.graphics.drawRect(0, 0, 40, 40);
			m.width = this.w;
			m.height = this.h/2;
			this.mask = m;
			this.addChild(this.mask);
			
		}
		
		public function turnOffMask(){
			this.removeChild(this.mask);
			this.mask= null;
		}
		*/
		
		public override function set y(x:Number):void{
			super.y = x;
		}
		
		public function get w(){
			if(!this.__width)
				return this.width;
			else
				return this.__width;
		}
		
		public function set w(x:Number){
			this.__width = x;
		}
		
		public function get h():Number{
			if(!this.__height)
				return this.height;
			else
				return this.__height;
		}
		
		public function set h(x:Number){
			this.__height = x;
		}
		
		public function refresh(){
			
		}
		
		public function setSize(w:Number, h:Number){
			this.__width = w;
			this.__height = h;
			//if(this.mask){
				//this.mask.setSize(w,h);
			//}
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
