import { LightningElement, track, wire ,api} from 'lwc';
import getAllDocs from '@salesforce/apex/GoogleDocTemplateEditorController.getAllDocs'
import getTemplate from '@salesforce/apex/GoogleDocTemplateEditorController.getTemplate'
import getUsernameAndEmail from '@salesforce/apex/GoogleDocTemplateEditorController.getUsernameAndEmail'
import saveTemplateData from '@salesforce/apex/GoogleDocTemplateEditorController.saveTemplateData'
import saveHTML from '@salesforce/apex/GoogleDocTemplateEditorController.saveHTML'
import getTemplateName from '@salesforce/apex/GoogleDocTemplateEditorController.getTemplateName'
import getLabel from '@salesforce/apex/GoogleDocTemplateEditorController.getLabel'
import editTemplate from '@salesforce/apex/GoogleDocTemplateEditorController.editTemplate'
import new_template_bg from '@salesforce/resourceUrl/new_template_bg';
import leftBackground from '@salesforce/resourceUrl/leftBackground';
import { NavigationMixin } from 'lightning/navigation';


export default class GoogleDocTemplateEditor extends NavigationMixin(LightningElement) {

    
    
    @api templateId 
    @api objectName
    
    
    @track templateRecord = {}
    
    objectlabel

    isSpinner = true
    loaderLabel = null
    selectedTemplate
    showPopup = false
    webViewLink
    @track templates
    @track allTemplates
    @track serachString = ""
    @track profile
    templateBg = new_template_bg
    templateBgMain = leftBackground

    initialRender = true;
    isPreview = false
    
    connectedCallback(){
        try {

           // Added for keyMappingContainer...
           console.log('resize : ',);
          window.addEventListener('resize', this.resizeFunction);
            
            
            getLabel({objectName:this.objectName}).then(response=>{
                this.objectlabel = response
            }).catch(error=>{
                console.log("Error in get label=>",error);
            })

            this.getProfile()
            getTemplateName({templateId :this.templateId}).then(response=>{
                this.templateRecord = response
                
            })

            getTemplate({templateId :this.templateId}).then(response => {
                if (response) {
                    response = JSON.parse(response)
                    this.webViewLink = response.Google_Doc_WebViewLink__c
                    this.Google_Doc_Template_Id__c = response.Google_Doc_Template_Id__c
                    // this.isSpinner = false
                    this.isSpinner = true
                } else {
                    this.showPopup = true
                    getAllDocs()
                    .then((response)=>{
                        
                        this.allTemplates =  JSON.parse(response)
                        this.setDateAndSize()
                        if (this.allTemplates.length>0) {
                            this.templates = this.allTemplates
                        }
                        this.isSpinner = false
                    }).catch(error => {
                        console.log('Error ==> ',error);
                    })
                }
            }).catch(error => {
                console.log('Error ==> ',error.stack);
            })
           
          
        } catch (error) {
            console.log('Error connrectdCallBack==> ',error.stack)
        }

    }

    renderedCallback() {
        try {
            this.template.host.style.setProperty('--background-image-url',`url(${this.templateBg})`);
            this.template.host.style.setProperty('--main-background-image-url',`url(${this.templateBgMain})`);
            this.setActiveTab()
            if(this.initialRender && this.template.querySelector('.fieldMappingContainer')){
                this.resizeFunction();
                this.initialRender = false;
            }

        } catch (error) {
            console.error(error)
        }
    }

    resizeFunction = () => {
        // Added for keyMappingContainer...
        console.log('OUTPUT : resizeFunction', );
        var fieldMappingContainer = this.template.querySelector('.fieldMappingContainer');
        if(window.innerWidth > 1350){
            fieldMappingContainer.classList.remove('floatingMapping');
            this.template.querySelector('c-key-mapping-container').toggleMappingContainer(false);
        }
        else{
            fieldMappingContainer.classList.add('floatingMapping');
            this.template.querySelector('c-key-mapping-container').toggleMappingContainer(true);
        }
    }

    closePopup(){
        this.showPopup = false
    }

