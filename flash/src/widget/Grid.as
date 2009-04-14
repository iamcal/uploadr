package widget{
	
	import caurina.transitions.*;
	import caurina.transitions.properties.ColorShortcuts;
	import caurina.transitions.properties.FilterShortcuts;
	
	import flash.display.*;
	import flash.events.*;
	import flash.filters.*;
	import flash.utils.Timer;
	
	
	public class Grid extends S{
		private var msk:S;
		
		
		private var back:S;
		private var orig_x:Number;
		public var thumb_size:Number;
		private var sc_down:Boolean;
		public var lower_visible_bound:int;
		public var upper_visible_bound:int;
		private var orig_y:Number;
		private var zoom_down:Boolean;
		private var items_orig_x:Boolean;
		public var dragging:Boolean;
		private var key_down:Boolean = false;
		private var space_down:Boolean = false;
		public var load_thumbs:Timer;
		private var y_offset:Number;
		private var not_timeline:Boolean;
		
		public var scale:Number = 1; 
		public var orig_scale:Number = 1; 
		public var selection_box:Sprite; 
		public var items_holder:S; 
		public var scroll_bar:ScrollBar; 
		public var zoom_bar:HorizontalScrollBar; 
		public var title:Text; 
		
		public var section_titles:Array = [];
		public var sections:Array =[];
		public var items_list:Object = [];
		public var items:Object = {};
		public var removed_items:Object = {};
		public var data:Object = {};
		public var selected:Object = {};
		public var descriptions:Object = {};
		
		
		public function Grid(){
			this.method = 'g';
			//this.wexp = true;
			//this.hexp = true;
			//this.hs = 2;
			//this.vs = 2;
			this.y_offset = Globals.VARS.story ? 5 : 81;
			
			ColorShortcuts.init();
			FilterShortcuts.init();
			this.scale = this.orig_scale = 1;
			
			
			
			this.selection_box = new Sprite();
			this.selection_box.alpha = .5;
			this.items_holder = new S();
			
			this.items_holder.heightExtent = 0;
			this.back = new Transparent();
			this.items_holder.addChild(this.back);
			
			//shadow
			//var f = new Array();
			//f.push(new DropShadowFilter(8,45,2,.8,8,8,1,1,false,false,false));
			//this.items_holder.filters = f;
			
			this.msk = new S();
			this.msk.graphics.beginFill(0xcccccc);
			this.msk.graphics.drawRect(0,0,1,1);
			
			this.addChild(this.items_holder);
			this.items_holder.x = 10;
			this.scroll_bar = new ScrollBar(this.items_holder,this.msk,this.onScroll);
			this.scroll_bar.w = 15;
			this.zoom_bar = new HorizontalScrollBar(this.onZoom, null, this.onZoomDown, this.onZoomUp);
			this.zoom_bar.h = 15;
			if(!Globals.VARS.story){
				this.addChild(this.scroll_bar);
				this.addChild(this.zoom_bar);
			}
			
			
			//this.title = new Text(40);
			//this.addChild(this.title);
			//this.addChild(this.msk);
			//this.items_holder.mask = this.msk;
			this.load_thumbs = new Timer(0,0);
			this.load_thumbs.addEventListener("timer", this.refreshThumbnails);
			this.not_timeline = true;
		}
		
		private function onZoom(x){
			this.scale = 600 * x*x*x*x +1;
			//trace(this.scale);
			this.refresh();
		}
		
		private function update_bounds(){
			this.lower_visible_bound = -this.items_holder.y-Globals.BOUNDS_BUFFER;
			this.upper_visible_bound = -this.items_holder.y+this.h+Globals.BOUNDS_BUFFER;
		}
		private function onScroll(){
			this.update_bounds();
			
			var f:Array = new Array();
			f.push(new DropShadowFilter(2,45,0,.5,4,4,1,1,false,false,false));
			var e:Array = [];
			
			for(var i=0;i<this.items_list.length;i++){
				var item:PhotoItem = this.items_list[i]
				item.is_on_screen = this.isOnScreen(item.y);
				if(item.is_on_screen){ //keeping this here for single dropshadow construction
					if(item.filters.length == 0)
						item.filters = f;
				}
				else{
					if(item.filters.length >0)
						item.filters = e;
				}
			}
			//this.load_thumbs.start();
		}
		
		public function isOnScreen(yy:int){
			return yy < this.upper_visible_bound && yy > this.lower_visible_bound;
		}
		
		private function refreshThumbnails(e:Event){
			var i:int = 0;
			var counter = 3;
			while(counter > 0){
				
				while(i < this.items_list.length){
					try{
						
						var I = this.items_list[i];
						if(I.is_loaded || !I.thumbnail_ready){
							i++;
						}
						else{
							break;
						}
					}
					catch(e:Error){
						Globals.trace('error: ' + e);
						i++;
					}
				}
				
				if(i<this.items_list.length){
					try{
						this.items_list[i].load();
					}
					catch (e:Error){
						
					}
					this.items_list[i].is_loaded = true;
				}
				else{
					this.load_thumbs.stop();
				}
				counter -=1;
			}
		}
		
		public function keyUp(e:KeyboardEvent){
			if(e.keyCode == 32) // space
				this.space_down = false;
			else
				this.key_down = false;
		}
		
		public function keyDown(e:KeyboardEvent){
			if(e.keyCode == 32) // space
				this.space_down = true;
			else
				this.key_down = true;
		}
		
		public function set text(t:String){
			this.title.text = t;
			this.items_holder.y = this.title.height + 10;
		}

		public function setSections(a:Array){
			for(var j in this.section_titles){
				this.items_holder.removeChild(this.section_titles[j]);
			}
			this.sections = a;
			
			this.section_titles = new Array();
			for(var i=0;i<this.sections.length;i++){
				var t = new Title(20);
				t.text = this.sections[i].title;
				this.section_titles.push(t);
				this.items_holder.addChildAt(t,0);
			}
			this.items_holder.addChild(this.selection_box);
			this.not_timeline = true;
			this.refresh();
		}

		public function clear(){
			this.removed_items = {};
		}
		
		public function addItem(p:Object, no_refresh=false){
			if(!this.removed_items[p.id]){
				var photo_item = this.items_holder.addChild(new PhotoItem(p, true));
				this.items_list.push(photo_item);
				
				this.items[p.id] = photo_item;
				this.data[p.id] = p;
			}
			else{
				this.items_list.push(this.removed_items[p.id]);
				this.items[p.id] = this.removed_items[p.id];
				this.data[p.id] = this.removed_items[p.id].photo_data;
				this.items_holder.addChild(this.items[p.id]);
			}
			if(!no_refresh)
				this.refresh();
			//this.items_holder.addChild(this.selection_box);
		}
		
		public function removeItem(id:String, no_refresh=false){
			var i = this.items_list.indexOf(this.items[id]);
			if(i>=0)
				this.items_list.splice(i, 1);
			else
				Globals.trace("wtf??" + i + ' ' + id);
			this.items_holder.removeChild(this.items[id]);
			this.removed_items[id] = this.items[id];
			this.items[id] = undefined;
			delete(this.items[id]);
			this.data[id] = undefined;
			delete(this.data[id]);
			if(!no_refresh)
				this.refresh();
		}
		
		
		public function onWheel(e:Event){
			if(Globals.VARS.story){
				this.scaleX += Object(e).delta/20;
				this.scaleY += Object(e).delta/20;
			}
			else{
				this.scroll_bar.position -= 50 * Object(e).delta / this.items_holder.heightExtent;
			}
			
		}
		
		public function onMove(e:Event){
			
			//this.rotationY = (stage.stageWidth/2-this.items_holder.mouseY)/50;
			//this.rotationX = (stage.stageHeight/2 -this.items_holder.mouseX)/50;
			
			if(this.dragging){
				this.syncToSelectionBox();
			}
			else{
				//this.items_holder.y = -this.items_holder.mouseY*10;
			}
		}
		
		private function syncToSelectionBox(){
			var x1 = Math.min(this.orig_x, this.items_holder.mouseX)
			var y1 = Math.min(this.orig_y,this.items_holder.mouseY + this.items_holder.y)
			var x2 = Math.abs(this.items_holder.mouseX-this.orig_x)
			var y2 = Math.abs(this.items_holder.mouseY+this.items_holder.y-this.orig_y)
			
			this.selection_box.graphics.clear(); 
			this.selection_box.graphics.beginFill(0xF38BB8);
			this.selection_box.graphics.lineStyle(1,0xFF0084);
			this.selection_box.graphics.drawRect(x1,y1-this.items_holder.y,x2,y2);
			this.selection_box.graphics.endFill();
			var selected = new Array();
			
			for(var j in this.items){
				if(this.items[j].x + this.items[j].thumb.width*this.thumb_size > x1 && this.items[j].x < x1+x2 && this.items_holder.y + this.items[j].y +this.items[j].thumb.height*this.thumb_size > y1 &&  this.items_holder.y + this.items[j].y < y1+y2){
					this.items[j].selected = true;
					selected.push(this.items[j].photo_data.id);
				}
				else if(!this.sc_down)
					this.items[j].selected = false;
			}
			
			Globals.model.setSelected(selected, this.sc_down);
		}
		
		public function selectThese(a:Array):void{
			Globals.trace('selectThese');
			for(var j in this.items){
				if(a.indexOf(String(j))!=-1){
					this.items[j].selected = true;
				}
				else
					this.items[j].selected = false;
			}
		}
		
		private function onZoomDown(){
			this.zoom_down = true;
			this.onUp(null);
		}
		
		private function onZoomUp(){
			this.zoom_down = false;
		}
		
		public function onDown(e:MouseEvent){
			this.sc_down = e.shiftKey || e.ctrlKey;
			if(this.zoom_down || stage.mouseY < 70 || stage.mouseX < 60 || this.items_holder.mouseX < 0 || this.items_holder.mouseX > this.items_holder.width-15)
				return;
			this.dragging = true;
			this.orig_x = this.items_holder.mouseX;
			this.items_orig_x = this.items_holder.x;
			this.orig_scale = this.scale;
			this.orig_y = this.items_holder.mouseY+this.items_holder.y;
		}
		
		public function onUp(e:Event){
			if(this.dragging)
				this.syncToSelectionBox();
			this.sc_down = false;
			this.dragging = false;
			this.selection_box.graphics.clear();
		}
		
		
		private function touching(obj){
			for(var j in this.items){
				var O = this.items[j];
				if(obj != O && obj.hitTestObject(O))
					return true;
			}
			return false;
		}
		
		public override function refresh(){
			var i = 0;
			
			
			
			/*
			for(j in this.items){
				if(W < this.items[j].width)
					W = this.items[j].width;
				//Globals.trace(this.items[j].width);
					
				if(H < this.items[j].height)
					H = this.items[j].height;
			}
			*/
			
			var W = Globals.thumb_size*this.thumb_size + 20;
			var H = Globals.thumb_size*this.thumb_size + 20;
			//Globals.trace('w;'+W);
			//Globals.trace(H);
			
			//if(!j)
				//return;
			
			
			Globals.stage.addEventListener(MouseEvent.MOUSE_MOVE, this.onMove);
			Globals.stage.addEventListener(MouseEvent.MOUSE_UP, this.onUp);
			Globals.stage.addEventListener(MouseEvent.MOUSE_DOWN, this.onDown);
			Globals.stage.addEventListener(MouseEvent.MOUSE_WHEEL, this.onWheel);
			this.msk.width = this.back.width = this.w - 30;
			this.items_holder.w = this.w - 30;
			this.scroll_bar.h = this.msk.height =  this.h;
			this.scroll_bar.h -= 60;
			this.scroll_bar.y = this.y_offset;
			this.scroll_bar.h -= this.y_offset;
			this.scroll_bar.x = this.w - this.scroll_bar.w - 20;
			
			this.zoom_bar.w = this.w-40;
			this.zoom_bar.x = 20;
			this.zoom_bar.y = this.h - this.zoom_bar.h-20;
			
			
			
			
			
			this.zoom_bar.visible = false;
			
			if(Globals.model.mode == "timeline"){
				if(Globals.VARS.story){
					this.zoom_bar.visible = true;
					var num_across = Math.floor( (this.items_holder.w-50) / W );
					var i =0;
					var delta = 75;//150;
					this.graphics.clear();
					this.descriptions = new Object();
					var min_y;
					for(var j in this.items){
						i++;
						//if(this.not_timeline)
							//this.items[j].x = this.w/2 + (Math.random()-.5)*(this.w/1.5);
						//this.items[j].y = i % (num_across) * (H);
						this.items[j].x = ((this.w-Globals.thumb_size)*this.scale) * ((this.data[j].datetaken.time- Globals.model.oldest_date.time) / (Globals.model.newest_date.time - Globals.model.oldest_date.time))
						//this.items[j].x-=(this.w-Globals.thumb_size)*this.scale;
						//this.items[j].x *= -1;
						this.items[j].x += 10;
						//this.descriptions[j] = new Text(11);
						//this.descriptions[j].x = this.items[j].x;
						//this.descriptions[j].htmlText = this.data[j].title;
						//this.addChild(this.descriptions[j]);
						delta = -delta;
						//this.items[j].scaleX = this.items[j].scaleY = .3;
						
						this.items[j].y = stage.stageHeight / 2;
						while(this.touching(this.items[j])){
							this.items[j].y += delta;
						}
						
						if(!min_y || this.items[j].y < min_y)
							min_y = this.items[j].y;
						
					}
					
					for(var j in this.items){
						this.items[j].y -= min_y;
					}
					
					//for(var j in this.descriptions){
						//while(this.touching(this.descriptions[j])){
							//this.descriptions[j].y += delta;
						//}
					//}
					
					this.graphics.lineStyle(1, 0x000000);
					for(var j in this.items){
						var O = this.items[j]
						var X = O.x+O.width/2;
						var Y = O.y+O.height/2;
						//this.graphics.moveTo(X, Y);
						//this.graphics.lineTo(X+Math.random()*Globals.thumb_size,Y+Math.random()*Globals.thumb_size);
					}
					
					
					/*
					for(var i=0; i<this.sections.length; i++){
						this.section_titles[i].x = ((this.w-Globals.thumb_size)*this.scale) * ((this.sections[i].date.time- Globals.model.oldest_date.time) / (Globals.model.newest_date.time - Globals.model.oldest_date.time))
						this.section_titles[i].x-= (this.w-Globals.thumb_size)*this.scale;
						this.section_titles[i].x *= -1;
						this.section_titles[i].x += 10;
						this.section_titles[i].rotation = 90;
					}
					*/
					
					this.items_holder.heightExtent = (this.h*this.scale)+H;
					this.not_timeline = false;
					this.scroll_bar.refresh();
				}
				else{
					this.zoom_bar.visible = true;
					var num_across = Math.floor( this.items_holder.w / (W) );
					var i =0;
					for(var j in this.items){
						i++;
						//if(this.not_timeline)
							//this.items[j].x = this.w/2 + (Math.random()-.5)*(this.w/1.5);
						this.items[j].x = i % (num_across) * (W);
						if(this.data[j].datetaken){
						this.items[j].y = ((this.h-H)*this.scale) * ((this.data[j].datetaken.time- Globals.model.oldest_date.time) / (Globals.model.newest_date.time - Globals.model.oldest_date.time))
						this.items[j].y-=(this.h-H)*this.scale;
						this.items[j].y *=-1;
						this.items[j].y +=60;
						}
						else
							this.items[j].y = 0;
					}
					
					for(var i=0; i<this.sections.length; i++){
						this.section_titles[i].y = ((this.h-H)*this.scale) * ((this.sections[i].date.time- Globals.model.oldest_date.time) / (Globals.model.newest_date.time - Globals.model.oldest_date.time))
						this.section_titles[i].y-=(this.h-H)*this.scale;
						this.section_titles[i].y *= -1;
						this.section_titles[i].y += 60;
						this.section_titles[i].alph = .5;
					}
					this.items_holder.heightExtent = (this.h*this.scale)+H;
					this.not_timeline = false;
					this.scroll_bar.refresh();
				}
			}
			else{
				this.not_timeline = true;
				
				var num_across = Math.floor( this.items_holder.w / (W) );
				
				if(!this.sections || this.sections.length == 0){
					var i = 0;
					var Y;
					for(var j in this.items){
						this.items[j].x = i % (num_across) * (W);
						//this.items[j].rotationY = 20;
						//this.items[j].rotationX = -100;
						//this.items[j].rotationZ = 90;
						this.items[j].y = Math.floor(i/num_across) * (H) + this.y_offset;
						i++;
						Y = this.items[j].y + this.items[j].height + 40;
					}
				}
				else{
					var Y = this.y_offset;
					for(var i=0; i<this.sections.length; i++){
						this.section_titles[i].y = Y;
						Y += this.section_titles[i].height + 10;
						var last_y = Y;
						//var lh = (H-20);
						//var lw = (W-20);
						for(var k=0; k<this.sections[i].ids.length;k++){
							var id = this.sections[i].ids[k];
							var it = this.items[id];
							/*
							var wi:int = it.width;
							var hi:int = it.height;
							*/
							//Globals.trace(it);
							it.y = Y + Math.floor(k/num_across) * (H)//+(Math.max(0,lh-hi))/2;
							it.x = k % num_across * (W)//+(Math.max(0,lw-wi))/2;
							//var diff:int = (this.items[id].width - this.items[id].height)/2;
							//if(wi > hi){
								//it.y+=Math.floor((lh-hi)/2);
								//trace("diff x " + Math.floor((lh-it.height)/2));
							//}
							//else{
								//it.x+=Math.floor((lw-wi)/2);
							//}
							
							//this.items[id].thumb.rotationY = 30;
							//this.items[id].thumb.rotationX = 20;
							//this.items[id].thumb.rotationZ = 15;
							//this.items[id].thumb.z = Math.random()*Globals.thumb_size;
							last_y = this.items[id].y;
						}
						
						Y = last_y + 20 + H;
					}
				}
				this.items_holder.heightExtent = Y;
				
			}
			for(var j in this.section_titles){
				this.section_titles[j].w = this.w-100;
				this.section_titles[j].refresh();
			}
			
			this.back.height = 0;
			this.back.height = Math.max(this.height, this.items_holder.heightExtent);
			this.load_thumbs.start();
			this.scroll_bar.position = this.scroll_bar.position;
		}
		
	}
}
