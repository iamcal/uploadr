package widget{
	
	import caurina.transitions.*;
	import caurina.transitions.properties.ColorShortcuts;
	import caurina.transitions.properties.FilterShortcuts;
	import flash.filters.DropShadowFilter;
	import flash.display.*;
	import flash.events.*;
	import flash.filters.*;
	import flash.utils.Timer;
	
	dynamic public class ListItem extends S{
		public var title:Text;
		private var _selected:Boolean;
		public var selection_box:S;
		public var id;
		
		
		public function ListItem(id:String, t:String, c:Function, local:Boolean=false){
			this.title = new Text(18)
			this.title.htmlText = t;
			this.addChild(this.title);
			this.selection_box = new S();
			if(local)
				this.selection_box.graphics.beginFill(0x7777FF);
			else
				this.selection_box.graphics.beginFill(0xff0084);
			
			this.selection_box.graphics.drawRect(0,0,1,1);
			this.selection_box.graphics.endFill();
			this.selection_box.alpha = 0;
			this.selection_box.visible = false;
			var f = new Array();
			f.push(new DropShadowFilter(2,50,0,.5,1,1,1,1,false,false,false));
			this.selection_box.filters = f
			this.addChild(this.selection_box);
			this.addEventListener(MouseEvent.CLICK, this.onClick);
			this.useHandCursor = true;
			this.buttonMode = true;
			this.back = new Transparent();
			this.callback = c;
			this.id = id;
			this.addChild(this.back);
			this.refresh();
			
		}
		
		public function onClick( e:Event ){
			this.callback(this.id);
			//this.selected = !this.selected;
		}
		
		public function set text(x:String):void{
			this.title.text = x;
		}
		
		public function set selected(x:Boolean):void{
			this._selected = x;
			Tweener.addTween(this.selection_box, {visible:this.selected, time:.5, alpha:int(this.selected)*.25, transition:"easeoutexpo"});
			Tweener.addTween(this.title, {x:int(this.selected)*15, time:.5, transition:"easeoutexpo"});
		}
		
		public function get selected():Boolean{
			return this._selected;
		}
		
		public override function refresh(){
			this.back.width = this.selection_box.width = 200;
			this.back.height = this.selection_box.height = this.h;
		}
	}
}
