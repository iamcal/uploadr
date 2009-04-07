package widget {
	import flash.display.Graphics;
	import flash.display.SimpleButton;
	import flash.display.Sprite;
	import flash.events.*;
	import flash.filters.DropShadowFilter;
	
	dynamic public class TopButton extends Sprite {
		
			private static const HOVER_COLOR:uint = Globals.BUTTON_HOVER;//0x5a5a5a; // wite
			private static const DEFAULT_COLOR:uint = Globals.BUTTON_DEFAULT;//0x2a2a2a; // light grey
			private static const SYMBOL_COLOR:uint = 0xFFFFFF; // dark grey
			
			
			private var __on:Boolean;
			private var txt:Text;
			private var arrow:String;
			private var is_over:Boolean;
			private var current_color;
			private var on_text:String;
			private var off_text:String;
			
			
			public function TopButton(t:String, f:Function=null, arrow=null, t_on:String=null){
				
				this.on_text = t_on;
				this.off_text = t;
				this.txt = new Text(12);
				txt.useHandCursor = true;
				txt.buttonMode = true;
				txt.mouseChildren = false;
				txt.htmlText = t;
				this.addChild(txt);
				var w = txt.width + 30;
				this.arrow = arrow;
				
				if(arrow)
					w+=5
				var h = txt.height;
				txt.y = 0;
				txt.x = 15;
				if(arrow == "previous")
					txt.x += 3;
				if(arrow == "next")
					txt.x -= 4;
			
				
				this.useHandCursor = true;
				this.buttonMode = true;
				this.drawBack(DEFAULT_COLOR);
				
				this.addEventListener(MouseEvent.MOUSE_OVER, this.over);
				this.addEventListener(MouseEvent.MOUSE_OUT, this.out);
				if(f)
					this.addEventListener(MouseEvent.CLICK, f);
				//this.alpha = .8;
				var F = new Array();
				//this is for the text to fade out;
				F.push(new DropShadowFilter(0,0,0,0,0,0,1,1,false,false,false));
				this.filters = F;
			}
			
			private function set text(x:String){
				this.txt.htmlText = x;
				this.drawBack(this.current_color);
			}
			
			private function drawBack(color){
				this.current_color = color;
				var g:Graphics = this.graphics;
				var w = txt.width + 30;
				var h = txt.height;
				g.clear();
				g.beginFill(color);
				g.drawRect(1, 0, w - 2, h);
				g.endFill();
				g.beginFill(color);
				g.drawRect(0, 1, w, h - 2);
				g.endFill();
				if(arrow == "previous"){
					g.beginFill(0xffffff);
					g.moveTo(15,5);
					g.lineTo(15,13);
					g.lineTo(15-5,9);
					g.lineTo(15,5);
					g.endFill();
				}
				else if (arrow == "next"){
					var w = txt.width + 15;
					g.beginFill(0xffffff);
					g.moveTo(w,5);
					g.lineTo(w,13);
					g.lineTo(w+5,9);
					g.lineTo(w,5);
					g.endFill();
				}
			}
			
			private function over(e:Event){
				this.is_over = true;
				this.drawBack(HOVER_COLOR);
				//this.alpha = 1;
			}
			
			private function out(e:Event){
				this.is_over = false;
				this.drawBack(DEFAULT_COLOR);
				/*
				if(!this.on)
					this.drawBack(DEFAULT_COLOR);
				else
					this.drawBack(HOVER_COLOR);
					*/
			}
			
			public function set on(x:Boolean){
				this.__on = x;
				this.text = this.off_text;
				if(this.on && this.on_text)
					this.text = this.on_text;
					
				/*
				if(this.on)
					this.drawBack(HOVER_COLOR);
				else if(!this.is_over)
					this.drawBack(DEFAULT_COLOR);
					*/
					
				if(x)
					this.alpha = 1;
			}
			
			public function get on():Boolean{
				return this.__on;
			}

	}
}
