package widget{
	import flash.display.*;
	import flash.events.*;
	import flash.net.navigateToURL;
	import flash.net.URLRequest;
	import flash.filters.DropShadowFilter;
	
	import caurina.transitions.*;
	import caurina.transitions.properties.ColorShortcuts;
	import caurina.transitions.properties.FilterShortcuts;
	import flash.text.*;
	
	dynamic public class ActionBar extends AbstractView{
		
		public function ActionBar(mod:Model){
			super(mod);
			
			//this.line = this.addChild(new Sprite());
			this.back = new Sprite();
			this.back.graphics.beginFill(0xFFFFFF);
			this.back.graphics.drawRect(0, 0, 40, 40);
			this.back.height = 50;

			this.addChild(this.back);
			this.text = new Text(22);
			this.text.color = 0xFF0084;
			this.text.text = "photos selected";
			this.text.y = 10;
			this.text.x = 10;
			this.addChild(this.text);
			ColorShortcuts.init();
			FilterShortcuts.init();
			
			this.upload_link = new Link("Sign In",this.uploadClicked, this,true,24);
			
			//shadow
			var f = new Array();
			f.push(new DropShadowFilter(1,45,0,.8,6,6,1,1,false,false,false));
			this.filters = f
			this.alpha = 0;
			this.visible = false;
			
			this.pub = new Option('public', this, this.pubClicked, true);
			this.pri = new Option('private', this, this.priClicked, true);
			
			this.tit = new Text(22);
			this.tit.color = 0xBBBBBB;
			this.tit.tf.autoSize = TextFieldAutoSize.NONE;
			
			this.tit.tf.type = TextFieldType.INPUT;
			this.tit.tf.border = true;
			this.tit.tf.borderColor = 0xCCCCCC;
			this.tit.tf.background = true;
			this.tit.tf.backgroundColor = 0xF4F4F4;
			this.tit.tf.selectable = true;
			this.tit.tf.width = 250;
			this.tit.tf.height = 28;
			this.tit.tf.addEventListener(Event.CHANGE, this.titleTyped);
			this.tit.tf.addEventListener(MouseEvent.MOUSE_UP, this.titleClicked);
			this.tit.multiline = false;
			this.tit.y = 12;
			//this.tit.text = "Title";
			this.set_text = "set all titles";
			this.addChild(this.tit);
			
			this.addEventListener(MouseEvent.CLICK, this.click);
			this.addEventListener(MouseEvent.MOUSE_UP, this.up);
			this.addEventListener(MouseEvent.MOUSE_DOWN, this.down);
			
			this.pub.y = this.pri.y = 13;
			//this.pri.visible = this.pub.visible = this.tit.visible = false;
		}
		
		public function titleClicked(e){
			if(this.tit.text == this.set_text)
				this.tit.text = '';
				
			this.tit.tf.setSelection(0,this.tit.text.length);
		}
		
		public function titleTyped(e){
			var p = null;
			if(this.pub.checked)
				p = 1;
			if(this.pri.checked)
				p = 0;
			this.sendPropsToModel(p);
				
		}
		
		public function sendPropsToModel(p:int){
			var t = this.tit.text;
			
			if(t == this.set_text)
				t = '';
			
			this.m.setSelectedProperties({'title':t, 'is_public':p});
		}
		
		public function pubClicked(e){
			this.pri.checked = false;
			this.pub.checked = true;
			if(e!=null)
				this.sendPropsToModel(1);
		}
		
		public function priClicked(e){
			this.pri.checked = true;
			this.pub.checked = false;
			if(e!=null)
				this.sendPropsToModel(0);
		}
		
		
		public function m_UserChanged(){
			if(this.m.is_logged_in){
				this.upload_link.text = "Upload"
			}
			else{
				this.upload_link.text = "Sign In"
			}
		}
		
		public function m_SelectionChanged(){
			
			if(this.m.selected.length > 0){
				Tweener.addTween(this, {alpha:.9, visible:1, time:.6, transition:"quadratic"});
				this.text.htmlText = "<b>" + this.m.selected.length + "</b> photos selected"
			}
			else{
				Tweener.addTween(this, {alpha:0, visible:0, time:.6, transition:"quadratic"});
				return;
			}
			
			var title_same = true;
			var public_same = true;
			for(var i=1;(title_same == true || public_same==true) && i<this.m.selected.length;i++){
				if(this.m.all[this.m.selected[i]].title != this.m.all[this.m.selected[i-1]].title)
					title_same = false;
				if(this.m.all[this.m.selected[i]].is_public !== this.m.all[this.m.selected[i-1]].is_public)
					public_same = false;
			}
			
			if (title_same && this.m.all[this.m.selected[0]].title != '')
				this.tit.htmlText = this.m.all[this.m.selected[0]].title;
			else
				this.tit.htmlText = '<i>'+this.set_text+'</i>';
			
			if(public_same && this.m.all[this.m.selected[0]].is_public !== null){
				if( this.m.all[this.m.selected[0]].is_public === 1)
					this.pubClicked(null);
				else if(this.m.all[this.m.selected[0]].is_public === 0)
					this.priClicked(null);
			}
			else{
				this.pub.checked = false;
				this.pri.checked = false;
			}
				
			
		}
		
		private function uploadClicked(e:Event){
			e.stopPropagation();
			
			if(!this.m.is_logged_in)
				this.m.login();
			else
				this.m.uploadSelected();
		}
		
		private function down(e:Event){
			e.stopPropagation();
			this.down_on_me = true;
		}
		
		private function up(e:Event){
			if(this.down_on_me)
				e.stopPropagation();
			this.down_on_me = false;
		}
		
		private function click(e:Event){
			e.stopPropagation();
		}
		
		public override function refresh(){
			/*
			this.line.graphics.clear();
			this.line.graphics.moveTo(0,60);
			this.line.graphics.lineStyle(1,0xcccccc);
			this.line.graphics.lineTo(w,60);
			*/
			this.upload_link.x = this.w - this.upload_link.w - 10;
			this.upload_link.y = 10;//this.h - this.upload_link.h - 10;
			//this.pub.y = this.h - this.pub.height - this.pri.height - 20;
			//this.pri.y = this.h - this.pri.height - 10;
			this.pub.x = this.text.x+this.text.width+50;
			this.pri.x = this.pub.x+this.pub.width+15;
			this.tit.x = this.pri.x+this.pri.width+30
			this.tit.tf.width = this.upload_link.x - this.tit.x - 40;
			
			this.back.width = this.w;
		}
		
	}
}
