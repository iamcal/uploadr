package widget{
	
	import flash.events.*;
	import flash.text.*;
	
	
	dynamic public class Title extends Text{

		public function Title(size:int=14, parent=null, ww=false, text=null){
			super(size, parent,ww,text);
			this.refresh();
		}
		
		public override function refresh(){
			this.graphics.clear();
			this.graphics.lineStyle(2, 0xEEEEEE);
			this.graphics.moveTo(0,30);
			this.graphics.lineTo(this.w,30);
		}
	}
}