    openPopup(){
        this.showPopup = true
    }
    handleTemplateClick(event) {
        try {
            let selected = this.template.querySelector('.selected')
            if (selected) {
                selected.classList.remove("selected")
                selected.classList.add("hover-effect") 
            }
            const templateId = event.currentTarget.dataset.id;
            this.selectedTemplate = this.templates.find(template => template.id === templateId);
            let template = event.currentTarget 
            template.classList.add("selected")
            template.classList.remove("hover-effect") 

           if (!selected) {
                const next = this.template.querySelector('.next')
                next.removeAttribute('disabled')
           }
            
        } catch (error) {
            console.error(error);
        }

    }

    refreshDocs(){

        try {
            this.isSpinner = true
            this.getProfile()
            getAllDocs()
            .then((response)=>{
                 this.allTemplates =  JSON.parse(response)
                 this.setDateAndSize()
                 if (this.allTemplates.length>0) {
                     this.templates = this.allTemplates
                 }
                 else{
                    this.templates = undefined
                 }
    
                 this.serachString = null
                this.isSpinner = false
            }).catch(error => {
                console.log('Error ==> ',error);
            })
        } catch (error) {
            console.error(error);
        }

    }

    next(){
        try {

                this.webViewLink = this.selectedTemplate.webViewLink
                this.Google_Doc_Template_Id__c = this.selectedTemplate.id
                this.closePopup()
                this.isSpinner = true
                this.save()
        
        } catch (error) {
            console.error(error);
        }

    }

    cancel(){
        this.closePopup()
        this.navigateToComp("homePage",{})
    }

    setDateAndSize(){
        try {
            this.allTemplates = this.allTemplates.map(template => {
                template.createdTime = template.createdTime.split("T")[0]
                if (template.size < 1024) {
                    template.size = Math.round(template.size)+"Byte"
                } else if (template.size < 1024*1024) {
                    template.size = Math.round(template.size/1024)+"KB"
                }else{
                    template.size = Math.round(template.size/(1024*1024))+"MB"
                }
                return template
            })
        } catch (error) {
            console.error(error);
        }

    }

    handleSearch(event){
        try {
            if (this.templates) {
                this.serachString = event.target.value
                if (this.serachString) {
                    this.templates = this.allTemplates.filter(template => {
                        return template.name.toLowerCase().includes(this.serachString.toLowerCase())
                        
                    })
                } else {
                    this.templates = this.allTemplates
                }
            }
        } catch (error) {
            console.error(error);
        }
    
    }

    getProfile(){
        try {
            getUsernameAndEmail().then(response =>{
                this.profile = JSON.parse(response)
            }).catch(error => {
                console.log("Error ==> "+error);
            })
        } catch (error) {
            console.error(error);
        } 
    }

    save(){
        saveTemplateData({
            "templateId" : this.templateId,
            "googleDocId" : this.selectedTemplate.id,
            "webViewLink" : this.selectedTemplate.webViewLink
        }).then(response=>{
            if (response == "success") {    
                console.log("Template Data Saved");
            }
        }).catch(error=>{
            console.log("Error saving template data ==> ",error);
        })
    }

