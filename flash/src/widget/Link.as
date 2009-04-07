package widget{
	
	import flash.text.*;
	import flash.events.*;
	import flash.text.StyleSheet;
	import flash.events.TextEvent;
	
	
	dynamic public class Link extends Text{
		
		private var callback:Function;
		private var not_selected_text:String;
		private var underline_on_hover:Boolean;
		
		function Link(t:String, f:Function, p:Object=null, u:Boolean=true, s:int=20){
			super(s);
			//this TextField();
			this.f = f;
			this.not_selected_text = t;
			this.background = new S();
			this.addChild(this.background);
			this.addChild(this.tf);
			this.text = t;
			this.mouseChildren = false;
			//this.addChild(thisd);
			//this.underline_on_hover = u;
			this.useHandCursor = true;
			this.buttonMode = true;
			this.addEventListener(MouseEvent.CLICK, this.click);
			this.addEventListener(MouseEvent.MOUSE_UP, this.up);
			this.addEventListener(MouseEvent.MOUSE_DOWN, this.down);
			this.addEventListener(MouseEvent.MOUSE_OVER, this.over);
			this.addEventListener(MouseEvent.MOUSE_OUT, this.out);
			
			this.out(new Event('e'));
			if(p)
				p.addChild(this);
		}
		
		public override function set text(x:String){
			this.htmlText = "<a href=''>"+x+"</a>";
			this.out(null);
		}
		
		private function down(e:Event){
			e.stopPropagation();
			this.down_on_me = true;
		}
		
		private function up(e:Event){
			if(this.down_on_me)
				e.stopPropagation();
			this.down_on_me = false;
		}
		
		private function click(e:Event){
			e.stopPropagation();
			this.f(e);
		}
		
		private function over(e:Event){
			var format:TextFormat = new TextFormat();
			format.bold = true;
			//format.background= ;
			format.color = 0xFFFFFF;
			format.font = "Arial";
			format.underline = false;
			this.tf.setTextFormat(format);
			this.background.graphics.clear();
			this.background.graphics.beginFill(0x0063DC);
			this.background.graphics.drawRect(0,0,this.width,this.height);
			this.background.visible = true;
		}
		
		private function out(e:Event){
			var format:TextFormat = new TextFormat();
			format.bold = true;
			this.background.visible = false;
			format.underline= true;
			format.color = 0x0063DC;
			format.font = "Arial";
			this.tf.setTextFormat(format);
		}
	}

}

