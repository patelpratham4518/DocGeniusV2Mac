import { LightningElement, api, track } from "lwc";
// import basePath from '@salesforce/community/basePath';
import { NavigationMixin } from 'lightning/navigation';
import { loadStyle, loadScript } from "lightning/platformResourceLoader";
import summerNote_Editor from "@salesforce/resourceUrl/summerNote_Editor";
import docGeniusLogoSvg from "@salesforce/resourceUrl/docGeniusLogoSvg";
import getTemplateData from '@salesforce/apex/TemplateBuilder_Controller.getTemplateData';
import saveTemplateApex from '@salesforce/apex/TemplateBuilder_Controller.saveTemplateApex';
import { initializeSummerNote } from './editorConf.js';
import {navigationComps, nameSpace, pageFormats, unitMultiplier} from 'c/globalProperties';

export default class TemplateBuilder extends NavigationMixin(LightningElement) {

    @api templateId;
    @api objectName;
    @api activeTabName;

    @track startchat = true; // chatbot variable
    @track isSpinner = false;
    @track isPreview = false;
    @track object_Label = '';
    isIntialRender = true;

    @track objectLabelAPI = {} 
    @track templateRecord = {}
    @track tempRecordBackup = {}

    @track vfPageSRC = ''
    successCount = 1;

    @track isMappingOpen = false;                   // #fieldMapping...
    @track isMappingContainerExpanded = false;      // #fieldMapping...

    contentEditor;
    headerEditor;
    footerEditor;
    templateData;
    valueInserted = false;
    dataLoaded = false;
    searchFieldValue = '';
    @track loaderLabel = null;

    @track pageConfigs = {
        pageMargins : [
            {name : 'top', value : 1},
            {name : 'bottom', value : 1},
            {name : 'left', value : 1},
            {name : 'right', value : 1},
        ],
        pageSize : [
            {name : 'A4', value : 'a4', size : '8.27" x 11.69"', selected : true},
            {name : 'A5', value : 'a5', size : '8.5" x 14"', selected : false},
            {name : 'Letter', value : 'letter', size : '8.5" x 11"', selected : false},
            {name : 'Legal', value : 'legal', size : '5.83" x 8.27"', selected : false},
            {name : 'Executive', value : 'executive', size : '7.25" x 10.5"', selected : false},
            {name : 'Statement', value : 'statement', size : '5.5" x 8.25"', selected : false},
        ],
        pageOrientation : [
            {name : 'Portrait', value : 'portrait', selected : true},
            {name : 'Landscape', value : 'landscape',  selected : false},
        ],
        unitOptions : [
            {name : 'inch', value : 'in', selected: true},
            {name : 'cm', value : 'cm' , selected: false},
            {name : 'px', value : 'px' , selected: false},
        ],
        unit : 'in',
    }

    @track pageConfigValues = {};
    currentPageWidth = 792;
    currentPageHeight = 1120;

    lastRelatedListTableCount = 0;
    maxRelatedLIstTableLimit = 10;

   get setdocGeniusLogoSvg(){
    return docGeniusLogoSvg;
   }
   
   get showTempDetail(){
        return Object.keys(this.templateRecord).length ? true : false;
   }

    connectedCallback(){
        try {
                
                this.isSpinner = true;
                if(!this.activeTabName){
                    // If Active Tab is Not set by default... 
                    this.activeTabName =  'contentTab';
                }
                this.getTemplateValues();
                window.addEventListener('resize', this.resizeFunction);

        } catch (error) {
            console.log('error in TemplateBuilder.connectedCallback : ', error.stack);
        }
    }

