package widget{
	
	import flash.events.*;
	import flash.text.*;
	import flash.display.*;
	
	
	dynamic public class Option extends S{
		
		private var text:Text;
		private var check_box:SimpleButton;
		private var _checked:Boolean;
		private var f:Function;
		
		public function Option(t:String, parent:Sprite=null, f:Function=null, radio:Boolean=false){
			if(radio){
				this.on_linkage = 'radio_on';
				this.off_linkage = 'radio_off';
			}
			else{
				this.on_linkage = 'checkbox_on';
				this.off_linkage = 'checkbox_off';
			}
			
			this.check_box = new SimpleButton(new LS(this.on_linkage), new LS(this.on_linkage), new LS(this.off_linkage), new LS(this.off_linkage));
			this.check_box.y = 3;
			this.addChild(this.check_box);
			this.field = new TextField();
			this.field.autoSize = TextFieldAutoSize.LEFT;
			this.field.background = false;
			this.field.border = false;
			this.addChild(this.field);
			var format:TextFormat = new TextFormat();
			format.font = "Arial";
			format.color = 0x999999;
			format.size = 20;
			this.useHandCursor = true;
			this.buttonMode = true;
			this.field.defaultTextFormat = format;
			this.field.htmlText = "<a href=''>" + t + '</a>';
			this.field.selectable = false;
			this.field.x = 25;
			
			this.check_box.addEventListener(MouseEvent.CLICK, this.checkClicked);
			this.field.addEventListener(MouseEvent.CLICK, this.checkClicked);
			this.useHandCursor = true;
			
			if(parent)
				parent.addChild(this);
			
			this.checked = false;
			this.callback = f;
				
		}
		
		public function get checked():Boolean{
			return this._checked;
		}
		
		public function set checked(x:Boolean){
			this._checked = x;
			if(this.checked){
				this.check_box.upState = new LS(this.on_linkage);
				this.check_box.downState = new LS(this.on_linkage);
				this.check_box.overState = new LS(this.on_linkage);
			}
			else{
				this.check_box.upState = new LS(this.off_linkage);
				this.check_box.downState = new LS(this.off_linkage);
				this.check_box.overState = new LS(this.off_linkage);
			}
		}
		
		private function checkClicked(e:Event){
			e.stopPropagation();
			this.checked = !this.checked
			if(this.callback){
				this.callback(this.checked);
			}
		}
		
	}
	
}

