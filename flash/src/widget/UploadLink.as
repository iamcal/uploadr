package widget{
	import flash.net.FileReferenceList;
	import flash.text.*;
	import flash.events.*;
	import flash.external.ExternalInterface;
	
	dynamic public class UploadLink extends AbstractView{
		private var fileRefList:FileReferenceList;
		
		
		public function UploadLink(mod:Model){
			super(mod);
			this.link = new Link("browse", this.onClick, this, true, 16);
		}
		
		private function onSelect(e:Event) {
			trace("onSelect");
			//var list:Array = this.fileRefList.fileList;
			this.m.addToQueue(fileRefList.fileList);
		}

		private function onCancel(e:Event):void{
			trace("onCancel");
		}


		
		private function onClick(e:Event){
			ExternalInterface.call("photos.add_dialog()");
			
			/*
			this.fileRefList = new FileReferenceList();
			this.fileRefList.addEventListener(Event.SELECT, this.onSelect);
			this.fileRefList.addEventListener(Event.CANCEL, this.onCancel);
			this.fileRefList.browse();
			*/
		}
	}
}