    renderedCallback(){
        try {
            if(this.isIntialRender){
                // this.isSpinner = true;
            // ------------------------------------- Editor  -------------------------------------------
            Promise.all([
                loadScript(this, summerNote_Editor + '/jquery-3.7.1.min.js'),
            ])
            .then(() => { 
                Promise.all([
                    loadStyle(this, summerNote_Editor + '/summernote-lite.css'),
                    loadScript(this, summerNote_Editor + '/summernote-lite.js'),
                ])
                .then(res => {
                    this.isIntialRender = false;
                    console.log('library loaded SuccessFully', {res});
                    this.initialize_Content_Editor();
                    this.initialize_Header_Editor();
                    this.initialize_Footer_Editor();

                    $(document).on("keyup", function(event){
                        // if user press clt + s on keybord
                        if (event.which == 83 && event.ctrlKey){
                        //    add your save method here
                        }
                      }
                    );
                })
                .catch(err => {
                    console.log('Error To Load summerNote_Editor >> ', {err}) 
                })
            })
            .catch(error => { 
                console.log('Error To Load Jquery >> ', {error}) ;
            })

            this.setActiveTab();
                
        }
        }
        catch(error){
            console.log('error in richTextEditor_custom.renderedCallback : ', error.stack);
        }
    }

    initialize_Content_Editor(){
        try {
            this.contentEditor = this.template.querySelector(`[data-name="templateContent"]`);
            var isLoadedSuccessfully = initializeSummerNote(this ,docGeniusLogoSvg, 'templateContent');

            if(isLoadedSuccessfully == true){
                this.resizeFunction();
                this.setDataInEditor();
            }
            else{
                this.showMessageToast('Error','Error' ,'There is Some issue to Load Editor Properly, Please reload current page or try after some time.', 6000)
            }

            this.isSpinner = this.successCount == 2 ? false : this.successCountPlus();

        } catch (error) {
            console.log('error in richTextEditor_custom.initialize_Content_Editor : ', error.stack);
        }
    }

    // initialize_Header_Editor(){
    //     try {
    //         this.headerEditor = this.template.querySelector(`[data-name="headerEditor"]`);
    //         var isLoadedSuccessfully = initializeSummerNote(this, docGeniusLogoSvg, 'headerEditor');

    //         if(isLoadedSuccessfully == false){
    //             this.showMessageToast('Error','Error' ,'There is Some issue to Load Editor Properly, Please reload current page or try after some time.', 6000)
    //         }
            
    //     } catch (error) {
    //         console.log('error in initialize_Header_Editor : ', error.stack);
    //     }
    // }

    // initialize_Footer_Editor(){
    //     try {
    //         this.footerEditor = this.template.querySelector(`[data-name="footerEditor"]`);
    //         var isLoadedSuccessfully = initializeSummerNote(this, docGeniusLogoSvg, 'footerEditor');

    //         if(isLoadedSuccessfully == false){
    //             this.showMessageToast('Error','Error' ,'There is Some issue to Load Editor Properly, Please reload current page or try after some time.', 6000)
    //         }
            
    //     } catch (error) {
    //         console.log('error in initialize_Footer_Editor : ', error.stack);
    //     }
    // }

    successCountPlus(){
        this.successCount ++;
        return true;
    }

    // Use Arrow Function...
    resizeFunction = () => {
        this.SetCSSbasedOnScreenChangeIn();
        this.setEditorArea();
    };

    SetCSSbasedOnScreenChangeIn(){
        try {

            var fieldMappingSection = this.template.querySelector('.fieldMappingContainer');
            
            if(this.activeTabName == 'contentTab' || this.activeTabName == 'headerFooterTab'){
    
                if(fieldMappingSection){
                    fieldMappingSection.classList.add('displayFieldMappings');
                }
            }
            else if(this.activeTabName == 'waterMarkTab'){
                // var waterMark_SubSection = this.template.querySelector('.waterMark_SubSection');
                // if(waterMark_SubSection){
                    
                // }

                if(fieldMappingSection){
                    fieldMappingSection.classList.remove('displayFieldMappings');
                }
            }
            else if(this.activeTabName == 'basicTab'){
                var updateDeatilContainer = this.template.querySelector('.updateDeatilContainer');

                if(updateDeatilContainer){
                    updateDeatilContainer.style = `height : calc(100% - 64px - 1.5rem); `
                }

                if(fieldMappingSection){
                    fieldMappingSection.classList.remove('displayFieldMappings');
                }

                this.setDummyPageSize();
            }

        } catch (error) {
            console.log(' error in SetCSSbasedonScreenChange : ', error.stack);
            
        }
    }

