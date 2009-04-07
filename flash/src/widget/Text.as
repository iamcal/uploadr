package widget{
	
	import flash.events.*;
	import flash.text.*;
	
	
	dynamic public class Text extends S{
		
		public var tf:TextField;
		public var format:TextFormat;
		
		public function Text(size:int=14, parent=null, ww=false, text=null){
			this.tf = new TextField();
			this.addChild(this.tf);
			this.tf.autoSize = TextFieldAutoSize.LEFT;
			this.tf.background = false;
			this.tf.border = false;
			this.tf.selectable = false;
			this.tf.wordWrap = ww;
			this.format= new TextFormat();
			format.font = "Arial";
			format.color = 0x999999;
			format.italic = false;
			format.size = size;
			format.leftMargin = 4;
			format.rightMargin = 4;
			
			this.tf.defaultTextFormat = format;
			if(text)
				this.htmlText = text;
				
			if(parent)
				parent.addChild(this);
		}
		
		public function set color(x):void{
			this.format.color = x;
			this.tf.defaultTextFormat = format;
		}
		
		public function get defaultTextFormat():TextFormat{
			return this.tf.defaultTextFormat;
		}
		
		public function set defaultTextFormat(x:TextFormat){
			this.tf.defaultTextFormat = x;
		}
		
		public function get text():String{
			return this.tf.text;
		}
		
		public function set text(x:String){
			this.defaultTextFormat = format;
			return this.tf.text = x;
		}
		
		public function get htmlText():String{
			return this.tf.htmlText;
		}
		
		public function set htmlText(x:String){
			this.defaultTextFormat = format;
			return this.tf.htmlText = x;
		}
		
		public override function set width(x:Number):void{
			this.tf.width = x;
		}
		
		public override function set height(x:Number):void{
			this.tf.height = x;
		}
		
		public function set multiline(x:Boolean):void{
			this.tf.multiline = x;
		}
		
	}
}
