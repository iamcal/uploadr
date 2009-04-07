package widget{
	
	import caurina.transitions.*;
	
	import flash.display.*;
	import flash.events.*;
	import flash.filters.*;
	
	
	dynamic public class List extends S{
		private var msk:S;
		private var back:S;
		private var key_down:Boolean = false;
		private var space_down:Boolean = false;
		
		public var scale:Number = 1; 
		
		public var items:Object = {};
		public var data:Object = {};
		public var selected:String;
		public var items_holder:S;
		
		public var callback:Function;
		
		//multiple sections
		public var sections:Object = {};
		public var section_titles:Array = new Array();
		
		public function List(c:Function){
			this.items_holder = new S();
			this.callback = c;
			this.addChild(this.items_holder);
			this.items_list = new Array();
		}
		
		public function addItem(l:Object, no_refresh=false){
			var list_item = this.items_holder.addChild(new ListItem(l.id, ' ', this.selectionChanged, l.local));
			this.items[l.id] = list_item;
			this.items_list.push(list_item);
			this.data[l.id] = l;
			this.update_title(l.id);
			
			if(Globals.model.current_id == l.id)
				this.items[l.id].selected = true;
			if(!no_refresh)
				this.refresh();
		}
		
		private function update_title(id){
			var l = this.data[id];
			if(l.title)
				var t = l.title._content 
			else
				var t = l._content;
			if(t.length > 18){
				t = t.substr(0,15)+"...";
			}
			
			var num = l.photos;
			if(!(num>=0))
				num = l.count;
			if(!num)
				num = '?';
			t+= " (<b>" + num +"</b>)";
			this.items[id].title.htmlText = t;
		}
		
		public function selectionChanged(id){
			this.callback(id);
			this.updateHighlight(id);
		}
		
		public function updateHighlight(id){
			for(var j in this.items){
				if(this.items[j].selected)
					this.items[j].selected = false;
			}
			if(this.items[id])
				this.items[id].selected = true;
		}
		
		public function removeItem(id:String, no_refresh=false){
			this.items_holder.removeChild(this.items[id]);
			this.items[id] = null;
			var i=0;
			
			while(this.items_list[i].id != id)
				i++;
				
				
			this.items_list.splice(i,1);
			delete(this.items[id]);
			this.data[id] = null;
			delete(this.data[id]);
			if(!no_refresh)
				this.refresh();
		}
		
		public function setSections(s:Object){
			
			for(var j in this.section_titles){
				this.items_holder.removeChild(this.section_titles[j]);
			}
			
			this.sections = s;
			
			this.section_titles = new Array();
			
			if(this.sections){
				for(var i=0;i<this.sections.length;i++){
					var t = new Text(24);
					t.color = 0xFFFFFF;
					var s = new Sprite();
					s.graphics.beginFill(0xDDDDDD);
					s.graphics.drawRect(0,0,this.w, 30);
					//s.alpha = .2;
					t.addChild(s);
					t.addChild(t.tf);
					this.section_titles.push(t);
					this.items_holder.addChild(t);
					t.text = this.sections[i].title;
				}
			}
			
			this.refresh();
		}
		
		public override function refresh(){
			var Y = 0;
			if(!this.sections){
				for(var i=0;i<this.items_list.length;i++){
					this.items_list[i].y = Y
					Y+=this.items_list[i].height + 2;
				}
			}
			else{
				var Y = 0;
				for(var i=0; i<this.sections.length; i++){
					this.section_titles[i].y = Y;
					Y += this.section_titles[i].height + 5;
					for(var k=0; k<this.sections[i].ids.length;k++){
						var id = this.sections[i].ids[k];
						this.update_title(id);
						//trace(Y);
						this.items[id].y = Y;
						this.items[id].x = 2;
						Y+= this.items[id].height + 2;
						//this.graphics.moveTo(Y,0);
						//this.graphics.lineTo(Y,this.w);
					}
					Y+=10;
				}
			}
		}

	}
}