    getTemplateValues(){
        try {
            console.log('templateId : ', this.templateId);
            if(this.templateId && this.templateId != '' && this.templateId != null){
                getTemplateData({templateId : this.templateId})
                .then(result => {
                    console.log('getTemplateData result  : ', result);
                    if(result.isSuccess){
                        this.objectLabelAPI = result.objectLabelAPI;
                        this.object_Label = result.objectLabelAPI.label;
                        this.templateRecord = result.template;
                        this.templateRecord.createDateOnly = this.templateRecord.CreatedDate.split("T")[0];
                        this.tempRecordBackup = JSON.parse(JSON.stringify(this.templateRecord));
                        this.templateData = '';
                        this.pageConfigValues = result.pageConfigs;
                        this.pageConfigValBackup = JSON.parse(JSON.stringify(this.pageConfigValues));

                        if(result.template.Template_Data__r){
                            // Collect Value in Single variable...
                            result.template.Template_Data__r.forEach(ele => {
                                this.templateData += ele.Template_Value_Simple__c;
                            });

                            // Insert Value in Quill Editor...
                        }
                        
                        this.dataLoaded = true;
                        this.setPageConfigVariable();
                        this.setDataInEditor();

                        this.isSpinner = this.successCount == 2 ? false : this.successCountPlus();
                    }
                    else{
                        this.isSpinner = this.successCount == 2 ? false : this.successCountPlus();
                        this.showMessagePopup('Error', 'Error While Fetching Template Data', result.returnMessage);
                    }
                })
                .catch(error => {
                    this.isSpinner = this.successCount == 2 ? false : this.successCountPlus();
                    console.log('error in getTemplateData apex callout : ', error.message);
                })
            }
        } catch (error) {
            console.log('error in templateBuilder.getTemplateValues : ', error.stack);
            
        }
    }

    setDataInEditor(){
        try {
            if(this.contentEditor && this.dataLoaded && !this.valueInserted){
                $(this.contentEditor).summernote('code', this.templateData);

                this.setEditorPageSize();

                this.valueInserted = true;
            }
        } catch (error) {
            console.log('error in templateBuilder.setDataInEditor : ', error.stack);
        }
    }

    saveTemplateData(){
        if(this.lastRelatedListTableCount <= this.maxRelatedLIstTableLimit){
            this.saveTemplateValue('save');
        }
        else{
            this.showMessagePopup('error', 'Warning !', `Related List Table Limit Exceeded. You Can Not Add More Then ${this.maxRelatedLIstTableLimit} Related List Tables.`);
        }
    }

