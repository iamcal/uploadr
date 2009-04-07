package {
	
	import flash.display.Sprite;
	
	//only extends sprite for access to the stage
	dynamic public class Layout extends Sprite{
		public static var m;
	
	
		public function Layout(){
			//this.refresh();
		}
		
		
		
		/*
		public function clearSizes():void{
			for (var j in this.things){
				this.things[j].ss(undefined, undefined);
			}
		}
		*/
		
		/*
		public function addItem(t:MC):void{
			this.things.push(t);
			t.in_lay = this;
		}
		
		public function removeItem(t:MC):Boolean{
			for (var j=0; j<this.things.length;j++){
				if(this.things[j] == t){
					this.things.splice(j, 1);
					return true
				}
			}
			return false;
		}
		
		public function reorderItem(from_index, before_index):void{
			var item = this.things.splice(from_index, 1)[0];
			this.things.splice(before_index, 0, item);
			this.refresh();
		}
		*/
		
		
		static public function refresh(o:Object=null):void{
			//if(!display_obj)
				//display_obj = stage;
			try{
				o.refresh();
			}
			catch(e:Error){};
			//for(var i=0; i < this.o.numChildren;i++)
				//this.o.getChildAt(i).refresh();
			try{
			for(var i=0; i < o.numChildren;i++)
				Layout.refresh(o.getChildAt(i));
			}
			catch(e:Error){};
		}
	}
}

