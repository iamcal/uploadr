package widget{	
	import flash.events.*;
	import flash.text.*;
	
	
	dynamic public class SelectableText extends TextField{
		
		public function SelectableText(size=14, parent=null){
			//this.autoSize = TextFieldAutoSize.LEFT;
			//this.background = false;
			//this.selectable = false;
			var format:TextFormat = new TextFormat();
			format.font = "Arial";
			format.color = 0x000000;
			format.size = size;
			this.size = size;
			this.backgroundColor = 0xffffff;
			this.background = true;
			this.border = true;
			this.borderColor=0x555555;
			this.alwaysShowSelection = false;
			this.defaultTextFormat = format;
			this.addEventListener(MouseEvent.CLICK, this.clicked);
			
			if(parent)
				parent.addChild(this);
			
			//TODO: why?
			this.height = 20;
		}

		public function clicked(e:Event){
			this.setSelection(10000, 0);
		}
		
	}
	
}
