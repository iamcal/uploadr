package widget{
	
	import caurina.transitions.*;
	import caurina.transitions.properties.ColorShortcuts;
	import caurina.transitions.properties.FilterShortcuts;
	
	import flash.display.*;
	import flash.events.*;
	import flash.filters.*;
	import flash.utils.Timer;
	
	
	dynamic public class PhotoGrid extends AbstractView{
		
		public function PhotoGrid(mod:Model){
			super(mod);
			this.method = 'h';
			this.grid = new Grid();
			this.addChild(this.grid);
		}
		
		
		public function m_UploadProgressChanged(){
			this.refresh_progress();
		}
		
		private function refresh_progress(){
			for(var j in this.grid.items){
				if(this.m.all[j] && this.m.all[j].progress >=0)
					this.grid.items[j].progress = this.m.all[j].progress;
			}
		}
		
		public function m_ThumbSizeChanged(){
			this.grid.thumb_size = this.m.thumb_size;
			for(var j in this.grid.items){
				this.grid.items[j].scaleX = this.m.thumb_size;
				this.grid.items[j].scaleY = this.m.thumb_size;
			}
			this.grid.refresh();
			this.grid.scroll_bar.refresh();
		}
		
		public function m_Reset(){
			this.grid.clear();
		}
		
		public function m_CurrentChanged(){
			//sync to model
			
			for(var j in this.grid.items){
			 	//if(!this.m.current_by_id[j])
					this.grid.removeItem(j, true);
			}
			
			for(var i=0; i<this.m.current.length;i++){
				if(!this.grid.items[this.m.current[i].id])
					this.grid.addItem(this.m.current[i], true);
				this.grid.items[this.m.current[i].id].scaleX = this.m.thumb_size;
				this.grid.items[this.m.current[i].id].scaleY = this.m.thumb_size;
			}
			
			
			this.sync_sections();
			
			if(Globals.VARS.scroll){
				this.grid.scroll_bar.position = Globals.VARS.scroll;
				//Globals.VARS.scroll = null;
			}
			
			if(Globals.VARS.zoom){
				this.grid.zoom_bar.position = Globals.VARS.zoom;
				//Globals.VARS.zoom = null;
			}
		}
		
		
		public function startLoadingThumbsAgain(){
			this.grid.load_thumbs.start();
		}
		
		public function m_SectionsChanged(){
			this.sync_sections();
		}
		
		public function m_SelectionChanged(){
			if(!this.grid.dragging){
				this.grid.selectThese(this.m.selected);
			}
		}
		
		private function sync_sections(){
			this.grid.scroll_bar.position = 0;
			this.grid.setSections(this.m.sections);
			this.grid.scroll_bar.refresh();
			this.refresh_progress();
		}
		
		public override function refresh(){
			this.grid.w = this.w;
			this.grid.h = this.h;
		}
		
	}
}