    saveTemplateValue(actionName){
        try {
            this.isSpinner = true;
            this.loaderLabel = actionName == 'close' ? 'Closing Builder...' : 'Saving Data...'
            var templateData = $(this.contentEditor).summernote('code')
                    
            // Separate Template Data By Long TExt area Length....
                var splitLength = 130000;
                var templateValuePortion = [];
                var valuePartion = Math.ceil(templateData.length / splitLength);
                for(var i = 1; i<= valuePartion; i++){
                    var startIndex = (i - 1)*splitLength ;
                    var endIndex = i ==  valuePartion ? templateData.length : (i * splitLength);
                    templateValuePortion.push(templateData.substring(startIndex, endIndex));
                }

                console.log('this.pageConfigValues before save : ', this.pageConfigValues);

                // Call Apex Method to save Template...
                saveTemplateApex({templateRecord : this.templateRecord, templateValues : templateValuePortion, pageConfigs : this.pageConfigValues})
                .then(result => {
                    console.log('result of saveTemplateApex : ', result);
                    if(result){
                        if(actionName == 'save'){
                            this.isSpinner = false;
                            this.loaderLabel = 'Data Saved Successfully...'
                            $(this.contentEditor).summernote('code', templateData);
                        }
                        else if(actionName == 'preview'){
                            this.isSpinner = false;
                            this.loaderLabel = 'Opening Preview...'
                            // To not confect with loader...
                            setTimeout(() =>{
                                this.isPreview = true;
                            }, 500)
                        }
                        this.tempRecordBackup = JSON.parse(JSON.stringify(this.templateRecord));
                        this.pageConfigValBackup = JSON.parse(JSON.stringify(this.pageConfigValues));
                    }
                })
                .catch(error => {
                    console.log('error in saveTemplateApex : ', error.stack);
                    this.isSpinner = false;
                })

        } catch (error) {
            console.log(`error in templateBuilder.saveTemplateData for action - ${actionName} : `, error.stack);
            this.isSpinner = false;
        }
    }
    
    closeEditTemplate(){
        try {
            $(this.contentEditor).summernote('destroy');
            this.navigateToComp(navigationComps.home);
        } catch (error) {
           console.log('error in templateBuilder.closeEditTemplate : ', error.stack)
        }
    }

    cancelEditTemplate(){
        this.templateRecord = JSON.parse(JSON.stringify(this.tempRecordBackup));
        this.pageConfigValues = JSON.parse(JSON.stringify(this.pageConfigValBackup));
        
        this.setPageConfigVariable();
        this.activeTabName = 'contentTab';
        this.setActiveTab();
        this.SetCSSbasedOnScreenChangeIn();
    }

    handleSaveNPreview(){
        if(this.lastRelatedListTableCount <= this.maxRelatedLIstTableLimit){
            this.saveTemplateValue('preview');
        }
        else{
            this.showMessagePopup('error', 'Warning !', `Related List Table Limit Exceeded. You Can Not Add More Then ${this.maxRelatedLIstTableLimit} Related List Tables.`);
        }
    }

    vfPageLoaded(){
        try {
            this.isSpinner = false;
            const iframe = this.template.querySelector('iframe');
            const pdfViewer = iframe.querySelector( 'pdf-viewer' );
            console.log('pdfViewer : ', pdfViewer);
        } catch (error) {
            console.log('log in templateBuilder.vfPageLoaded : ', error.stack);
        }
    }

    closeTemplatePreview(){
        try {
            this.isPreview = false;
        } catch (error) {
            console.log('error in templateBuilder.closeTemplatePreview : ', error.stack);
        }
    }

    // ==== Toggle Tab Methods - START - ========
    activeTab(event){
        try {
            if(event){
                this.activeTabName = event.currentTarget.dataset.name;
            }
            this.setActiveTab();
            this.SetCSSbasedOnScreenChangeIn();
        } catch (error) {
            console.log('error in templateBuilder.activeTab : ', error.stack)
        }
    }

    setActiveTab(){
        try {
            const activeTabBar = this.template.querySelector(`.activeTabBar`);
            const tabS = this.template.querySelectorAll('.tab');

            tabS.forEach(ele => {
                if(ele.dataset.name == this.activeTabName){
                    ele.classList.add('activeT');
                    activeTabBar.style = ` transform: translateX(${ele.offsetLeft}px);
                                    width : ${ele.clientWidth}px;`;
                }
                else{
                    ele.classList.remove('activeT');
                }
            })

            const sections = this.template.querySelectorAll('.tabArea');
            sections.forEach(ele => {
                if(ele.dataset.section == this.activeTabName){
                    ele.classList.remove('deactiveTabs');
                }
                else{
                    ele.classList.add('deactiveTabs');
                }
            })

        } catch (error) {
            console.log('error in  : ', error.stack);
        }
    }
    // ==== Toggle Tab Methods - END - ========

