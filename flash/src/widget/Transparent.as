package widget{
	
	dynamic public class Transparent extends S{
			
			public function Transparent(){
				this.graphics.beginFill(0x000000);
				this.graphics.drawRect(0, 0, 1, 1);
				this.alpha = 0;
				this.no_lay = true;
			}
	}
}
