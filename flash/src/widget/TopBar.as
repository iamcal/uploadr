package widget{
	import flash.display.*;
	import flash.events.*;
	import flash.net.navigateToURL;
	import flash.net.URLRequest;
	import flash.filters.DropShadowFilter;
	import flash.text.*;
	
	dynamic public class TopBar extends AbstractView{
		
		public function TopBar(mod:Model){
			super(mod);
			
			this.line = this.addChild(new Sprite());
			this.back = new Sprite();
			this.back.graphics.beginFill(0xFFFFFF);
			this.back.graphics.drawRect(0, 0, 40, 40);
			this.back.alpha = .90;
			this.back.height = 60;
			this.addChild(this.back);
			this.text = new Text(32);
			this.text.y = 8;
			this.text.x = 10;
			this.search_box = new Text(20);
			this.search_box.color = 0xcccccc;
			this.search_box.tf.autoSize = TextFieldAutoSize.NONE;
			this.search_box.text = "search";
			
			this.search_box.tf.type = TextFieldType.INPUT;
			this.search_box.tf.border = true;
			this.search_box.tf.borderColor = 0xCCCCCC;
			this.search_box.tf.background = true;
			this.search_box.tf.backgroundColor = 0xF4F4F4;
			this.search_box.tf.selectable = true;
			this.search_box.tf.width = 150;
			this.search_box.tf.height = 28;
			this.search_box.tf.addEventListener(Event.CHANGE, this.searchTyped);
			this.search_box.tf.addEventListener(MouseEvent.CLICK, this.searchClicked);
			this.search_box.multiline = false;
			this.search_box.y = 14;
			//this.search_box.width = 150;
			//this.upload_link = new UploadLink(this.m);
			//this.addChild(this.upload_link);
			this.view_by_date = new Link("by date",this.dateClicked,this,true,16);
			this.view_by_tag = new Link("by tag",this.tagClicked, this,true,16);
			this.view_by_timeline = new Link("timeline",this.timelineClicked, this,true,16);
			//this.upload_lnk = new Link("upload",this.uploadClicked,this,true,16);
			this.thumb_size = new HorizontalScrollBar(onThumbSize,true);
			this.thumb_size.w = 100;
			this.thumb_size.h = 10;
			this.addChild(this.thumb_size);
			this.thumb_size.position = this.m.getThumbScale();
			
			/*this.upload_lnk.y =*/this.thumb_size.y = this.view_by_timeline.y = this.view_by_tag.y = this.view_by_date.y = 16;
			this.thumb_size.y+=4;
			this.addChild(this.text);
			this.addChild(this.search_box);
			
			//shadow
			var f = new Array();
			f.push(new DropShadowFilter(1,45,0,.8,6,6,1,1,false,false,false));
			this.line.filters = f
		}
		
		public function onThumbSize(x){
			this.m.setThumbSize(x);	
		}
		
		public function searchClicked(e:Event){
			this.search_box.tf.setSelection(0,this.search_box.text.length);
		}
		
		public function searchTyped(e:Event){
			trace('search: ' + this.search_box.text)
			this.m.doSearch(this.search_box.text);
		}
		
		private function uploadClicked(e:Event){
			this.m.uploadSelected();
		}
		
		private function dateClicked(e:Event){
			this.m.changeMode("date");
		}
		
		private function tagClicked(e:Event){
			this.m.changeMode("tag");
		}
		
		private function timelineClicked(e:Event){
			this.m.changeMode("timeline");
		}
		
		public function m_CurrentChanged(){
			this.text.htmlText = this.m.current_title;
		}
		
		public override function refresh(){
			this.line.graphics.clear();
			this.line.graphics.moveTo(0,60);
			this.line.graphics.lineStyle(1,0xcccccc);
			this.line.graphics.lineTo(w,60);
			this.back.width = this.w;
			this.search_box.x = this.w - this.search_box.width - 10;
			this.view_by_timeline.x = this.search_box.x - this.view_by_timeline.width - 10;
			this.view_by_date.x = this.view_by_timeline.x - this.view_by_date.w - 10;
			this.view_by_tag.x = this.view_by_date.x - this.view_by_tag.w - 10;
			this.thumb_size.x = this.view_by_tag.x - this.thumb_size.w - 40;
			//this.upload_lnk.x = this.view_by_tag.x - this.upload_lnk.w - 40;
		}
		
	}
}


