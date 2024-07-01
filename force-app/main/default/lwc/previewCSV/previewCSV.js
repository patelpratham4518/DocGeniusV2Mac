import { LightningElement, api, track } from 'lwc';
import docGeniusImgs from "@salesforce/resourceUrl/homePageImgs";
import fetchPreviewData from '@salesforce/apex/PreviewCSVController.fetchPreviewData';
import {navigationComps, nameSpace} from 'c/utilityProperties';
import { NavigationMixin } from 'lightning/navigation';

export default class previewCSV extends NavigationMixin(LightningElement) {

    //Passed parameters from component, which redirects user to this component
    @api templateId;
    @api objectName;
    @api isChild;
    @api showAdditionalInfo;


    // @track showModel= true;
    @track noResultsFound = false;


    //to show spinner
    @track showSpinner = false;

    // Preview Data
    @track previewData;
    @track fields;
    additionalFields = ['Name', 'Description', 'Object Api Name', 'CSV Creation Time'];
    additionalData = {
        'Name' : '',
        'Description' : '',
        'Object Api Name' :'',
        'CSV Creation Time': ''
    }

    connectedCallback(){
        this.getPreviewData();
    }

    getPreviewData(){
        this.showSpinner = true;
        fetchPreviewData({templateId: this.templateId})
        .then((result) =>{
            this.noResultsFound = true;
            console.log('Received preview data::', result);
            this.previewData = result.records;
            this.fields = result.fields?.split(',');
            this.additionalData['Name'] = result.templateName;
            this.additionalData['Object Api Name'] = result.templateObject;
            this.additionalData['Description'] = result.templateDescription || 'No Description Available for this template';
            this.additionalData['CSV Creation Time'] = new Date().toLocaleString().replace(',', ' ');
            if(this.fields.length > 0 && this.previewData.length > 0){
                this.setData();
                this.noResultsFound = false;
            }
            this.showSpinner = false;
        })
        .catch(e=>{
            console.log('error fetching preview data::', e.message);
            this.showSpinner = false;
        })
    }

    setData() {
        this.showSpinner = true;
        try{
            // Ensure data is received before processing
            if (!this.previewData || !this.fields) {
                return;
            }
        
            const tableBody = this.template.querySelector('tbody');
            tableBody.innerHTML = '';

            // Display additional fields if checkbox is ticked
            if(this.showAdditionalInfo){
                console.log('in the additional fields');
                this.additionalFields.forEach(field => {
                    const tableRow = document.createElement('tr');
                    tableRow.style.cssText = `
                        border : 1px solid darkgray;
                        text-align : center;
                    `;
                    const emptyTableCell = document.createElement('td');
                    emptyTableCell.style.cssText = `
                            border : 1px solid darkgray;
                            text-align : center;
                            padding: 0.1rem 0.5rem;
                    `;
                    tableRow.appendChild(emptyTableCell);
                    const fieldNameCell = document.createElement('th');
                    fieldNameCell.style.cssText = `
                            border : 1px solid darkgray;
                            text-align : center;
                            padding: 0.1rem 0.5rem;
                            background-color: #d5ebff;
                    `;
                    fieldNameCell.textContent = field+' :';
                    tableRow.appendChild(fieldNameCell);
                    const fieldDataCell = document.createElement('td');
                    fieldDataCell.style.cssText = `
                            border : 1px solid darkgray;
                            text-align : center;
                            padding: 0.1rem 0.5rem;
                            text-wrap: nowrap;
                    `;
                    fieldDataCell.textContent = this.additionalData[field] || ''; // Display empty string for missing values
                    tableRow.appendChild(fieldDataCell);
                    tableBody.appendChild(tableRow);
                });
                const emptyTableRow = document.createElement('tr');
                emptyTableRow.style.cssText = `
                    border : 1px solid darkgray;
                    text-align : center;
                    height : 1.3rem;
                `;
                tableBody.appendChild(emptyTableRow);
            }
            
        
            // Update header row (optional)
            // const tableHead = this.template.querySelector('tbody tr');
            const tableHead = document.createElement('tr');
            tableHead.style.cssText = `
                background-color: #d5ebff;
                height: 1.5rem;
            `;
            if (tableHead) {
                tableHead.innerHTML = '';
                this.fields.forEach(field => {
                const tableHeaderCell = document.createElement('th');
                tableHeaderCell.style.cssText = `
                        border : 1px solid darkgray;
                        text-align : center;
                        background-color: #d5ebff;
                        padding: 0.3rem 0.5rem;
                `;
                tableHeaderCell.textContent = field; // Set header text based on field names
                tableHead.appendChild(tableHeaderCell);
                });
                tableBody.appendChild(tableHead);
            }
            this.previewData.forEach(record => {
                const tableRow = document.createElement('tr');
                tableRow.style.cssText = `
                    border : 1px solid darkgray;
                    text-align : center;
                `;
        
                // Display only fields specified in 'fields'
                this.fields.forEach(field => {
                const tableCell = document.createElement('td');
                tableCell.style.cssText = `
                        border : 1px solid darkgray;
                        text-align : center;
                        padding: 0.1rem 0.5rem;
                `;
                tableCell.textContent = this.getValueByKey(record, field) || ''; // Display empty string for missing values
                tableRow.appendChild(tableCell);
                });
        
                tableBody.appendChild(tableRow);
            });
        
        }catch(e){
            console.log('Error in setData :', e.message);
        }finally{
            this.showSpinner = false;
        }
    }

    getValueByKey(obj, key) {
        return key.split('.').reduce((o, i) => (o ? o[i] : undefined), obj);
    }

    // Get Back to the Document Generator
    handleBackClick(){
        try{
            this.dispatchEvent(new CustomEvent('close',{
                detail : true
            }));
        }catch(e){
            console.log('Error in handleBackClick ,' , e.message);
        }
    }

    //Navigate to CSV template builder
    handleEditClick() {
        try{
            this.showSpinner = true;
            var paramToPass = {
                templateId : this.templateId,
                objectName : this.objectName,
            }
            this.navigateToComp(navigationComps.csvTemplateBuilder, paramToPass);
        }catch(e){
            console.log('Error in Edit Navigation ', e.stack);
        }finally{
            this.showSpinner = false;
        }
    }

    // //Navigate to CSV Generator
    // handleGenerateClick(){
    //     try{
    //         this.showSpinner = true;
    //         if(this.isChild){
    //             this.dispatchEvent(new CustomEvent('generate',{
    //                 detail : true
    //             }));
    //             return;
    //         }
    //         console.log('Template id:: ', this.templateId);
    //         console.log('Name : ' , this.templateName+' - CSV');
    //         console.log('Show Template Details : ', true);
    //         var paramToPass = {
    //             templateId : this.templateId,
    //             showTemplateDetails : true,
    //             csvFileName : this.templateName+' - CSV'
    //         }
    //         this.navigateToComp(navigationComps.generateCSV, paramToPass);
    //     }catch(e){
    //         console.log('Error in Generate Navigation ', e.stack);
    //     }finally{
    //         this.showSpinner = false;
    //     }
    // }

    // -=-=- Used to navigate to the other Components -=-=-
    navigateToComp(componentName, paramToPass){
        try {
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
            // console.log('encodedDef : ', encodedDef);
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