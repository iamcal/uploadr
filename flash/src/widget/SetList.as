package widget{
	
	import caurina.transitions.*;
	
	import flash.display.*;
	import flash.events.*;
	import flash.filters.*;
	
	
	dynamic public class SetList extends AbstractView{
			
		public function SetList(mod:Model){
			super(mod);
			this.method = "v";
			this.list = new List(this.itemClicked);
			this.addChild(this.list);
			this.msk = new Transparent();
			this.addChild(this.msk);
			this.scroll_bar = new ScrollBar(this.list,this.msk,this.onScroll);
			this.scroll_bar.w = 10;
			this.mask = this.msk;
			this.addChild(this.scroll_bar);
		}
		
		public function itemClicked(id:String){
			this.list.updateHighlight(id);
			this.m.setFilter(id);
		}
		
		public function m_ListChanged(){
			this.sync_list();
		}
		
		public function m_CurrentChanged(){
			//this.list.updateHighlight(this.m.current_id);
		}
		
		private function sync_list(){
			for(var j in this.list.items){
				if(!this.m.sets_by_id[j]){
					this.list.removeItem(j, true);
				}
			}
			
			for(var i=0; i < this.m.sets.length; i++){
				if(!this.list.items[this.m.sets[i].id]){
					this.list.addItem(this.m.sets[i], true);
				}
			}
			
			for(var j in this.m.tags){
				if(!this.list.items[this.m.tags[j].id]){
					this.list.addItem(this.m.tags[j], true);
				}
			}
			
			
			this.list.setSections(this.m.list_sections);
			
			this.refresh();
			this.list.refresh();
		}
		
		public override function refresh(){
			this.graphics.clear();
			this.graphics.moveTo(this.w,0);
			this.graphics.lineStyle(2,0xeeeeee);
			this.graphics.lineTo(this.w,Globals.stage.stageHeight);
			this.msk.width = this.w;
			this.scroll_bar.h = this.msk.height =  this.h;
			this.scroll_bar.h -= 0;
			this.scroll_bar.y = 0;
			this.scroll_bar.x = this.w - this.scroll_bar.w;
		}
	}
}
