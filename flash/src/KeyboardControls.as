package{
	import flash.events.KeyboardEvent;
	import flash.display.Sprite;
	import flash.events.EventDispatcher;
	
	public class KeyboardControls{
		private var m:Model;
		
		public function KeyboardControls(s, mod:Model){
			this.m = mod;
			s.addEventListener(KeyboardEvent.KEY_UP, keyReleased);
		}
		
		private function keyReleased(e:KeyboardEvent){
			trace(e.keyCode);
			if(e.keyCode == 32){ // space
				Globals.preview.visible = false;
			}
			
			else if(e.keyCode == 188){ // <
				Globals.debug.visible = !Globals.debug.visible;
			}
		}
	}
}