    // #fieldMapping...
    showHideMappingContainer(){
        try {
            this.isMappingOpen = !this.isMappingOpen;
            var fieldMappingContainer = this.template.querySelector('.fieldMappingContainer');
            if(fieldMappingContainer){
                if(this.isMappingOpen){
                    fieldMappingContainer.classList.add('openFieldMapping');
                }
                else{
                    fieldMappingContainer.classList.remove('openFieldMapping');
                }
            }
        } catch (error) {
            console.log('error in showHideMappingContainer : ', error.stack);
        }
    }

    // #fieldMapping...
    toggleMappingContainerHeight(){
        try {
            const fieldMappingContainer = this.template.querySelector('.fieldMappingContainer');
            if(this.isMappingContainerExpanded){
                this.isMappingContainerExpanded = false;
                fieldMappingContainer.style = ``;
            }
            else {
                this.isMappingContainerExpanded = true;
                fieldMappingContainer.style = ` height : calc(100% - 0.9rem);
                                                top : 0.1rem;`;
            }
        } catch (error) {
            console.log('error in toggleMappingContainerHeight : ', error.stack);
        }
    }

    handleMarginUnitChange(event){
        try {
            console.log('selected Unit : ', event.target.value);
        } catch (error) {
            console.log('error in handleMarginUnitChange');
        }
    }

    handleEditDetail(event){
        try {

            const targetInput = event.currentTarget.dataset.name;
            if(event.target.type != 'CHECKBOX'){
                this.templateRecord[targetInput] = event.target.value;
            }
            else{
                this.templateRecord[targetInput] = event.target.checked;
            }
        } catch (error) {
            console.log('error in handleEditDetail : ', error.stack);
        }
    }

    // Function -- run when change page config values from UI...
    // To set page config on in pageConfigs variable and pageConfigValues Object ...
    managePageConfigs(event){
        try {
            const pageConfig = event.currentTarget.dataset.config;
            const configName = event.currentTarget.dataset.name;
            const value = event.target.value;

            if(pageConfig == 'pageOrientation' || pageConfig == 'pageSize'){
                this.pageConfigs[pageConfig].forEach(ele => {
                    ele.selected = ele.name == configName ? true : false;
                })

                this.pageConfigValues.Page_Orientation__c = pageConfig == 'pageOrientation' ? value : this.pageConfigValues.Page_Orientation__c;
                this.pageConfigValues.Page_Size__c = pageConfig == 'pageSize' ? value : this.pageConfigValues.Page_Size__c;

            }
            else if(pageConfig == 'unitOptions'){
                this.pageConfigs[pageConfig].forEach(ele => {
                    ele.selected = ele.value == value ? true : false;
                });
                this.pageConfigs['unit'] = value;

                this.pageConfigValues.unit_of_page_configs__c = value;
            }
            else if(pageConfig == 'pageMargins'){
                this.pageConfigs[pageConfig].find(ele => ele.name == configName).value = value;

                this.setPageMarginValue(configName, value);
            }

            this.setEditorPageSize();
        } catch (error) {
            console.log('error in managePageConfigs : ', error.stack);
        }
    }

