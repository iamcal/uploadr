package {
	
	dynamic public class LS extends S{
		
		private var linkage:String;
		
		function LS(linkage:String){
			super();
			this.lmc = new Library[linkage]();
			this.addChild(this.lmc);
		}
	}
}