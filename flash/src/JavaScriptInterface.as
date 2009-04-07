package{
	import flash.external.ExternalInterface;
	
	public class JavaScriptInterface{
		private var m:Model;
		
		public function JavaScriptInterface(mod:Model){
			this.m = mod;
			ExternalInterface.addCallback("load", this.load);
			ExternalInterface.addCallback("logged_in", this.logged_in);
			ExternalInterface.addCallback("load_string", this.load_string);
			ExternalInterface.addCallback("reset", this.reset);
			ExternalInterface.addCallback("get_flash_obj", this.get_flash_obj);
			ExternalInterface.addCallback("add_file", this.add_file);
			ExternalInterface.addCallback("add_files", this.add_files);
			ExternalInterface.addCallback("thumbnail_done", this.thumbnail_done);
			ExternalInterface.addCallback("big_done", this.big_done);
			ExternalInterface.addCallback("update_upload_progress", this.update_upload_progress);
		}
		
		public function get_flash_obj(){
			this.m.updateSets();
			return {'sets':this.m.sets};
		}
		
		public function add_files(files){
			Globals.trace('add_files' + files.length);
			this.m.add_files(files);
		}
		
		public function add_file(o, folder_name=null){
			this.m.add_files([[o,folder_name]]);
			
		}
		
		public function logged_in(u){
			this.m.logged_in(u);
		}
		
		public function reset(){
			Globals.trace('reset!');
			this.m.reset();
		}
		
		public function load_string(s){
			var x = s;
			//this.m.load(o);
		}
		
		public function load(o){
			this.m.load(o);
		}
		
		public function update_upload_progress(id, progress){
			//Globals.trace('o:' + id);
			//var id = id.id;
			//Globals.trace('pr: ' + id);
			//Globals.trace('pr: ' + progress);
			this.m.updateProgress(id, progress);
		}
		
		public function big_done(p, path:String){
			Globals.trace('big done');
			var id = p.id;
			if(!this.m.all[id])
				return;
			var u = Globals.replaceAll(path,'\\','/');
			//NOTE: does file:// work in windows?
			var big_path = 'file://'+u; ///Users/Australia-thumb8.gif';//Globals.replaceAll(u, ' ', '\\ ');
			this.m.setBigUrl(id, big_path);
			
		}
		
		public function thumbnail_done(p, path:String){
			
			
			var id = p.id;
			if(!this.m.all[id])
				return;
			
			if(p.date_taken){
				var s = p.date_taken;
				s = s.split(" ");
				s[0] = s[0].split(":");
				s[1] = s[1].split(":");
				
				var d = new Date(Number(s[0][0]), Number(s[0][1])-1 /*zero indexed..*/, Number(s[0][2]), Number(s[1][0]), Number(s[1][1]), Number(s[0][2]));
				//Globals.trace('new date_taken:' + d);
				this.m.all[id].datetaken = d;
			}
			
			this.m.all[id].width = p.width;
			this.m.all[id].height = p.height;
			
			this.m.all[id].thumbnail_ready = true;
			
			var u = Globals.replaceAll(path,'\\','/');
			this.m.all[id].url = 'file://'+u; ///Users/Australia-thumb8.gif';//Globals.replaceAll(u, ' ', '\\ ');
			Globals.photo_grid.startLoadingThumbsAgain();
			
			
		}
		
	}
}
