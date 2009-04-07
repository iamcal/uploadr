package  data{
	import flash.display.MovieClip;
	import flash.display.StageScaleMode;
	import flash.display.StageAlign;
	import flash.utils.Timer;
	import flash.display.Stage;
	import flash.events.*;
	import flash.external.ExternalInterface;
	
	public class Show extends MovieClip {
		public var vars:Object;
		private var pages_requestedO:Array = [];
		private var pages:int;
		private var started:Boolean = false;
		private var api_extras:String = 'o_dims,rotation,original_format,media'

		public function Show():void {
			super();
		
			stage.align = StageAlign.TOP_LEFT;
			stage.scaleMode = StageScaleMode.NO_SCALE;
			
			console('spit out ye old flash vars *******************************************');
			// What was passed in as Flash vars?
			var vars:Object = root.loaderInfo.parameters;
			for (var keyStr:String in vars) {
				console(keyStr + ":" + String(vars[keyStr]));
			}

			var page:int = 1;
			var jump_to:int = (vars.jump_to) ? vars.jump_to : 0;
			
			this.getPageOfPhotos(page, jump_to);
		}
		
		private function callAPI(method:String, params:Object, track:Boolean = false):void {
			console('callAPI *******************************************');
			console('track loading:'+track);
			console('method:'+method);
			for (var keyStr:String in params) {
				console(keyStr + ':' + String(params[keyStr]));
			}
		}
		
		private function getParamsSpecial():Object {
			// this is for special cases; Need to port it from shared.as
			return {};
		}
		
		
		
		
		
	}
}

