package data{
	
	public class Info{
		
		
		public var id:String;
		public var is_favorite:Boolean;
		public var owner_id:String;
		public var owner_username:String;
		public var url:String;
		public var title:String;
		public var description:String;
		public var num_comments:int;
		public var item:Photo;
		
		public function Info(i,isfav,o_id, o_name, t,d,u,nc){
			this.id = i;
			this.is_favorite = isfav == '1'?true:false;
			this.owner_id = o_id;
			this.owner_username = o_name;
			this.title = t;
			this.description = d;
			this.url = u
			this.num_comments = nc			
		}
				
		public function get buddy_icon_url():String{
			if(int(this.item.iconserver) > 0)
				return 'http://farm'+this.item.iconfarm+Globals.image_host+this.item.iconserver+'/buddyicons/'+this.owner_id+'.jpg';
			else
				return 'http://www.flickr.com/images/buddyicon.jpg'
			
			//return Globals.host + '/buddyicons/'+this.owner_id+".jpg";
		}
		
	}
}