    // Function Set Page Margin value from pageConfig variable to pageConfigValues Object for the backend side work...
    setPageMarginValue(configName, value){
        try {
            var pageMarginsTop = this.pageConfigs['pageMargins'][0].value;
            var pageMarginsBottom = this.pageConfigs['pageMargins'][1].value;
            var pageMarginsLeft = this.pageConfigs['pageMargins'][2].value;
            var pageMarginsRight = this.pageConfigs['pageMargins'][3].value;

            var k = unitMultiplier(this.pageConfigValues.unit_of_page_configs__c)* 1.3334;

            if(configName == 'top'){
                pageMarginsTop = pageMarginsTop ? pageMarginsTop : 0;

                (pageMarginsTop < 0) && (pageMarginsTop = 0);

                // restrict margin/padding to exceed page page width....
                // when margin value is more than page width - opposite margin value... restrict to increase margin value...
                (pageMarginsTop >= (this.currentPageWidth / k - pageMarginsBottom)) && (pageMarginsTop = (this.currentPageWidth /k - pageMarginsBottom));

                // Only update variable when input have some value... because variable set 0 in input when input in empty, which is not practical...
                (value) && (this.pageConfigs['pageMargins'][0].value = pageMarginsTop);
            }
            else if(configName == 'bottom'){
                pageMarginsBottom = pageMarginsBottom ? pageMarginsBottom : 0;

                (pageMarginsBottom < 0) && (pageMarginsBottom = 0);

                (pageMarginsBottom >= (this.currentPageWidth / k - pageMarginsTop)) && (pageMarginsBottom = (this.currentPageWidth /k - pageMarginsTop));

                (value) && (this.pageConfigs['pageMargins'][1].value = pageMarginsBottom);
            }
            else if(configName == 'left'){
                pageMarginsLeft = pageMarginsLeft ? pageMarginsLeft : 0;

                (pageMarginsLeft < 0) && (pageMarginsLeft = 0);

                (pageMarginsLeft >= (this.currentPageWidth / k - pageMarginsRight)) && (pageMarginsLeft = (this.currentPageWidth /k - pageMarginsRight));
                
                (value) && (this.pageConfigs['pageMargins'][2].value = pageMarginsLeft);
            }
            else if(configName == 'right'){
                pageMarginsRight = pageMarginsRight ? pageMarginsRight : 0;

                (pageMarginsRight < 0) && (pageMarginsRight = 0);
                
                (pageMarginsRight >= (this.currentPageWidth / k - pageMarginsLeft)) && (pageMarginsRight = (this.currentPageWidth /k - pageMarginsLeft));
                
                (value) && (this.pageConfigs['pageMargins'][3].value = pageMarginsRight);
            }
    
            this.pageConfigValues.Page_Margin__c = pageMarginsTop+';'+pageMarginsBottom+';'+pageMarginsLeft+';'+pageMarginsRight;
        } catch (error) {
            console.log('error in setPageMarginValue : ', error.stack);
        }
    }

    //  Function to Set Page config values in pageConfig variable to display in UI/Front-End..
    setPageConfigVariable(){
        try {
            this.pageConfigs['pageMargins'][0].value = this.pageConfigValues.Page_Margin__c.split(';')[0];
            this.pageConfigs['pageMargins'][1].value = this.pageConfigValues.Page_Margin__c.split(';')[1];
            this.pageConfigs['pageMargins'][2].value = this.pageConfigValues.Page_Margin__c.split(';')[2];
            this.pageConfigs['pageMargins'][3].value = this.pageConfigValues.Page_Margin__c.split(';')[3];

            this.pageConfigs['pageOrientation'].forEach(ele => {
                ele['selected'] = ele.value == this.pageConfigValues.Page_Orientation__c ? true : false;
            });

            this.pageConfigs['pageSize'].forEach(ele => {
                ele['selected'] = ele.value == this.pageConfigValues.Page_Size__c ? true : false;
            });

            this.pageConfigs['unitOptions'].forEach(ele => {
                ele['selected'] = ele.value == this.pageConfigValues.unit_of_page_configs__c ? true : false;
            });

            this.pageConfigs['unit'] = this.pageConfigValues.unit_of_page_configs__c;

            if(this.contentEditor && this.dataLoaded){
                this.setEditorPageSize();
            }

        } catch (error) {
            console.log('error in setPageConfigVariable : ', error.stack);
        }
    }

