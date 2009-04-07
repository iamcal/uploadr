package widget{
	
	import caurina.transitions.*;
	import caurina.transitions.properties.ColorShortcuts;
	import caurina.transitions.properties.FilterShortcuts;
	
	import flash.display.*;
	import flash.events.*;
	import flash.filters.*;
	import flash.geom.*;
	import flash.utils.Timer;
	
	
	dynamic public class ScrollBar extends S{
		public var back:S;
		public var handle:S;
		private var content;
		private var container;
		private var callback:Function;
		private var _position:Number = 0;
		
		public function ScrollBar(scroll_content, scroll_container, c:Function=null){
			this.back = new S();
			this.handle = new S();
			this.addChild(this.back);
			this.addChild(this.handle);
			
			this.content = scroll_content;
			this.container = scroll_container;
			this.back.graphics.beginFill(0xcccccc);
			this.back.graphics.drawRect(0,0,1,1);
			this.back.graphics.endFill();
			
			this.handle.graphics.beginFill(0x000000);
			this.handle.graphics.drawRect(0,0,1,1);
			this.handle.graphics.endFill();
			this.handle.addEventListener(MouseEvent.MOUSE_DOWN, this.onDown);
			this.handle.buttonMode = true;
			this.handle.useHandCursor = true;
			this.callback = c;
		}
		
		public override function refresh(){
			Globals.stage.addEventListener(MouseEvent.MOUSE_MOVE, this.onMove);
			Globals.stage.addEventListener(MouseEvent.MOUSE_UP, this.onUp);
			var H = this.content.heightExtent ? this.content.heightExtent : this.content.height;
			this.visible = this.container.height < H;
			this.handle.width = this.back.width = this.w;
			this.back.height = this.h;
			this.handle.height = Math.max(20,(this.container.height/ H ) * this.h);
		}
		
		
		
		private function onMove(e:Event){
			
			this.update_postition();
		}
		private function update_postition(){
			if(this.dragging){
				this.position = this.handle.y / (this.h - this.handle.h)
			}
		}
		
		public function get position():Number{
			return this._position;
		}
		
		public function set position(x:Number){
			this._position = Math.max(0,Math.min(1,x));
			var H = this.content.heightExtent ? this.content.heightExtent : this.content.height;
			this.content.y = - this.position * (H - this.container.height)
			if(!this.dragging){
				this.handle.y = Math.floor(this.position * (this.h - this.handle.h));
			}
			if(this.callback)
				this.callback();
		}
		
		private function onDown(e:Event){
			this.dragging = true;
			this.handle.startDrag(false, new Rectangle(0,0,0,this.h-this.handle.h));
		}
		
		private function onUp(e:Event){
			if(this.dragging)
			this.dragging = false;
			this.handle.stopDrag();
		}
	}
}

