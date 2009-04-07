package {
	//import flash.filesystem.File;
	
	import caurina.transitions.Tweener;
	import caurina.transitions.properties.FilterShortcuts;
	
	import flash.display.*;
	import flash.events.*;
	import flash.external.ExternalInterface;
	import flash.system.Security;
	import flash.utils.Timer;
	import flash.net.URLRequest;
	
	import flash.text.TextField;
	
	import flash.text.TextFormat;
	
	import widget.*;


	[SWF(width='980', height='782', backgroundColor='#FCFCFC', frameRate='30')]
	dynamic public class Desktop extends Sprite{
		private var m:Model;
		
		
		private var black_background:S;
		
		private var js:JavaScriptInterface;
		private var title_screen;
		private var end_screen;
		private var back:S;
		private var timer:Timer;
		private var display_items:Array;
		private var mouse_out:Boolean = true;
		//private var upload_lnk:UploadLink;
		
		public var content:S;
		public var debug:TextField;
		
		private var got_data:Boolean;
		
		
		
		
		//private var pause_dialog:PauseDialog;
		//private var no_photos_message;
		
		public function Desktop(){
			Globals.init(root, stage);
			Security.allowDomain('*');
			
			this.addEventListener(Event.ADDED_TO_STAGE, this.onAddedToStage);
			//initialize();
		}
		  
		private function onAddedToStage(e:Event):void {
			
			this.content = new S();
			Globals.content = this.content;
			this.addChild(this.content);
			//this.debug = new TextField();
			/*
			var format:TextFormat = new TextFormat();
			format.font = "Anonymous";
			format.color = 0x444444;
			format.size = 10;
			this.debug.defaultTextFormat = format;
			this.debug.visible = false;
			this.debug.wordWrap = true;
			*/
			//Globals.debug = this.debug;
			
			this.method = 'h';
			this.m = new Model();
			this.m.registerView(this);
			
			this.preview = new Preview(this.m);
			Globals.preview = this.preview;
			this.addChild(this.preview);
			
			Globals.model = this.m;
			var k = new KeyboardControls(stage, this.m);
			this.js = new JavaScriptInterface(this.m);
			Globals.stage.addEventListener(Event.RESIZE, this.onResize);
			
			stage.showDefaultContextMenu = false;
			stage.scaleMode = StageScaleMode.NO_SCALE;
			stage.align = StageAlign.TOP_LEFT;
			
			this.black_background = new S();
			if(Globals.VARS.story)
				this.black_background.graphics.beginFill(0xFCFCF8);
			else
				this.black_background.graphics.beginFill(0xFCFCFC);
				
			this.black_background.graphics.drawRect(0,0,1,1);
			this.black_background.no_lay = true;
			
			this.addChildAt(this.black_background, 0);
			
			this.m.start();
			Layout.refresh(this);
			//ExternalInterface.call("ui.init");
			
			this.timer = new Timer(10,1);
			this.timer.addEventListener("timer", doLoad);
			this.timer.start();
			
			//this.visible = false;
			//ptrace("EI: " + ExternalInterface.call('_get_cookie', "cookie_session"));
		}
		
		private function doLoad(e){
			//ExternalInterface.call("users.load");
			ExternalInterface.call("photos.load");
			//ExternalInterface.call("photos.init");
		}
		
		public function m_PhotostreamChanged(){
			this.visible = true;
			Layout.refresh(this);
		}
		
		public function m_ListChanged(){
			Layout.refresh(this);
		}
		
		public function m_CurrentChanged(){
			//Layout.refresh(this);
		}
		
		
		//initialized means got strings + offsite key
		function m_InitializedChanged(){
			if(this.m.initialized)
				this.go_go_go();
		}
	
		function go_go_go(){
			Layout.m = this.m;
			FilterShortcuts.init();	
			this.set_list = new SetList(this.m);
			this.grid = new PhotoGrid(this.m);
			Globals.photo_grid = this.grid;
			this.topbar  = new TopBar(this.m);
			//this.topbar.rotationY = 40;
			//this.topbar.rotationX = 20;
			
			this.actionsbar  = new ActionBar(this.m);
			//this.upload_lnk = new UploadLink(this.m);
			this.content.addChild(this.grid);
			if(!Globals.VARS.story){
				this.grid.x = 200;
				this.content.addChild(this.set_list);
				this.content.addChild(this.topbar);
				this.content.addChild(this.actionsbar);
			}
			
			//this.addChild(this.debug);
			this.refresh();
		}
		
		private function onResize(e:Event){
			if(!stage)
				return;
			Layout.refresh(this);
		}
		
		public function refresh(){
			
			if(this.grid){
				this.grid.h = Globals.stage.stageHeight;
				this.topbar.w = this.grid.w = Globals.stage.stageWidth-200;
				if(Globals.VARS.story)
					this.grid.w+=200;
				this.topbar.x = this.grid.x;
				this.actionsbar.w = this.grid.w;
				this.actionsbar.x = this.grid.x;
				this.actionsbar.y = Globals.stage.stageHeight - this.actionsbar.height;
				this.set_list.h = Globals.stage.stageHeight;
				this.set_list.w = 200;
			}
			
		}
		
		
		private function setSizeMode(){
			if(this.w <= 200 || this.h < 175)
				Globals.size = "super_small"
			else if(this.w <= 400 || this.h < 400)
				Globals.size = "small";
			else if(this.w < 700 || this.h < 500)
				Globals.size = "medium";
			else
				Globals.size = "large";
		}
		
		
	}
}