    setEditorPageSize(){
        try {
            const contentEditorFrame = this.contentEditor.nextSibling;

            var pageMarginsTop = this.pageConfigValues.Page_Margin__c.split(';')[0];
            var pageMarginsBottom = this.pageConfigValues.Page_Margin__c.split(';')[1];
            var pageMarginsLeft = this.pageConfigValues.Page_Margin__c.split(';')[2];
            var pageMarginsRight = this.pageConfigValues.Page_Margin__c.split(';')[3];

            var unit = this.pageConfigValues.unit_of_page_configs__c;
            var pageSize = this.pageConfigValues.Page_Size__c;
            var orientation = this.pageConfigValues.Page_Orientation__c;

            this.currentPageWidth = (orientation == 'portrait' ? pageFormats[pageSize][0] : pageFormats[pageSize][1]) * 1.3334;
            this.currentPageHeight = (orientation == 'portrait' ? pageFormats[pageSize][1] : pageFormats[pageSize][0]) * 1.3334;

            contentEditorFrame.style.setProperty('--pageWidth', `${this.currentPageWidth}px`);
            contentEditorFrame.style.setProperty('--pageHeight', `${this.currentPageHeight}px`);
            contentEditorFrame.style.setProperty('--pageMarginTop', `${pageMarginsTop}${unit}`);
            contentEditorFrame.style.setProperty('--pageMarginBottom', `${pageMarginsBottom}${unit}`);
            contentEditorFrame.style.setProperty('--pageMarginLeft', `${pageMarginsLeft}${unit}`);
            contentEditorFrame.style.setProperty('--pageMarginRight', `${pageMarginsRight}${unit}`);

            this.setEditorArea();
            this.setDummyPageSize();

        } catch (error) {
            console.log('error in setEditorPageSize > ', error.stack);
        }
    }

    setEditorArea(){
        try {
            const contentEditorFrame = this.contentEditor.nextSibling;
            const editorArea = contentEditorFrame.querySelector('.note-editing-area');
            var fieldMappingContainer = this.template.querySelector('.fieldMappingContainer');

            if(window.innerWidth > 1350){
                // Here, Windows.innerWidth represent the width of contentEditorFrame/(.note-frame) width;
                const mapContainerWidth = (window.innerWidth >= 1400 ? (35 * 16) : (30 * 16)) + 32;
                if(window.innerWidth - this.currentPageWidth < mapContainerWidth){
                    //  If difference Screen width and editor page width is less than key Mapping container width... 
                    // key Mapping container can not set in that place... So Toggle the container
                    fieldMappingContainer.classList.add('floatingMapping');                 // #fieldMapping...
                    this.template.querySelector('c-key-mapping-container').toggleMappingContainer(true);
                    editorArea && (editorArea.style = `max-width : calc(100% - 2rem) !important; 
                                        margin-right: 0% !important;
                                        margin-inline: auto !important;`)
                }
                else{
                    // Show field Mapping Container
                    fieldMappingContainer.classList.remove('floatingMapping');               // #fieldMapping...
                    this.template.querySelector('c-key-mapping-container').toggleMappingContainer(false);
                    editorArea && (editorArea.style = '');
                }
            }
            else{
                // Hide field Mapping Container
                fieldMappingContainer.classList.add('floatingMapping');                      // #fieldMapping...
                // Show Button ( << Insert Field Button) to Open Field Mapping...
                this.template.querySelector('c-key-mapping-container').toggleMappingContainer(true);
                // Set Editor Page CSS....
                editorArea && (editorArea.style = `max-width : calc(100% - 2rem) !important; 
                                    margin-right: 0% !important;
                                    margin-inline: auto !important;`);
            }

        } catch (error) {
            console.log('error in setEditorArea : ', error.stack);
        }
    }

