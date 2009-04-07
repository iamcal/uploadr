package widget{
	
	import flash.events.*;
	import flash.display.*;
	import flash.text.*;
	import flash.filters.*;
	import flash.net.URLRequest;
	import flash.geom.ColorTransform;
	import caurina.transitions.*;
	import flash.external.ExternalInterface;
	
	dynamic public class CloseButton extends SimpleButton {
			
		public function CloseButton(p=null, closeClicked:Function=null){
			super(new LS('close_default'), new LS('close_over'), new LS('close_over'),new LS('close_default'));
			if(closeClicked)
				this.addEventListener(MouseEvent.CLICK, closeClicked);	
			this.addEventListener(MouseEvent.MOUSE_OVER, this.closeOver);
			this.addEventListener(MouseEvent.MOUSE_OUT, this.closeOut);
			//this.alpha = .5
			this.buttonMode = true;
			this.useHandCursor = true;
			if(p){
				p.addChild(this);
			}
		}
		
		public function closeOver(e){
			//this.alpha = 1;
		}
		
		public function closeOut(e){
			//this.alpha = 0.5;
		}
	}
}
