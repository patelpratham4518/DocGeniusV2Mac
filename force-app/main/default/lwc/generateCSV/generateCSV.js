import { LightningElement, track , api} from 'lwc';
import getAllTemplates from '@salesforce/apex/GenerateCSVController.getAllTemplates';
import getSingleTemplateData from '@salesforce/apex/GenerateCSVController.getSingleTemplateData';
import getTemplateData from '@salesforce/apex/GenerateCSVController.getTemplateData';
import docGeniusImgs from "@salesforce/resourceUrl/homePageImgs";
export default class GenerateCSV extends LightningElement {


    @api isChild;
    @api templateId;
    @api showTemplateDetails;
    showTemplateDetails = false;
    @api csvFileName;

    @track showSpinner = true;
    @track allTemplates;
    fetchedResults = [];
    initialRender = true;

    @track allExtensions = [".csv" , ".xls"];
    @api selectedExtension = ".csv";

// -=-=- Used to fetch all the templates from the org Where template type is CSV -=-=-
    connectedCallback(){
        try{
            if(!this.isChild){
                getAllTemplates()
                .then((data) => {
                    this.allTemplates = data.map((template) => ({
                        value: template.Id,
                        label: template.Template_Name__c,
                        descr : template.Description__c,
                        objName : template.Object_API_Name__c,
                    }));
                    this.csvFileName = this.allTemplates.find(template => template.value == this.templateId).label;
                    this.showSpinner = false;
                })
                .catch((err) => {
                    this.showSpinner = false;
                    console.error('Error fetching all the templates...', err.message);
                    this.showToast('error', 'Oops! Update Template!', 'We couldn\'t fetch the templates for you!', 5000);
                });
            }
            this.showSpinner = false;
        }catch(e){
            this.showSpinner = false;
            console.log('Error in connectedCallback ::' , e.message);
        }
    }



// -=-=- Used to override the styles of the standard salesforce Input fields and combo boxes (Only Once)-=-=-
    renderedCallback(){
        if(!this.isChild){
            try{
                if(this.initialRender){
                    // To OverRider standard slds css properties...
                    var mainFilterDiv = this.template.querySelector('.main-csv-generator-div');
                    var styleEle = document.createElement('style');
                    styleEle.innerText = `
                                .main-csv-generator-div .slds-input{
                                    height: 3rem;
                                    border-radius: 0.5rem;
                                }
                                .main-csv-generator-div .slds-input:focus
                                {
                                    border-color: #00aeff;
                                    box-shadow: none;
                                }
                                .main-csv-generator-div  .slds-form-element__label{
                                    font-size: 13px;
                                    color: #00AEFF;
                                    padding: 0px 5px;
                                    border-radius: 50%;
                                    position: absolute;
                                    z-index: 1;
                                    background-color: white;
                                    top: -10px;
                                    left: 15px;
                                }
        
                                .main-csv-generator-div  .slds-checkbox .slds-checkbox__label .slds-form-element__label {
                                    position : static !important;
                                }
                    `;
                    if(mainFilterDiv){
                        mainFilterDiv.insertBefore(styleEle, mainFilterDiv.firstElementChild);
                        this.initialRender = false;
                    }
        
                }
            }catch(e){
                console.log('Error in renderedCallback' , e.message);
            }
        }
    }

// -=-=- Used to handle the change of selected template -=-=-
    handleTemplateIdChange(event){
        this.templateId = event.detail[0];
        console.log('This Template Id:: ' + this.templateId);
        if(this.templateId){
            this.template.querySelector('.select-template-div').classList.remove("error-combo-box");
        }else{
            this.template.querySelector('.select-template-div').classList.add("error-combo-box");
        }
    }

// -=-=- Used to handle the change in checkbox for the additional details in the CSV -=-=-
    handleTemplateDetailsToggle(event){
        this.showTemplateDetails = event.target.checked;
        // console.log('Show Template Details:: ' + this.showTemplateDetails);
    }

// -=-=- Used to handle the file name change -=-=-
    handleFileNameChange(event){
        this.csvFileName = event.target.value;
        // console.log('CSV File Name:: ' + this.csvFileName);
    }