    setDummyPageSize(){
        var pageMarginsTop = this.pageConfigValues.Page_Margin__c.split(';')[0];
        var pageMarginsBottom = this.pageConfigValues.Page_Margin__c.split(';')[1];
        var pageMarginsLeft = this.pageConfigValues.Page_Margin__c.split(';')[2];
        var pageMarginsRight = this.pageConfigValues.Page_Margin__c.split(';')[3];

        var unit = this.pageConfigValues.unit_of_page_configs__c;
        var aspectRatio = this.currentPageWidth/this.currentPageHeight;

        const dummyPage = this.template.querySelector('.dummyPage');
        const dummyPageWidth = dummyPage.clientWidth;
        const m = dummyPageWidth/this.currentPageWidth;
        dummyPage.style = ` padding : ${pageMarginsTop*m}${unit} ${pageMarginsRight*m}${unit} ${pageMarginsBottom*m}${unit} ${pageMarginsLeft*m}${unit} !important;
                            aspect-ratio : ${aspectRatio}`;
    }

    openGenChildTablePopup(event){
        const childObjectTableBuilder = this.template.querySelector('c-child-object-table-builder');
        childObjectTableBuilder && childObjectTableBuilder.openPopup(event);
    }

    closeGenChildTable(){
        const childObjectTableBuilder = this.template.querySelector('c-child-object-table-builder');
        childObjectTableBuilder && childObjectTableBuilder.closePopup();
    }

    //  --- ---- ----- Related List (Child Table) calculation method --- ---- -----
    calculateRelatedListTable(note){
        try {
            const keyMappingChildComp = this.template.querySelector('c-key-mapping-container ');
            if(keyMappingChildComp){
              const page = note.noteEditorFrame.querySelector('.note-editable');
              var relatedListTables = page?.querySelectorAll(`[data-name="childRecords"]`);
    
              var validTableCount = 0;
              relatedListTables?.forEach(ele => {
                if(ele.querySelector('[data-name="keyRow"]') &&
                  ele.querySelector('[data-name="infoRow"]')){
                    validTableCount ++;
                  }
              })
    
              if(validTableCount >= this.maxRelatedLIstTableLimit){
                // When Limit Exceed
                keyMappingChildComp.relatedListTableLimitExceed(true);
              }
              else if(validTableCount != this.lastRelatedListTableCount){
                keyMappingChildComp.relatedListTableLimitExceed(false);
              }
              this.lastRelatedListTableCount = validTableCount;
              console.log('lastRelatedListTableCount : ', this.lastRelatedListTableCount);
            }
        } catch (error) {
          console.log('error in calculateRelatedListTable : ', error.stack);
        }
    }

    // ====== ======= ======== ======= ======= ====== GENERIC Method ====== ======= ======== ======= ======= ======
     // Generic Method to test Message Popup and Toast
        showMessagePopup(Status, Title, Message){
            const messageContainer = this.template.querySelector('c-message-popup')
            if(messageContainer){
                messageContainer.showMessagePopup({
                    status: Status,
                    title: Title,
                    message : Message,
                });
            }
        }

        showMessageToast(Status, Title, Message, Duration){
            const messageContainer = this.template.querySelector('c-message-popup')
            if(messageContainer){
                messageContainer.showMessageToast({
                    status: Status,
                    title: Title,
                    message : Message,
                    duration : Duration
                });
            }
        }

        navigateToComp(componentName, paramToPass){
            try {
                var cmpDef;
                if(paramToPass && Object.keys(paramToPass).length > 0){
                    cmpDef = {
                        componentDef: `${nameSpace}:${componentName}`,
                        attributes: paramToPass
                      };
                }
                else{
                    cmpDef = {
                        componentDef: `${nameSpace}:${componentName}`,
                      };
                }
                
                  let encodedDef = btoa(JSON.stringify(cmpDef));
                  console.log('encodedDef : ', encodedDef);
                  this[NavigationMixin.Navigate]({
                    type: "standard__webPage",
                    attributes: {
                      url:  "/one/one.app#" + encodedDef
                    }
                  });
            } catch (error) {
                console.log('error in navigateToComp : ', error.stack);
            }
        }
}