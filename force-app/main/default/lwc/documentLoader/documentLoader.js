import { LightningElement, api, track, wire } from "lwc";
export default class DocumentLoader extends LightningElement {
		

	_fullSize;			// In case of need to set CSS "Position : fixed"...
    @api get fullSize(){ return this._fullSize}
    set fullSize(value){ this._fullSize = value}

    _noBackdrop;		// In Case You Don't want to show backdrop effect...
    @api get noBackdrop(){ return this._noBackdrop}
    set noBackdrop(value){ this._noBackdrop = value}

    _customScale;		// IF You want to set custom Size of a Loader...
    @api get customScale(){ return this._customScale}
    set customScale(value){ this._customScale = value}

    _fixTop;			// To Resolve the top position offset issue....
    @api get fixTop(){ return this._fixTop}
    set fixTop(value){ this._fixTop = value}

	scaleOutTime = 250;
	isInitial = true;

	// ** === Custom Label - START - =====
	// ... Getter Setter to set Label at loading initialization and loading completion time. User Can Set label as per the accordance ...
	defaultLabel = 'LOADING... \n Please wait a while';
	
	_label = this.defaultLabel;
	@api get label(){
		return this._label;
	}
	set label(value){
		this._label = value ? value : this.defaultLabel;
	}

	// ** === Loader Display (Show/Hide) Methods Label - START - =====
	isDisplay = false;
	@api
	get display(){
		return this.isDisplay;
	}
	set display(value){
		if(value == true){
			this.isDisplay = true;
		}
		else if(value == false){
			setTimeout(() => {
				this.template.querySelector('.documentPage').classList.add('zoomOutEffect');
				this.template.querySelector('.loader_mainDiv').classList.add('fadedTransitionEffect');
			}, 300)
			setTimeout(() => {
				this.isDisplay = false;

			}, this.scaleOutTime + 300);
		}
		else{
			this.isDisplay = false;
		}
	}
	// === Loader Display (Show/Hide) Methods Label - END - =====

	// ** === Custom Styling / CSS Method - START - =====
	get loadStyle(){
		var style = `--scaleOutTime : ${this.scaleOutTime}ms;`;
		style += this.fullSize == "true" ? `position : fixed !important;` : '';
		style += this.noneBackdrop == "true" ? `background : transparent !important; backdrop-filter : none !important;` : '';
		style += this.customScale ? `--documentScale : ${this.customScale};` : '';
		style += this.fixTop == 'true' ? '--docTop: 0rem;' : '';
		return style;
	}
	// === Custom Styling / CSS Method - END - =====

}