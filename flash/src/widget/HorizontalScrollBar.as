package widget{
	
	import caurina.transitions.*;
	import caurina.transitions.properties.ColorShortcuts;
	import caurina.transitions.properties.FilterShortcuts;
	
	import flash.display.*;
	import flash.events.*;
	import flash.filters.*;
	import flash.geom.*;
	import flash.utils.Timer;
	
	
	dynamic public class HorizontalScrollBar extends S{
		public var back:S;
		public var handle:S;
		//private var content;
		//private var container;
		private var callback:Function;
		private var _position:Number = 0;
		
		public function HorizontalScrollBar(c:Function=null, no_text=false, down_callback:Function=null, up_callback:Function=null){
			this.back = new S();
			this.handle = new S();
			this.addChild(this.back);
			this.addChild(this.handle);
			
			
			//this.content = scroll_content;
			//this.container = scroll_container;
			this.back.graphics.beginFill(0xcccccc);
			this.back.graphics.drawRect(0,0,1,1);
			this.back.graphics.endFill();
			
			var hb = new S();
			this.handle.addChild(hb);
			this.handle.hb = hb;
			this.handle.hb.graphics.beginFill(0x333333);
			this.handle.hb.graphics.drawRect(0,0,1,1);
			this.handle.hb.graphics.endFill();
			this.handle.addEventListener(MouseEvent.MOUSE_DOWN, this.onDown);
			this.handle.buttonMode = true;
			this.handle.useHandCursor = true;
			var t = new Text(12);
			if(!no_text){
				this.handle.addChild(t);
				this.handle.t = t;
				t.y = -3;
				t.x = 20;
				t.text = "zoom";
			}
			this.callback = c;
			this.down_callback = down_callback;
			this.up_callback = up_callback;
		}
		
		public override function refresh(){
			Globals.stage.addEventListener(MouseEvent.MOUSE_MOVE, this.onMove);
			Globals.stage.addEventListener(MouseEvent.MOUSE_UP, this.onUp);
			//this.visible = this.container.height < this.content.height
			this.handle.hb.height = this.back.height = this.h;
			this.back.width = this.w;
			this.handle.hb.width = (.1) * this.w
			this.handle.t.x = this.handle.hb.width/2-15;
		}
		
		
		private function onMove(e:Event){
			
			if(this.dragging){
				this.position = this.handle.x / (this.w - this.handle.w)
			}
		}
		
		public function get position():Number{
			return this._position;
		}
		
		public function set position(x:Number){
			this._position = Math.max(0,Math.min(1,x));
			//this.content.y = - this.position * (this.content.height - this.container.height)
			if(!this.dragging){
				this.handle.x = this.position * (this.w - this.handle.w);
			}
			if(this.callback)
				this.callback(x);
		}
		
		private function onDown(e:Event){
			if(this.down_callback)
				this.down_callback();
			  
			this.dragging = true;
			this.handle.startDrag(false, new Rectangle(0,0,this.w-this.handle.w,0));
		}
		
		private function onUp(e:Event){
			if(this.up_callback)
				this.up_callback();
			
			this.dragging = false;
			this.handle.stopDrag();
		}
	}
}

