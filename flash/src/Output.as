/**
 * Output
 * 
 * Creates a pseudo output panel at the bottom of your swf
 * use Output.trace() to send messages to this output
 */
package {

	import flash.display.Shape;
	import flash.display.Sprite;
	import flash.display.Stage;
	import flash.display.GradientType;
	import flash.events.Event;
	import flash.events.MouseEvent;
	import flash.geom.Matrix;
	import flash.text.TextField;
	import flash.text.TextFieldType;
	import flash.text.TextFormat;
	import flash.text.TextFormatAlign;
	import flash.text.TextFieldAutoSize;
	
	public class Output extends Sprite {
		
		private var output_txt:TextField;			// text field containiner output text
		private var titleBar:Sprite;				// sprite for titleBar
		private var mainStage:Stage;				// reference to the main stage (for events)
		private static var instance:Output;		// singleton output instance reference
		private static var _enabled:Boolean = true;	// enabled - when false output messages do not appear
		private static var maxChars:int = 10000;	// maximum characters allowed in output, when reached oldest output text is deleted
		public static var autoExpand:Boolean = true;	// when true, output panel automatically opens when trace is used
		
		// public enabled
		public static function get enabled():Boolean{
			return _enabled;
		}
		public static function set enabled(b:Boolean):void{
			_enabled = b;
		}
		
		/**
		 * Constructor 
		 */
		public function Output(targetStage:Stage = null, outputHeight:uint = 600){
			// if instance already exists, remove it from the display
			// list and create a new one
			if (instance && instance.parent){
				instance.parent.removeChild(instance);
			}
			instance = this;
			
			// start hidden
			visible = false;
			
			// assign the passed stage to mainStage
			mainStage = (targetStage) ? targetStage : stage;
			
			// create and add output and titleBar
			addChild(newOutputField(outputHeight));
			addChild(newTitleBar());
			
			// listen for click and resize events for 
			// panel toggling and resizing
			this.titleBar.addEventListener(MouseEvent.CLICK, toggleCollapse);
			//this.titleBar.addEventListener(MouseEvent.MOUSE_DOWN, onMouseDown);
			this.titleBar.addEventListener(MouseEvent.MOUSE_UP, onMouseUp);
			mainStage.addEventListener(Event.RESIZE, fitToStage);
			
			// start off fit to stage and collapsed
			fitToStage();
			toggleCollapse();
		}
		
		/**
		 * trace
		 * sends arguments to the output text field for display
		 */
		public static function trace(...args):void {
			// if not enabled, exit
			if (!instance || !_enabled) return;
			
			// add text, keeping within maxChars
			instance.output_txt.appendText(args.toString() + "\n");
			if (instance.output_txt.text.length > maxChars){
				instance.output_txt.text = instance.output_txt.text.slice(-maxChars);
			}
			
			// scroll to bottom of text field
			instance.output_txt.scrollV = instance.output_txt.maxScrollV;
			
			// Make visible and expand if not already
			if (!instance.visible) instance.visible = true;
			if (autoExpand && !instance.output_txt.visible) toggleCollapse();
		}
		
		/*
		public function onMouseDown(event:MouseEvent){
			this.titleBar.startDrag();
		}
		*/
		
		public function onMouseUp(event:MouseEvent){
			this.titleBar.stopDrag();
		}
		
		/**
		 * clear
		 * clears output text field text
		 */
		public static function clear():void {
			if (!instance) return;
			instance.output_txt.text = "";
		}
		
		/**
		 * toggleCollapse
		 * either collapses or expands the output panel
		 * depending on its current state
		 */
		public static function toggleCollapse(evt:Event = null):void {
			if (!instance) return;
			instance.output_txt.visible = !instance.output_txt.visible;
			
			// fit to stage will handle visual expand or collapse
			instance.fitToStage();
		}
		
		/**
		 * newOutputField
		 * creates the text field used for traced output messages
		 */
		private function newOutputField(outputHeight:uint):TextField {
			output_txt = new TextField();
			output_txt.type = TextFieldType.INPUT;
			output_txt.border = true;
			output_txt.borderColor = 0;
			output_txt.background = true;
			output_txt.backgroundColor = 0xFFFFFF;
			output_txt.height = outputHeight;
			output_txt.multiline = true;
			output_txt.wordWrap = true;
			var format:TextFormat = output_txt.getTextFormat();
			format.font = "_typewriter";
			output_txt.setTextFormat(format);
			output_txt.defaultTextFormat = format;
			return output_txt;
		}
		
		/**
		 * newTitleBar
		 * creates the titleBar sprite
		 */
		private function newTitleBar():Sprite {
			// create a new shape for the gradient background
			var barGraphics:Shape = new Shape();
			barGraphics.name = "bar";
			var colors:Array = new Array(0xE0E0F0, 0xB0C0D0, 0xE0E0F0);
			var alphas:Array = new Array(1, 1, 1);
			var ratios:Array = new Array(0, 50, 255);
			var gradientMatrix:Matrix = new Matrix();
			gradientMatrix.createGradientBox(18, 18, Math.PI/2, 0, 0);
			barGraphics.graphics.lineStyle(0);
			barGraphics.graphics.beginGradientFill(GradientType.LINEAR, colors, alphas, ratios, gradientMatrix);
			barGraphics.graphics.drawRect(0, 0, 18, 18);
			
			// label for the panel title "Output"
			var barLabel:TextField = new TextField();
			barLabel.autoSize = TextFieldAutoSize.LEFT;
			barLabel.selectable = false;
			barLabel.text = "Output";
			var format:TextFormat = barLabel.getTextFormat();
			format.font = "_sans";
			barLabel.setTextFormat(format);
			
			// Sprite to contain both the gradient and the title
			titleBar = new Sprite();
			titleBar.addChild(barGraphics);
			titleBar.addChild(barLabel);
			return titleBar;
		}
		
		/**
		 * fitToStage - event handler
		 * when the stage resizes, stretch to fit horizontally
		 * and position at the bottom of the screen
		 */
		private function fitToStage(evt:Event = null):void {
			output_txt.width = mainStage.stageWidth;
			output_txt.y = mainStage.stageHeight - output_txt.height;
			
			// position titleBar at the top of the output text field
			// if its visible or, if not, at the bottom of the screen
			titleBar.y = (output_txt.visible) ? output_txt.y - titleBar.height : mainStage.stageHeight - titleBar.height;
			titleBar.getChildByName("bar").width = mainStage.stageWidth;
		}
	}
}