    // -=-=- Used to navigate to the other Components -=-=-
    navigateToComp(componentName, paramToPass){
        
        try {
            var nameSpace = 'c';
            var cmpDef;
            if(paramToPass && Object.keys(paramToPass).length > 0){
                cmpDef = {
                    componentDef: `${nameSpace}:${componentName}`,
                    attributes: paramToPass,
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


    saveIframe(preview=false){
        this.isSpinner = true
        this.loaderLabel = "Saving Data..."
        saveHTML({"templateId" : this.templateId}).then(response=>{
            this.isSpinner = false
            console.log("HTML saved response =>",response);
            if (response == "success") {
                const popup = this.template.querySelector('c-message-popup')
                popup.showMessageToast({
                    'title' : 'Template Data Saved',
                    'message' : 'Template data saved to backend succesfully.',
                    'status' : 'success'
                }) 
                if (preview){
                    this.isPreview = true
                }
            } else if(response == "fail"){
                const popup = this.template.querySelector('c-message-popup')
                popup.showMessageToast({
                    'title' : 'Template Saving Failed',
                    'message' : 'There occured some error in saving template.',
                    'status' : 'error'
                }) 
            }
            

        }).catch(error=>{
            console.log("Error in save Iframe==> ",error);
        })
    }
    saveTemplateDataIframe(){
        this.saveIframe()
    }
    handleSaveNPreviewIframe(){
        
            // this.saveIframe(true)
            this.isPreview = true
        
    }
    handleSaveNCloseIframe(){
        this.navigateToComp("homePage",{})
        this.saveIframe()
    }

    @track isMappingOpen = false;
    @track isMappingContainerExpanded = false;
    showHideMappingContainer(){
        try {
            this.isMappingOpen = !this.isMappingOpen;
            var fieldMappingContainer = this.template.querySelector('[data-name="fieldMappingContainer"]');
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


        // ==== Toggle Tab Methods - START - ========
        activeTabName = "contentTab";
        // contentTab = true
        // basicTab = false
        activeTab(event){
            try {
                
                
                if(event){
                    this.activeTabName = event.currentTarget.dataset.name;
                }
                this.setActiveTab();
              
            } catch (error) {
                console.log('error in templateBuilder.activeTab : ', error.stack)
            }
        }
    
        setActiveTab(){
            try {
                //logic of changing tabs
                let basicTab = this.template.querySelector(`.basicTab`).style
                let mainStyle = this.template.querySelector(`.main`).style
                if (this.activeTabName == "contentTab") {
                   
                    mainStyle.display = "flex"
                    basicTab.display = "none"
                } else if(this.activeTabName == "basicTab"){
                  
                    basicTab.display = "block"
                    mainStyle.display = "none"
                }
                //end of change tabs
                console.log('activeTabName : ', this.activeTabName);
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
        // ==== Active Tab Methods - END - ========

        

        iframeLoaded(){
            console.log("Iframe loaded");
            this.isSpinner = false
        }

        closeTemplatePreview(){
            this.isPreview = false
        }

        get showTempDetail(){
            return Object.keys(this.templateRecord).length ? true : false;
       }
       handleEditDetail(event){
            try {
                const targetInput = event.currentTarget.dataset.name;
                if (targetInput == "Template_Name__c") {
                    
                    const next = this.template.querySelector('.next')
                    if (!event.target.value) {
                        event.currentTarget.classList.add("error-border")
                        next.setAttribute('disabled',true)
                    }
                    else{
                        event.currentTarget.classList.remove("error-border")
                        next.removeAttribute('disabled')   
                    }
                }

                if(event.target.type != 'checkbox'){
                    this.templateRecord[targetInput] = event.target.value;
                }
                else{
                    console.log("Status=>"+event.target.checked);
                    this.templateRecord[targetInput] = event.target.checked;
                }
            } catch (error) {
                console.log('error in handleEditDetail : ', error.stack);
            }
        }

        editTemplateDetails(){
            this.isSpinner = true
            this.loaderLabel = "Saving Your Data"
            editTemplate({"templateRecord" : JSON.stringify(this.templateRecord)}).then(response=>{
                console.log("Details Edited");
                this.isSpinner = false
                const popup = this.template.querySelector('c-message-popup')
                popup.showMessageToast({
                    'title' : 'Template Data Saved',
                    'message' : 'Template data saved to backend succesfully.',
                    'status' : 'success'
                }) 

            }).catch(error=>{
                console.log("Error in editTemplateDetails==> ",error);
            })
        }

        cancelEditTemplate(){
            this.template.querySelector('.next').removeAttribute('disabled')
            this.template.querySelector(`lightning-input[data-name="Template_Name__c"]`).classList.remove('error-border')
            getTemplateName({templateId :this.templateId}).then(response=>{
                this.templateRecord = response
            })
            this.activeTabName = "contentTab"
            this.setActiveTab()

        }

       
    
}