package {
	import flash.events.Event;
	import flash.events.DataEvent;
	import flash.events.ProgressEvent;
	import flash.events.EventDispatcher;
	import flash.utils.Timer;
	import flash.utils.ByteArray;
	import flash.net.URLLoader;
	import flash.net.URLRequest;
	import flash.net.URLVariables;
	import flash.net.FileReferenceList;
	import flash.external.ExternalInterface;
	
	public class Model{
	
	
		public var current_tags:Object;
		public var user:Object;
		
		private var tag:String;
		public var mode:String;
		
		public var oldest_date:Date;
		
		public var newest_date:Date;
		
		
		public var sets_by_id:Object = new Object();
		public var tags_by_id:Object = new Object();
		public var tags:Object = new Object();
		
		public var all:Object = new Object();
		
		public var uploads:Array = new Array();
		
		public var sets:Array = new Array();
		
		public var current_id:String;
		public var current:Array = new Array();
		public var current_by_id:Object;
		
		
		public var set_data = new Array();
		public var tag_data = new Array();
		public var selection = new Array();
		
		public var all_files = new Object();
		
		public var sections:Array;
		public var list_sections:Array;
		public var photos:Array = new Array();
		
		public var thumb_size:Number = 1;
		
		public var current_state:String;
		
		public var user_id:String;
		
		
		public var initialized:Boolean;
		
		public var selected:Array;
		public var selection_by_id:Object = {};
		
		private var views:Array = new Array();
		private var timer:Timer;
		//private var api:FlickrAPI;
		private var wait_to_switch_to_id;
		private var look_larger;
		
		public var tag_sections:Array = new Array();
		
		
		
		private var started:Boolean = false;
		
		private var api_extras:String = 'o_dims,rotation,original_format,media,icon_server,date_taken,tags,description';
		
		public function Model(){
			
			this.mode = "date";
			
			if(Globals.VARS.offsite)
				this.setState("TitleScreen");
			else
				this.setState("SlideShow");
			
			this.initialized = false;
			
			
			this.user_id = Globals.VARS.user_id;
			
			//this.api = new FlickrAPI(this.onError);
		}
		
		public function reset(){
			this.sets_by_id = new Object();
			this.tags_by_id = new Object();
			this.all = new Object();
			this.sets = new Array();
			this.current_by_id = new Object();
			this.current_id = null;
			this.current = new Array();
			this.tag_sections = new Array();
			this.set_data = new Array();
			this.tag_data = new Array();
			this.selection = new Array();
			this.all_files = new Object();
			this.sections = new Array();
			this.list_sections = new Array();
			this.uploads = new Array();
			this.photos = new Array();
			this.updateSets();
			this.updateList();
			this.dispatch("ListChanged");
			this.refreshMode();
			this.dispatch("CurrentChanged");
			this.dispatch("Reset");
		}
		
		
		public function start(){
			this.setInitialized(true);
		}
		
		public function setSelected(a:Array, additive:Boolean=false){
			
			if(!additive){
				this.selected = new Array();
				this.selection_by_id = new Object();
			}
			
			for(var j in a){
				if(!this.selection_by_id[a[j]]){
					this.selection_by_id[a[j]] = this.all[a[j]];
					this.selected.push(a[j]);
				}
			}
			this.dispatch("SelectionChanged");
		}
		
		public function setSelectedProperties(prop){
			
			for(var k in this.selected){
				this.all[ this.selected[k] ].title = prop['title'];
				this.all[ this.selected[k] ].is_public = prop['is_public'];
			}
			
		}
		
		
		public function uploadSelected(){
			var list = new Array();
			var size = 0;
			for(var i=0; i<this.selected.length;i++){
				var p = this.all[this.selected[i]];
				list.push([p.id, p.is_public, p.title]);
				size+=p.size;
			 	p.progress = 0;
				this.uploads.push(p);
			}
			this.updateSets();
			this.updateList();
			this.dispatch("ListChanged");
			
			ExternalInterface.call("photos.upload", list, size);
		}
		
		public function login(){
			ExternalInterface.call("users.logout", true);
			ExternalInterface.call("users.login", true);
		}
		
		public function logout(){
			ExternalInterface.call("users.logout", true);
		}
		
		public function get is_logged_in():Boolean{
			return Boolean(user);
		}
		
		public function logged_in(user){
			this.user = user;
			this.dispatch("UserChanged");
		}
		
		public function updateProgress(id:String,progress:Number){
			this.all[id].progress = progress;
			this.dispatch("UploadProgressChanged");
		}
		
		public function add_files(list:Array){
			
			for(var i=0;i<list.length;i++){
				var folder_name = list[i][1]?list[i][1]:'new_uploads';
				var folder_id = folder_name;//Globals.toAsciiOnly(folder_name);//Globals.intToString(folder_name);
				if(!this.sets_by_id[folder_id]){
					this.sets.unshift({special:true, _content:folder_name, id:folder_id, photos:0, content:new Array()});
					this.updateSets();
				}
				
				var p = {
					finished:false, 
					local:true, 
					big_url:list[i][0].path,	
					
					/* don't know these until thumbnail
					width:Number(list[i][0].width),	
					height:Number(list[i][0].height),
					*/
					
					id:String(list[i][0].id),
					datetaken:null,//new Date(),
					filename:list[i][0].filename,
					title:list[i][0].title,
					tags:list[i][0].name +' '+folder_name,
					size:list[i][0].size,
					is_public:list[i][0].is_public,
					is_video:list[i][0].is_video
				};
				
				if(!p.id)
					p.id = p.filename+list[i][0].size;
				
				this.all[p.id] = p;
				this.photos.push(p);
				
				this.sets_by_id[folder_id].content.push(p);
				this.sets_by_id[folder_id].photos = this.sets_by_id[folder_id].content.length;
			}
			
			this.updateList();
			this.dispatch("ListChanged");
			
		}
		
		public function setBigUrl(id, path){
			this.all[id].big = path;
			this.dispatch("BigUrlsChanged", [id]);
		}
		
		public function setInitialized(x:Boolean){
			if(x == this.initialized)
				return;
			
			this.initialized = x;
			this.dispatch("InitializedChanged");
		}
		
		public function setState(x:String){
			this.current_state = x;
			this.dispatch("StateChanged");
		}
		
		public function changeMode(x:String){
			this.mode = x;
			this.refreshMode();
			this.dispatch("ModeChanged");
		}
			
		private function refreshMode(x:Boolean=false){
			if(!this.current)
				return;
				
			if(this.mode == "date"){
				this.viewByDate(x);
			}
			else if(this.mode == "tag"){
				this.viewByTag(x);
			}
			else if(this.mode == "timeline"){
				if(!Globals.VARS.story)
					this.viewByDate(x);
					
				this.dispatch("SectionsChanged");
			}
		}
		
		
		public function getThumbScale(){
			return (this.thumb_size-.2)/1.2
		}
		
		public function setThumbSize(x){
			this.thumb_size = x*1.2+.2;
			this.dispatch("ThumbSizeChanged");
		}
		
		public function updateSets(){
				
			for(var j in this.sets){
				this.sets_by_id[this.sets[j].id] = this.sets[j];
			}
			
			if(this.photos && this.photos.length > 0 && !this.sets_by_id['all_photos']){
				this.sets.push({special:true, _content:'All Photos', id:'all_photos', photos:this.photos.length, content:this.photos});
				this.sets_by_id['all_photos'] = this.sets[this.sets.length-1];
			}
			else if (this.sets_by_id['all_photos']){
				this.sets_by_id['all_photos'].photos = this.photos.length;
				this.sets_by_id['all_photos'].content = this.photos;
				
			}
			if(this.uploads && this.uploads.length > 0 && !this.sets_by_id['uploads']){
				this.sets.unshift({upload:true, _content:'uploads', id:'uploads', photos:this.uploads.length, content:this.uploads});
				this.sets_by_id['uploads'] = this.sets[0];
			}
			else if (this.sets_by_id['uploads']){
				this.sets_by_id['uploads'].photos = this.uploads.length;
				this.sets_by_id['uploads'].content = this.uploads;
			}
			
			for(var j in this.tags){
				this.tags_by_id[this.tags[j]._content] = this.tags[j];
			}
			
		}
		
		public function get current_title():String{
			if(this.sets_by_id[this.current_id])
				if(this.sets_by_id[this.current_id].title)
					return this.sets_by_id[this.current_id].title._content;
				else
					return this.sets_by_id[this.current_id]._content;
			else if (this.tags_by_id[this.current_id]){
				return this.tags_by_id[this.current_id]._content;
			}
			else
				return "";
		}
		
		private function updateList(){
			this.list_sections = new Array();
			this.list_sections.push({title:'your photos', ids:new Array()}); //0
			this.list_sections.push({title:'sets', ids:new Array()}); //1
			this.list_sections.push({title:'tags', ids:new Array()}); //2
			this.list_sections.push({title:'folders', ids:new Array()}); //3
			this.list_sections.push({title:'flickr uploads', ids:new Array()}); //4
			
			for(var j=0;j<this.sets.length;j++){
				if(this.sets[j].special)
					this.list_sections[0].ids.unshift(this.sets[j].id);
				else if(this.sets[j].local)
					this.list_sections[3].ids.push(this.sets[j].id);
				else if(this.sets[j].upload)
					this.list_sections[4].ids.push(this.sets[j].id);
				else
					this.list_sections[1].ids.push(this.sets[j].id);
			}
			
			
			for(var j in this.tags){
				this.list_sections[2].ids.push(this.tags[j]._content);
			}
			
			for(var i =0; i< this.list_sections.length;i++){
				if(this.list_sections[i].ids.length == 0){
					this.list_sections.splice(i, 1);
					i-=1;
				}
			}
		}
		
		public function load(o:Object){
			
			if(!o || !o.sets)
				return;
				
			//this.sets_by_id = o.sets_by_id;
			this.sets = o.sets;
			
				
			this.updateSets();
			
			this.updateList();
				
			this.photos = new Array();
			for(var j in this.sets_by_id){
				if (j == 'all_photos')
					continue;
				
				for(var k in this.sets_by_id[j].content){
					var photo = this.sets_by_id[j].content[k];
					this.all[photo.id] = photo;
			 		if(photo.progress!=1){
						delete(photo.progress);
					}
					else if(j!='uploads'){
						this.uploads.push(photo);
					}
					this.photos.push(photo);
				}
			}
			this.updateSets();
			this.dispatch("ListChanged");
			return;
		
		}
		
		public function setFilter(id:String){
			if(this.sets_by_id[id]){
				if(!this.sets_by_id[id].content){
					//this.getSet(id);
				}
				else{
					this._setCurrentSet(id);
					this.dispatch("CurrentChanged");
					//this.dispatch("SectionsChanged");
					Globals.VARS.set_id = Globals.VARS.zoom = Globals.VARS.scroll = null;
				}
			}
			else{
				//this.getTag(id);
			}
			//Globals.trace('saving ' + this.sets_by_id);
			//var t = ExternalInterface.call("flash_save", {'sets':this.sets});
			//Globals.trace('after ' + this.sets_by_id+t);
		}
		
		public function doSearch(s:String){
			var nc = new Array();
			if(s == ""){
				this.setFilter(this.current_id);
				return;
			}
			this.current_by_id = new Object();
			for(var j in this.current_tags){
				if(String(j).substring(0,s.length) == s){
					for(var i =0; i< this.current_tags[j].length;i++){
						if(!this.current_by_id[this.current_tags[j][i].id]){
							nc.push(this.current_tags[j][i]);
							this.current_by_id[this.current_tags[j][i].id] = this.current_tags[j][i];
						}
					}
				}
			}
			
			this.current = nc;
			this.updateCurrentById()
			this.clearSections();
			this.refreshMode(true);
			this.dispatch("CurrentChanged");
		}
		
		private function _setCurrentSet(id){
			this.current_id = id;
			if(this.sets_by_id[id])
				this.current = this.sets_by_id[id].content;
			else
				this.current = this.tags_by_id[id].content;
				
			this.current_tags = new Object();
			
			this.updateDatesTags();
				
			//this.updateCurrentById();
			this.clearSections();
			//this.refreshMode(true);
		}
		
		public function updateDatesTags(){
			this.oldest_date = new Date();
			this.newest_date = new Date();
			this.newest_date.time -= 100*Globals.YEAR;
			
			for(var i=0; i < this.current.length; i++){
				if(this.current[i].tags){
					var ts:Array = this.current[i].tags.split(" ");
					for(var k=0; k<ts.length;k++){
						if(!this.current_tags[ts[k]])
							this.current_tags[ts[k]] = new Array();
						this.current_tags[ts[k]].push(this.current[i]);
					}
				}
				if(!this.current[i].datetaken)
					continue;
					
				if(this.current[i].datetaken < this.oldest_date)
					this.oldest_date = this.current[i].datetaken;
				if(this.current[i].datetaken > this.newest_date)
					this.newest_date = this.current[i].datetaken;
			}
		}
		
		public function getTag(tag){
			this.tag = tag;
			//this.api.call('flickr.photos.search', {extras:this.api_extras, format:'json', user_id:Globals.VARS.user_id, tags:tag, per_page:500, page:1}, this.onGetTag);
		} public function onGetTag(o:Object){
			this.tags_by_id[this.tag].content = o.photos.photo;
			this.convertDates(this.tags_by_id[this.tag].content);
			this._setCurrentSet(this.tag);
			this.dispatch("CurrentChanged");
		}
		
		public function getSet(id){
			//this.api.call('flickr.photosets.getPhotos', {photoset_id:id, format:'json', per_page:500, extras:this.api_extras}, this.onGetSet);
		} public function onGetSet(o:Object){
			this.sets_by_id[o.photoset.id].content = o.photoset.photo;
			this.convertDates(this.sets_by_id[o.photoset.id].content);
			this._setCurrentSet(o.photoset.id);
			this.dispatch("CurrentChanged");
		}
		
		private function updateCurrentById(){
			this.current_by_id = new Object();
			for(var i=0; i < this.current.length;i++){
				this.current_by_id[this.current[i].id] = this.current[i];
			}
		}
		
		public function onGetTags(o:Object){
			this.tag_data = o;
			for(var j in this.tags){
				this.tags[j].id = this.tags[j]._content;
			}
			
			this.updateSets();
			this.updateList();
			this.dispatch("TagsChanged");
			this.dispatch("ListChanged");
		}
		
		
		private function convertDates(o){
			this.oldest_date = new Date();
			this.newest_date = new Date();
			this.newest_date.time -= 100*Globals.YEAR;
			for(var j in o){
				if(!o[j].datetaken)
					continue;
					
				if(o[j].datetaken)
					o[j].datetaken = this.toDate(o[j].datetaken)
				if(o[j].datetaken < this.oldest_date)
					this.oldest_date = o[j].datetaken;
				if(o[j].datetaken > this.newest_date)
					this.newest_date = o[j].datetaken;
			}
		}

		private function clearSections(){
			this.sections = new Array();
		}
		
		public function viewByTag(quiet=false){
			var temp_tags:Object = new Object();
			for(var i:int=0; i < this.current.length;i++){
				if(this.current[i].tags)
					var ts:Array = this.current[i].tags.split(" ");
				else
					var ts:Array = new Array();
				if(ts.length == 0){
					if(!temp_tags['Untagged'])
						temp_tags['Untagged'] = {title:'Untagged', ids:new Array()}
					temp_tags['Untagged'].ids.push(this.current[i].id);
				}
				//for(var k=0;k<ts.length;k++){
				else{
					if(!temp_tags[ts[0]])
						temp_tags[ts[0]] = {title:ts[0], ids:new Array()};
					temp_tags[ts[0]].ids.push(this.current[i].id);
				//}
				}
			}
			
			this.tag_sections = new Array();
			for(var j in temp_tags){
				this.tag_sections.push(temp_tags[j]);
			}
			
			this.sections = this.tag_sections;
			
			if(!quiet)
				this.dispatch("SectionsChanged");
			
		}
		
		public function viewByDate(quiet=false){
			var dates = new Array();

			var date = new Date();
			while(date > this.oldest_date){
				dates.push(date);
				date = new Date(date);
				date.time -= Globals.DAY;
			}
			this.sections = new Array();
			for(var i=0; i< dates.length;i++){
				this.sections.push({date:dates[i], title:String(dates[i].toDateString()), ids:new Array()});
			}
			
			for(var i=0; i < this.current.length;i++){
		 		var k=0;
				if(!this.sections[k])
					continue;
					
				while(k< this.sections.length && this.current[i].datetaken < this.sections[k].date)
					k++
				if(k==this.sections.length)
					k--;
				if(this.sections[k])
					this.sections[k].ids.push(this.current[i].id);
			}
			
			/*
			var now:Date = new Date();
			var hour_ago:Date = new Date();
			hour_ago.time -= Globals.HOUR;
			var yesterday:Date = new Date();
			yesterday.time -= Globals.DAY;
			var two_days_ago:Date = new Date();
			two_days_ago.time -= Globals.DAY;
			var week_ago:Date = new Date();
			week_ago.time -= Globals.WEEK;
			var month_ago:Date = new Date();
			month_ago.time -= Globals.MONTH;
			var year_ago:Date = new Date();
			year_ago.time -= Globals.YEAR;
			
			this.sections = new Array();
			this.sections.push({date:now, 		title:'past hour', ids:new Array()}); //0
			this.sections.push({date:hour_ago,  	title:'today', ids:new Array()}); //1
			this.sections.push({date:yesterday, 	title:'yesterday', ids:new Array()}); //2
			this.sections.push({date:two_days_ago,  title:'past week', ids:new Array()}); //3
			this.sections.push({date:week_ago,  	title:'past month', ids:new Array()}); //4
			this.sections.push({date:month_ago, 	title:'past year', ids:new Array()}); //5
			this.sections.push({date:year_ago,  	title:'rest', ids:new Array()}); //6
			if(!this.current)
				return;
				
			for(var i=0;i<this.current.length;i++){
				if(this.current[i].datetaken > hour_ago){
					this.sections[0].ids.push(this.current[i].id);
				}
				else if(this.current[i].datetaken > yesterday){
					this.sections[1].ids.push(this.current[i].id);
				}
				else if(this.current[i].datetaken > two_days_ago){
					this.sections[2].ids.push(this.current[i].id);
				}
				else if(this.current[i].datetaken > week_ago){
					this.sections[3].ids.push(this.current[i].id);
				}
				else if(this.current[i].datetaken > month_ago){
					this.sections[4].ids.push(this.current[i].id);
				}
				else if(this.current[i].datetaken > year_ago){
					this.sections[5].ids.push(this.current[i].id);
				}
				else{
					this.sections[6].ids.push(this.current[i].id);
				}
			}
			*/
			
			for(var i =0; i< this.sections.length;i++){
				if(this.sections[i].ids.length ==0){
					this.sections.splice(i, 1);
					i-=1;
				}
			}
			
			if(!quiet)
				this.dispatch("SectionsChanged");
		}

		
		public function toDate(s){
			s = s.split(" ")
			s[0] = s[0].split('-');
			s[1] = s[1].split(':');
			return new Date(Number(s[0][0]), Number(s[0][1])-1/*zero indexed..*/, Number(s[0][2]), Number(s[1][0]), Number(s[1][1]), Number(s[0][2]));
		}
		
		public function registerView(v:Object){
			this.views.push(v);
		}
		
		private function dispatch(event_string, args=null){
			if(args == null)
				args = [];
				
			if(event_string != "BufferedChanged")
				trace("event: " + event_string);
			
			
			
			for each (var o:Object in this.views){
				var func_name = "m_" + event_string;
				if(o[func_name]){
					o[func_name].apply(o, args)
				}
			}
		}
		
	}
	
}

/*
this.loader = new Loader();
this.loader.load("http://somewebsite.com/image.png");
this.loader.addEventListener(Event.COMPLETE, onLoadComplete);
 
public function onLoadComplete(event:Event):void {
 var thumbnail:Sprite = new Sprite();
 thumbnail.addChild(this.loader);
}

*/