    handleExtensionChange(event){
        console.log('ext::' , event.target.value);
        this.selectedExtension = event.target.value;
        console.log('Selected Extension:: ' + this.selectedExtension);
    }


// -=-=- Used to fetch all the data related to a particular template like query, sessionId and selected fields  -=-=-
    @api
    async handleGenerateCSV() {
        console.log('In HandleGenerateCSV');
        if(this.isChild){
            this.showSpinner = true;
            getSingleTemplateData({templateId: this.templateId})
            .then((data) => {
                this.allTemplates = data.map((template) => ({
                    value: template.Id,
                    label: template.Template_Name__c,
                    descr : template.Description__c,
                    objName : template.Object_API_Name__c,
                }));
                this.showSpinner = false;
            })
            .catch((err) => {
                this.showSpinner = false;
                console.error('Error fetching all the templates...', err.message);
                this.showToast('error', 'Oops! Update Template!', 'We couldn\'t fetch the templates for you!', 5000);
            });
        }
        this.showSpinner = true;
        if (!this.templateId) {
            this.showSpinner = false;
            this.template.querySelector('.select-template-div').classList.add("error-combo-box");
            this.showToast('error', 'Oops!, Missed to select Template!', 'Please select a template to generate CSV from.', 5000);
            return;
        }
        try {
            const data = await getTemplateData({ templateId: this.templateId });
            if(!data){
                this.showToast('error', 'Oops! Missed to Update Template? ', 'Please Update the Template fields and filters..', 5000);
                return ;
            }
            const [fieldNamesString, query, sessionId] = data.split(' <|QDG|> ');
            const fieldNames = fieldNamesString.split(',');
            // const totalRecordCount = parseInt(sessionId);
            const generationCount = parseInt(query.split('LIMIT ')[1]);
            if(this.selectedExtension == ".csv"){
                let csvContent = '';
    
                if (this.showTemplateDetails) {
                    const thisTemplate = this.allTemplates.find(opt => opt.value == this.templateId);
                    thisTemplate.descr = thisTemplate.descr ? thisTemplate.descr : 'No Description Available for this template';
                    csvContent += ' , Name : ,"' + thisTemplate.label + '"\n'
                        + ' , Description : ,"' + thisTemplate.descr + '"\n'
                        + ' , Object Api Name : ,' + thisTemplate.objName + '\n'
                        + ' , CSV Creation Time : , ' + new Date().toLocaleString().replace(',', ' ') + '\n' + '\n';
                }
                csvContent += fieldNames.join(',') + '\n';
    
                // this.downloadCSV(xlsContent);
                // return;
                console.log('Content of CSV :: ' , csvContent);
                const newQuery = '/services/data/v59.0/query/?q=' + query.split('LIMIT')[0];
                console.log('Query :: ' , newQuery);
    
                const isSuccess = await this.fetchRecords(newQuery ,sessionId, generationCount);
                console.log('Fetched records in main :: ' + this.fetchedResults.length);
                if(isSuccess){
                    if(this.fetchedResults.length == 0){
                        this.showToast('warning', 'Oops! No matching records Found!', 'Uh Oh!, Try changing the Filter criteria!!');
                    }else{
                        for (const record of this.fetchedResults) {
                            // const rowValues = fieldNames.map(fieldName => record[fieldName] ? `"${record[fieldName]}"` : '""');
                            const rowValues = fieldNames.map(fieldName => {
                                const value = this.getValueByKey(record, fieldName);
                                return value ? `"${value}"` : '""';
                            });
                            
                            csvContent += rowValues.join(',') + '\n';
                        }
                        this.downloadCSV(csvContent);
                        // this.downloadCSV(csvContent);
                        this.showSpinner = false;
                    }
                }
            }else if(this.selectedExtension == '.xls'){
                let xlsContent = '<table>';
                xlsContent += '<style>';
                xlsContent += 'table, th, td {';
                xlsContent += '    border: 0.5px solid black;';
                xlsContent += '    border-collapse: collapse;';
                xlsContent += '}';          
                xlsContent += '</style>';
    
                if (this.showTemplateDetails) {
                    const thisTemplate = this.allTemplates.find(opt => opt.value == this.templateId);
                    thisTemplate.descr = thisTemplate.descr ? thisTemplate.descr : 'No Description Available for this template';
                    xlsContent += '<tr> <td> </td> <th> Name : </th><td> ' + thisTemplate.label + '</td></tr>'
                        + '<tr> <td> </td> <th> Description : </th><td> ' + thisTemplate.descr + '</td></tr>'
                        + '<tr> <td></td> <th> Object Api Name : </th><td> ' + thisTemplate.objName + '</td></tr>'
                        + '<tr> <td> </td> <th> CSV Creation Time : </th><td> ' + new Date().toLocaleString().replace(',', ' ') + '</td></tr>' + '<tr></tr>';
                }
                xlsContent += '<tr> <th> ' + fieldNames.join('</th><th>') + '</th> </tr>'
    
                // this.downloadCSV(xlsContent);
                // return;
                const newQuery = '/services/data/v59.0/query/?q=' + query.split('LIMIT')[0];
                console.log('Query :: ' , newQuery);
    
                const isSuccess = await this.fetchRecords(newQuery ,sessionId, generationCount);
                console.log('Fetched records in main :: ' + this.fetchedResults.length);
                if(isSuccess){
                    if(this.fetchedResults.length == 0){
                        this.showToast('warning', 'Oops! No matching records Found!', 'Uh Oh!, Try changing the Filter criteria!!');
                    }else{
                        for (const record of this.fetchedResults) {
                            // const rowValues = fieldNames.map(fieldName => record[fieldName] ? `"${record[fieldName]}"` : '""');
                            const rowValues = fieldNames.map(fieldName => {
                                const value = this.getValueByKey(record, fieldName);
                                return value ? `${value}` : '';
                            });
                            
                            xlsContent += '<tr> <td> ' + rowValues.join('</td><td>') + '</td> </tr> </br>';
                        }
                        xlsContent += '</table>';
                        console.log('Xls Content is:::' , xlsContent);
                        this.downloadCSV(xlsContent);
                        // this.downloadCSV(csvContent);
                        this.showSpinner = false;
                    }
                }
            }
        } catch (err) {
            if(this.isChild){
                this.dispatchEvent(new CustomEvent('done'));
            }
            console.log('error in here ,' , err.message);
            this.showSpinner = false;
            this.showToast('error', 'Oops! Something went wrong', 'Some error occurred, Please try again.', 5000);
        }
    }
    getValueByKey(obj, key) {
        return key.split('.').reduce((o, i) => (o ? o[i] : undefined), obj);
    }
// -=-=- Used to call the SF API repeatedly until no of records reaches to the limit -=-=-
    async fetchRecords(queryURL, sessionId, limitOfRecords) {
        try{
            // console.log('Limit : ' + limitOfRecords);
            // console.log('Query  : ' + encodeURI(queryURL));
            const myHeaders = new Headers();
            let bearerString = "Bearer " + sessionId;
            myHeaders.append("Authorization", bearerString);
    
            const requestOptions = {
            method: "GET",
            headers: myHeaders,
            redirect: "follow"
            };
            // console.log('URL : ' +window.location.origin );
            let domainURL = window.location.origin;
            domainURL = domainURL.replace('lightning.force.com', 'my.salesforce.com');
    
            const response = await fetch(encodeURI(domainURL+queryURL), requestOptions);
            if (!response.ok) {
                this.showToast('error', 'Oops! Something went wrong!' , 'There was an error connecting to the server, please try again.', 5000);
                return false;
            }
            const result = await response.json();
            let thisFetchedBatch = result.records;
            this.fetchedResults.push(...thisFetchedBatch);
            console.log('next record URL :: ' + result.nextRecordsUrl);
            if(result.nextRecordsUrl && limitOfRecords > this.fetchedResults.length){
                console.log('fetching more.');
                await this.fetchRecords(result.nextRecordsUrl,sessionId, limitOfRecords);
            }else if(limitOfRecords < this.fetchedResults.length){
                console.log('Slicing records.');
                this.fetchedResults = this.fetchedResults.slice(0, limitOfRecords);

            }else{
                console.log('Fetched records are ::: '+ this.fetchedResults.length);
            }
            return true;
        } catch(error){
            this.showToast('error', 'Sorry, The records could not be fetched!', 'We couldn\'t fetch the records, please try again..');
            console.log('Error fetching records : ' + error.message);
            return false;
        }
    }

// -=-=- Used to download the Generated CSV in the local system -=-=-
    downloadCSV(csvContent) {
        this.showSpinner = true;
        try{
            this.fetchedResults = [];
            console.log('In CSV Download!!');
            if(!this.csvFileName){
                let thisTemplate = this.allTemplates.find(opt => opt.value == this.templateId);
                this.csvFileName = thisTemplate.label;
                // console.log('Updated the CSV Name to :: ' + this.csvFileName);
            }
            var element ;
            if(this.selectedExtension == '.csv'){
                element = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
            }else if(this.selectedExtension == '.xls'){
                element = 'data:application/vnd.ms-excel,' + encodeURIComponent(csvContent);
            }
            let downloadElement = document.createElement('a');
            downloadElement.href = element;
            downloadElement.target = '_self';
            console.log('What is file Name ???:: ' + this.csvFileName);
            downloadElement.download = this.csvFileName+ this.selectedExtension;
            document.body.appendChild(downloadElement);
            downloadElement.click();
            this.showSpinner = false;
            this.showToast('success', 'Woohoo! Action performed!', 'Your CSV is Downloaded Successfully.', 5000 );
            if(this.isChild){
                this.dispatchEvent(new CustomEvent('done'));
            }
        }catch(err){
            if(this.isChild){
                this.dispatchEvent(new CustomEvent('done'));
            }
            this.showSpinner = false;
            this.showToast('error', 'Oops! Something went wrong', 'We Couldn\'t generate CSV at the moment!, please try again..', 5000);
            console.log('Error in Generating CSV!!' , err.message);
        }
    }

// -=-=- Used to close popup if, used by a parent
    // handleBackClick(){
    //     try{
    //         this.dispatchEvent(new CustomEvent('close'));
    //     }catch(e){
    //         console.log('Error in handleBackClick ,' , e.message);
    //     }
    // }

// -=-=- Used to show the toast to the User -=-=-
    showToast(status, title, message, duration){
        this.showSpinner = false;
        const messageContainer = this.template.querySelector('c-message-popup')
        messageContainer.showMessageToast({
            status: status,
            title: title,
            message : message,
            duration : duration
        });
    }

}