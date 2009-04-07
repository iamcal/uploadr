package widget{
	
	import flash.display.*;
	import flash.events.*;
	import flash.filters.DropShadowFilter;
	import flash.geom.*;
	import flash.system.LoaderContext;
	import flash.utils.*;
	
	
	dynamic public class Preview extends AbstractView{
		public function Preview(mod:Model){
			super(mod);
			this.background = this.addChild(new Sprite());
			this.background.graphics.beginFill(0x000000);
			this.background.graphics.drawRect(0,0,1,1);
			this.background.graphics.endFill();
			this.background.alpha = .7;
			this.visible = false;
			this.useHandCursor = true;
			this.buttonMode = true;
			this.addEventListener(MouseEvent.CLICK, this.onClick);
			this.close_button = this.addChild(new CloseButton());
		}
		
		private function onClick(e){
			e.stopPropagation();
			this.visible = false;
		}
		
		public function m_BigUrlsChanged(id){
			this.item = this.m.all[id];
			if(this.big)
				this.removeChild(this.big);
			this.big = new ItemLoader(this.m.all[id].big, this.bigLoaded)
		}
		
		
		public function bigLoaded(c, id):void{
			this.big = this.addChild(c);
			var f = new Array();
			f.push(new DropShadowFilter(6,45,0,.5,10,10,1,1,false,false,false));
			this.big.filters = f
			this.refresh();
			this.visible = true;
		}
		
		public override function refresh(){
			var W = Globals.stage.stageWidth - 40;
			var H = Globals.stage.stageHeight - 40;
			if(this.item.width > W || this.item.height > H){
				if(H/this.item.height < W/this.item.width){
					this.big.width *=H/this.big.height;
					this.big.height = H;
				}
				else{
					this.big.height *= W/this.big.width;
					this.big.width = W;
				}
			}
			
			this.big.x = (Globals.stage.stageWidth - this.big.width)/2;
			this.big.y = (Globals.stage.stageHeight - this.big.height)/2;
			this.background.width = Globals.stage.stageWidth;
			this.background.height = Globals.stage.stageHeight;
			this.close_button.y = 20;
			this.close_button.x = this.width - this.close_button.width - 20;
		}
	}
}
