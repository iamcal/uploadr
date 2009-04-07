package data{
	
	public class Photo{
		
		public var id:String;
		public var farm:String;
		public var server:String;
		public var secret:String;
		public var title:String;
		public var media:String;
		public var originalsecret:String;
		public var original_format:String;
		public var loaded_big:Boolean;
		public var loaded_thumb:Boolean;
		public var o_width:int;
		public var o_height:int;
		public var host:String;
		public var iconserver:String;
		public var iconfarm:String;
		public var info:Info;
		public var buffered:Number;
		public var rotation:Number;
		public var using_original:Boolean = false;
		public var has_been_rotated:Boolean;
		
		public function Photo(i,f,s,sec,osec,ofom,w,h,m,t,iss,icf,rot){
			this.id = i;
			this.farm = f;
			this.server = s;
			this.secret = sec;
			this.originalsecret = osec;
			this.original_format = ofom;
			this.media = m;
			this.o_width = w;
			this.o_height = h;
			this.title = t;
			this.iconserver = iss;
			this.iconfarm = icf;
			this.rotation = Number(rot);
			this.buffered = 0;
		}
		
		
		public function get thumb_url():String{
			return "http://farm" + this.farm + Globals.image_host + this.server+"/"+this.id+"_"+this.secret+"_t.jpg";
		}
		
		public function get square_url():String{
			return "http://farm" + this.farm + Globals.image_host + this.server+"/"+this.id+"_"+this.secret+"_s.jpg";
		}
		
		public function getUrl(w:int = 0):String{
				if(this.o_width == 0 && !this.originalsecret)
					this.o_width = 600;
					
				if (w)
					w = Math.min(w, this.o_width);
				else
					w = this.o_width;
				
				var extra;
				var sec = this.secret;
				/*
				*/
				
				/*
				if(stage.stageWidth <= 500){
					extra = '.jpg'
				}
				else*/ 
				
				this.using_original = false;
				if(this.o_width <= 1280 ){
					if(this.originalsecret && this.original_format){
						sec = this.originalsecret;
						extra = '_o.'+this.original_format;
						this.using_original = true;
					}
					else{ // don't have original permission, smaller than 1280
					
						//should this be lt, or lte?
						if(this.o_width <= 100){
							extra = '_s.jpg';
						}
						else if(this.o_width <= 240){
							extra = '_t.jpg';
						}
						else if(this.o_width <= 500){
							extra = '_m.jpg';
						}
						else { //if(this.o_width <= /*1024*/1280){
							extra = '.jpg'
						}
						/*
						else if(this.o_width <= 1280){
							extra = 'b.jpg'
						}
						*/
						
					}
				}
				else{
					extra = '_b.jpg';
				}
				
				
				return "http://farm" + this.farm + Globals.image_host + this.server+"/"+this.id+"_"+sec+ extra;
		}
		
		public function get needs_rotation():Boolean{
			return this.rotation && this.o_width <=1280 && this.originalsecret && this.original_format;
		}
		
	}
}

/*
s	small square 75x75
t	thumbnail, 100 on longest side
m	small, 240 on longest side
-	medium, 500 on longest side
b	large, 1024 on longest side (only exists for very large original images)
o	original image, either a jpg, gif or png, depending on source format
*/
