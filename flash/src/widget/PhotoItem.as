package widget{
	
	
	import caurina.transitions.Tweener;
	
	//import flash.data.*;
	import flash.display.*;
	import flash.events.*;
	import flash.events.*;
	import flash.filters.DropShadowFilter;
	import flash.geom.*;
	import flash.system.LoaderContext;
	import flash.utils.*;
	import flash.external.ExternalInterface;
	
	
	public class PhotoItem extends S{
		private var url:String;
		private var loader:Loader;
		private var roll_over_loader:Loader;
		private var finished_loading:Boolean;
		private var __is_on_screen:Boolean;
		private var roll_over;
		private var progress_text:Text;
		public  var photo_data:Object
		private var over:Boolean;
		private var context:LoaderContext;
		public var is_loaded:Boolean = false;
		private var play_icon:DisplayObject;
		private var mouse_moved:Boolean;
		
		private var __selected:Boolean;
		private var _progress:Number;
		
		public var file_name:Text;
		public var border:S;
		public var thumb:S;
		public var progress_overlay:Sprite;
		public var thumb_image;
		
		public function PhotoItem(p:Object=null, no_load = false){
			 
			 if(p){
				this.photo_data = p;
				this.url = this.photo_data.url;
			 }
			 
			 if(p && !no_load){
 				this.load();
			 }
			 
			this.thumb = new S();
			
			this.thumb.graphics.beginFill(0xF3F3F3);
			var hi;
			var wi = hi = Globals.thumb_size * .6;
			wi = Globals.thumb_size;
			
			if(this.photo_data.width){
				wi = hi = Globals.thumb_size;
				var aspect = this.photo_data.height / this.photo_data.width;
				if(this.photo_data.width > this.photo_data.height)
					hi = Globals.thumb_size/aspect;
				else
					wi = Globals.thumb_size*aspect;
			}
			
			
			
			if(!this.photo_data.thumbnail_ready){
				this.thumb.graphics.drawRect(0,0,wi,hi);
			}
			
			
			//this.thumb.visible = false;
			//Tweener.addTween(this.thumb, {visible:1, time:2, transition:"easeoutexpo"});
			
			this.border = new S();
			//this.border.visible = false;
			//if(this.photo_data.local)
				//this.border.graphics.beginFill(0xCBCBED);
			//else
				//this.border.graphics.beginFill(0xCCCCCC);
				
			//this.border.graphics.drawRect(0, 0, 85, 85);
			
			this.addChild(this.border);
			this.addChild(this.thumb);
			
			this.thumb.doubleClickEnabled = true;
			this.border.doubleClickEnabled = true;
			this.doubleClickEnabled = true;
			this.thumb.addEventListener(MouseEvent.CLICK, this.onClick);
			this.thumb.addEventListener(MouseEvent.DOUBLE_CLICK, this.onDoubleClick);
			this.border.addEventListener(MouseEvent.DOUBLE_CLICK, this.onDoubleClick);
			this.thumb.addEventListener(MouseEvent.MOUSE_OVER, this.onOver);
			this.thumb.addEventListener(MouseEvent.MOUSE_OUT, this.onOut);
			//Globals.stage.addEventListener(MouseEvent.MOUSE_UP, this.parent.onUp);
			this.useHandCursor = true;
			this.buttonMode = true;
			this.setPlayIcon();
			
			//this.thumb.alpha = .8;
			
			
			//shadow
			//var f = new Array();
			//f.push(new DropShadowFilter(2,45,0,.5,4,4,1,1,false,false,false));
			//this.filters = f
			
			//var t = new Timer(Math.random()*5000, 1);
			//t.addEventListener("timer", this.do_load);
			//t.start();
		}
		
		public function do_load(e:Event){
			this.load();
		}
		
		public function load(p=null){
			p = this.photo_data;
			this.is_loaded = true;
			if(p){
				this.photo_data = p;
				this.url = this.photo_data.url;
			}
			
			//Globals.trace("path: " + this.url);
			
			var i:int = null;
			var il = new ItemLoader(this.url, this.onLoadComplete);
			//load thumbs immediately..
			//this.roll_over = new ItemLoader(this.photo_data.thumb_url, this.onThumbComplete);
			
			//this.loader = new Loader();
			//this.loader.load(new URLRequest(this.url), this.context);
			//this.loader.contentLoaderInfo.addEventListener(Event.COMPLETE, onLoadComplete);
			//this.loader.addEventListener(Event.PROGRESS, onLoadProgress);
		}
		
		public function unload(){
			/*
			this.is_loaded = false;
			this.finished_loading = false;
			if(!this.thumb_image)
				return;
			this.thumb.removeChild(this.thumb_image);
			this.thumb_image = null;
			*/
		}
		
		
		public function onLoadComplete(c, id):void {
			this.thumb_image = this.thumb.addChild(c);
			this.finished_loading = true;
			
			this.thumb_image.x = 2;
			this.thumb_image.y = 2;
			
			if(this.file_name){
				try{
					this.thumb.removeChild(this.file_name);
				}
				catch(e:Error){
					
				}
			}
			
			this.thumb_image.visible = true;
			this.thumb_image.alpha = 1;
			
			this.thumb.graphics.clear();
			//this.border.graphics.clear();
			//if(this.photo_data.local)
				//this.border.graphics.beginFill(0xCBCBED);
			//else
				//this.border.graphics.beginFill(0xCCCCCC);
			//this.border.graphics.drawRect(0, 0, this.thumb.width+2, this.thumb.height+2);
			//this.border.no_lay= true;
			
			//this._setprogress(0, true);//just centers progress_text;
			
			if(this.progress>=0)
				this._setprogress(this.progress);
				
			this.setPlayIcon();
		}
		
		private function setPlayIcon(){
			if(this.photo_data.is_video){
				if(!Globals.VARS.story){
					if(!this.play_icon){
						this.play_icon = this.addChild(new ItemLoader("http://l.yimg.com/g/images/video_play_icon_small.png.v1"));
						this.play_icon.addEventListener(MouseEvent.MOUSE_OUT, this.onOut, false, 0, true);
						this.play_icon.addEventListener(MouseEvent.MOUSE_OVER, this.onOver, false, 0, true);
						this.play_icon.addEventListener(MouseEvent.CLICK, this.onClick, false, 0, true);
						this.play_icon.alpha = .87;
					}
					this.positionPlayIcon();
				}
			}
		}
		
		public function get thumbnail_ready():Boolean{
			return this.photo_data.thumbnail_ready;
		}
		
		public function onThumbComplete(b, id):void{
			if(b){
				b.smoothing = true;
				var m = new S();
				m.graphics.beginFill(0xFFFFFF);
				m.graphics.drawRect(0, 0, b.width+7, b.height+6);
				m.graphics.beginFill(0xFFFFFF);
				m.graphics.moveTo((b.width+10)/2-6,b.height+6);
				m.graphics.lineTo((b.width+10)/2+6,b.height+6)
				m.graphics.lineTo((b.width+10)/2,b.height+12)
				m.graphics.lineTo((b.width+10)/2-6,b.height+6);
				this.roll_over = this.addChild(m);
				
				m.no_lay= true;
				this.roll_over.addChild(b);
				b.x=3;
				b.y=3;
				this.roll_over.visible = over;
				this.roll_over.alpha = 0;
				this.positionRollOver();
				if(this.over)
					Tweener.addTween(this.roll_over, {visible:1, alpha:1, time:.2, transition:"exponential"});
				else
					Tweener.addTween(this.roll_over, {visible:0, alpha:0, time:.2, transition:"exponential"});
			}
			
		}
		
		public function onOver(e:Event){
			trace(this.y);
		}
		
		public function onOut(e:Event){
		
		}
		
		public override function get width():Number{
			return Math.ceil((Globals.large || Globals.medium) ? 80*this.thumb.scaleX : 70*this.thumb.scaleX);
		}
		
		
		public function onDoubleClick(e:Event){
			ExternalInterface.call("photos.get_big_file", this.photo_data.id);
		}
		
		public function onClick(e:Event){
		
		}
	
		//TODO:progress/error/etc
		
		public override function setSize(w:Number, h:Number){
			if(Globals.large || Globals.medium){
				this.thumb.scaleX = .6;
				this.thumb.scaleY = .6;
			}
			else{
				this.thumb.scaleX = .4;
				this.thumb.scaleY = .4;
			}
			this.positionRollOver();
			this.positionPlayIcon();
		}
		
		public function set in_view(x:Boolean){
			if(x){
				this.thumb.addEventListener(MouseEvent.CLICK, this.onClick, false, 0, true);
				this.thumb.addEventListener(MouseEvent.MOUSE_OVER, this.onOver, false, 0, true);
				this.thumb.addEventListener(MouseEvent.MOUSE_OUT, this.onOut, false, 0, true);
				if(this.play_icon){
					this.play_icon.addEventListener(MouseEvent.MOUSE_OVER, this.onOver, false, 0, true);
					this.play_icon.addEventListener(MouseEvent.CLICK, this.onClick, false, 0, true);
				}
				
			}
			else{
				this.thumb.removeEventListener(MouseEvent.CLICK, this.onClick);
				this.thumb.removeEventListener(MouseEvent.MOUSE_OVER, this.onOver);
				this.thumb.removeEventListener(MouseEvent.MOUSE_OUT, this.onOut);
				if(this.play_icon){
					this.play_icon.removeEventListener(MouseEvent.MOUSE_OVER, this.onOver);
					this.play_icon.removeEventListener(MouseEvent.CLICK, this.onClick);
				}
			}
		}
		
		private function _setprogress(x:Number){
			if(!this.progress_overlay){
				this.progress_overlay = new Sprite();
				this.progress_overlay.graphics.clear();
				this.progress_overlay.graphics.beginFill(0xFF0084);
				this.progress_overlay.graphics.drawRect(this.thumb.x+2, this.thumb.y, this.thumb.width, 1);
				this.progress_overlay.graphics.endFill();
				this.progress_overlay.y = this.thumb.height;
				this.progress_overlay.alpha = .6;
				this.addChild(this.progress_overlay);
			}
			
			if(!this.progress_text){
				this.progress_text = new Text(40);
				this.progress_text.useHandCursor = true;
				this.progress_text.buttonMode = true;
				this.progress_text.visible = false;
				this.progress_text.color = 0xFFFFFF;
				var f = new Array();
				f.push(new DropShadowFilter(1,50,0,.5,2,2,1,1,false,false,false));
				this.progress_text.filters = f
				this.addChild(this.progress_text);
			}
			
			this.progress_text.text = Math.ceil(x*100)+"%"
			this.progress_text.x = this.thumb.width/2-this.progress_text.width/2;
			this.progress_text.y = this.thumb.height/2-this.progress_text.height/2;
			this.progress_text.visible = true;
			
			Tweener.addTween(this.progress_overlay, {height:this.thumb.height*x, y:this.thumb.height*(1-x)+2, time:1, transition:"linear"});
			this._progress = x;
			
			if(x==1){
				this.progress_text.visible = false;
				this.progress_overlay.alpha = .15;
				Tweener.addTween(this.progress_overlay, {alpha:.25, time:.9, transition:"easeoutexpo"});
			}
		}
		
		public function get progress():Number{
			return this._progress;
		}
		
		public function set progress(x:Number){
			this._setprogress(x);
		}
		
		public function set selected(x:Boolean){
			if(x == this.__selected)
				return;
				
			this.__selected = x;
			this.border.graphics.clear();
			if(x){
				this.border.visible = true;
				//if(this.photo_data.local)
					//this.border.graphics.beginFill(0x3333FF);
				//else
				this.border.graphics.beginFill(0xFF0084);
				var d:int = this.photo_data.thumbnail_ready ? 0 : -2;
				this.border.graphics.drawRect(-.5+d, -.5+d, this.thumb.width+5, this.thumb.height+5);
			}
			else{
				this.border.visible = false;
				//if(this.photo_data.local)
					//this.border.graphics.beginFill(0xCBCBED);
				//else
				//this.border.graphics.beginFill(0xCCCCCC);
			}
		}
		
		public function get selected():Boolean{
			return this.__selected;
		}
		
		public function set is_on_screen(x:Boolean){
			if(this.is_on_screen == x)
				return;
			this.__is_on_screen = x;
			this.visible = this.is_on_screen;
			if(!this.photo_data.thumbnail_ready && !this.file_name){
				this.file_name = new Text(12);
				this.file_name.useHandCursor = true;
				this.file_name.buttonMode = true;
				this.file_name.color = 0x999999;
				
				if(this.photo_data.filename){
					if(this.photo_data.filename.length > 24){
						this.file_name.text = this.photo_data.filename.substr(0,20)+"...";
					}
					else{
						this.file_name.text = this.photo_data.filename
					}
				}
				
				this.file_name.x = (this.thumb.width-file_name.width)/2;
				this.file_name.y = (this.thumb.height-file_name.height)/2;
				//f = new Array();
				//f.push(new DropShadowFilter(1,50,0,.3,1,1,1,1,false,false,false));
				//this.file_name.filters = f
				this.thumb.addChild(this.file_name);
				
			}
		}
		public function get is_on_screen():Boolean{
			return this.__is_on_screen;
		}
		
		private function positionPlayIcon(){
			this.play_icon.x = this.thumb.x + 5;
			this.play_icon.y = this.thumb.y + this.thumb.height -10;
		}
		
		private function positionRollOver(){
			this.roll_over.x = this.thumb.width / 2 - this.roll_over.width / 2;
			this.roll_over.y = - this.roll_over.height - 8;
		}
		
		public function get thumb_url():String{
			return "http://farm" + this.photo_data.farm + Globals.image_host + this.photo_data.server+"/"+this.photo_data.id+"_"+this.photo_data.secret+"_t.jpg";
		}
		
			
					
	}
}
