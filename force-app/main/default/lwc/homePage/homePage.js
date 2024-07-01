import { LightningElement, api, track, wire } from "lwc";
import { NavigationMixin } from 'lightning/navigation';
import docGeniusImgs from "@salesforce/resourceUrl/homePageImgs";
import docGeniusLogoSvg from "@salesforce/resourceUrl/docGeniusLogoSvg";
import getTemplateList from '@salesforce/apex/HomePageController.getTemplateList';
import updateTemplate from '@salesforce/apex/HomePageController.updateTemplate';
import deleteTemplate from '@salesforce/apex/HomePageController.deleteTemplate';
import { getObjectInfo, getPicklistValues } from 'lightning/uiObjectInfoApi';
import Template_Object from '@salesforce/schema/Template__c';
import Template_Type_FIELD from '@salesforce/schema/Template__c.Template_Type__c';
import {navigationComps, nameSpace} from 'c/globalProperties';

export default class HomePage extends NavigationMixin(LightningElement) {
    @track isDisplayOption = false;
    @track objectList = [];
    @track objPillToDisplay = null;
    @track templateTypeList = [];
    @track filterDateTypeList = [];
    
    @track templateList = [];
    @track filteredTemplateList = [];
    @track displayedTemplateList = [];
    @track maxTempToDisplay;
    
    @track defaultFieldToSort = 'LastModifiedDate';
    @track sortAS = 'desc';
    @track filterOpts = {};
    @track selectedTemplateId;
    @track selectedObjectName;
    @track isFilterApplied;

    @track selectedTemplate = {};
    @track dataLoaded = false; 
    @track isSpinner = false;
    @track isCreateTemplate = false;
    @track isCloneTemplate = false;
    
    isEmptyStateImgLoaded = false;
    toggelTemplateId = '';
    isToggleStatus = false;
    deleteTemplateId = ''
    isDeleteActive = false;

    isEditSimpleTemplate = false;
    isEditCSVTemplate = false;
    isEditDnDTemplate = false;

    lastScroll = 0;                             // User to identify scroll direction for lazy loading...

    @track sortingFiledList = [
        {label : 'Template Name', value : 'Template_Name__c'},
        {label : 'Created Date', value : 'CreatedDate'},
        {label : 'Last Modified Date', value : 'LastModifiedDate'},
        {label : 'Object Name', value : 'Object_API_Name__c'},
    ];
    @track refrenceTimeList = [
        {label : 'THIS WEEK', value : 'THIS_WEEK'},
        {label : 'LAST WEEK', value : 'LAST_WEEK'},
        {label : 'THIS MONTH', value : 'THIS_MONTH'},
        {label : 'LAST MONTH', value : 'LAST_MONTH'},
        // {label : 'THIS YEAR', value : 'THIS_YEAR'},
        // {label : 'LAST YEAR', value : 'LAST_YEAR'},
    ]

    referenceDates = {
        todayDate : '',
        firstDayofThisWeek : '',
        lastDayofThisWeek : '',
        firstDayofPreviousWeek : '',
        lastDayOfPreviousWeek : '',
        firstDayofPreviousMonth : '',
        lastDayOfPreviousMonth : '',
        firstDayofThisMonth : '',
        lastDayofThisMonth : ''
    }

    imgSrc = {
        'HomBg' : '',
        'createTemplateImg': '',
        'emptyState' : '',
    };

    get DocGeniusLogo(){
        return docGeniusLogoSvg;
    }
    get createTemplateImg(){
        return this.imgSrc.createTemplateImg;
    }

    get emptyStateImg(){
        return this.imgSrc.emptyState;
    }

    get isEmptyState(){
        return this.templateList.length <= 0 && !this.isSpinner ? true : false;
        // return true;
    }

    get enableFilterBtn(){
        return !this.isFilterApplied && Object.keys(this.filterOpts).length == 0 ? true : false;
    }

    get clearRangeDates(){
        return (this.filterOpts.hasOwnProperty('fromDate') != '' || this.filterOpts.hasOwnProperty('toDate') != '') ? true : false;
    }

    get noResultFound(){
        return this.displayedTemplateList.length || this.isSpinner ? false : true;
    }

    // Get Template__c Object Information...
    @wire(getObjectInfo, { objectApiName: Template_Object })
    objectInfo;

    // Get Picklist values form Template_Type__c FIELD from Template__c Object
    @wire(getPicklistValues, { recordTypeId: '$objectInfo.data.defaultRecordTypeId', fieldApiName: Template_Type_FIELD })
    wiredTemplateTypeValues({ data }) {
        if (data) {
            this.templateTypeList = this.mapPicklistValues(data);
        }
    }

    connectedCallback(){
        try {
            // Set reference field to filter functionality...
            // this.setReferenceDates();
            this.referenceDates = this.setReferenceDates();

            // Get data from Backed...
            this.fetchTemplateRecords();

            // storing static resource in single array...
            for(var key in this.imgSrc){
                this.imgSrc[key] = docGeniusImgs + '/' + key + '.png';
            }

        } catch (error) {
            console.error('error in method connectedCallback : ', error.stack);
        }
    }

    // generic method to  --> Mapping picklist value as key of label and value
    mapPicklistValues(data) {
        return data.values.map(item => ({
            label: item.label,
            value: item.value
        }));
    }

    setReferenceDates(){
        try {
    
            let todayDate = new Date();
    
            let firstDayofThisWeek = new Date(todayDate);
            firstDayofThisWeek.setDate(todayDate.getDate() - todayDate.getDay());
    
            let lastDayofThisWeek = new Date(todayDate);
            lastDayofThisWeek.setDate(todayDate.getDate() - todayDate.getDay() + 6);
    
            let lastDayOfPreviousWeek = new Date(todayDate);
            lastDayOfPreviousWeek.setDate(todayDate.getDate() - todayDate.getDay() - 1);
    
            let firstDayofPreviousWeek = new Date(todayDate);
            firstDayofPreviousWeek.setDate(todayDate.getDate() - todayDate.getDay() - 7);
    
            let firstDayofThisMonth = new Date(todayDate.getFullYear(), todayDate.getMonth(), 2);
            let lastDayofThisMonth = new Date(todayDate.getFullYear(), todayDate.getMonth() + 1, 1);
    
            let lastDayOfPreviousMonth = new Date(todayDate);
            lastDayOfPreviousMonth.setDate(todayDate.getMonth() - todayDate.getMonth());
    
            let firstDayofPreviousMonth = new Date(todayDate.getFullYear(), todayDate.getMonth() - 1, 2);
    
    
            var referenceDates = {}
            referenceDates.todayDate = todayDate.toISOString().split('T')[0];
            referenceDates.firstDayofThisWeek = firstDayofThisWeek.toISOString().split('T')[0];
            referenceDates.lastDayofThisWeek = lastDayofThisWeek.toISOString().split('T')[0];
            referenceDates.lastDayOfPreviousWeek = lastDayOfPreviousWeek.toISOString().split('T')[0];
            referenceDates.firstDayofPreviousWeek = firstDayofPreviousWeek.toISOString().split('T')[0];
            referenceDates.firstDayofPreviousMonth = firstDayofPreviousMonth.toISOString().split('T')[0];
            referenceDates.lastDayOfPreviousMonth = lastDayOfPreviousMonth.toISOString().split('T')[0];
            referenceDates.firstDayofThisMonth = firstDayofThisMonth.toISOString().split('T')[0];
            referenceDates.lastDayofThisMonth = lastDayofThisMonth.toISOString().split('T')[0];
    
            return referenceDates;
        } catch (error) {
            console.error('error in setReferenceDate : ', error.stack); 
        }
    }

    // Fetch Template Records From Apex..
    fetchTemplateRecords(){
        try {
            this.isSpinner = true;
            getTemplateList()
            .then(result => {
                console.log('result : ', result);
                if(result.isSuccess == true){
                    if(result.returnMessage != 'No Template Found'){
                        var templateList = result.templateList;
                        // Add additional keys for logic implementation...
                        templateList.forEach(ele => {
                            ele['srNo'] = templateList.indexOf(ele) + 1;
                            ele['CreateDate_Only'] = ele.CreatedDate.split('T')[0];
                            ele['LastModifiedDate_Only'] = ele.LastModifiedDate.split('T')[0];
                        });
                        this.templateList = templateList;
                        this.filteredTemplateList = JSON.parse(JSON.stringify(this.templateList));
                        
                        if(result.objectList.length > 0){
                            this.objectList = result.objectList;
                        }
                        if(result.dateFields.length > 0){
                            this.filterDateTypeList = result.dateFields;
                        }
                        this.filteredTemplateList = this.setSerialNumber(this.filteredTemplateList);
                        // Load only first 50 template in HTML on initial render...
                        this.maxTempToDisplay = this.filteredTemplateList.length;
                        this.displayedTemplateList = this.filteredTemplateList.slice(0, 50);
                        this.dataLoaded = true;
                        this.isSpinner = false;
                    }
                    else{
                        this.dataLoaded = true;
                        // check empty state image loaded or not?
                        this.displayEmptyState();
                    }
                }
                this.isSpinner = false;
            })
            .catch(error => {
                console.error('error in apex method getTemplateList : ', error);
                this.isSpinner = false;
            })
        } catch (error) {
            console.error('error in fetchTemplateRecords : ', error.stack);
        }
    }

    emptyStateImgLoad(){
        this.isEmptyStateImgLoaded = true;
    }

    displayEmptyState(){
        this.isSpinner = this.isEmptyStateImgLoaded && this.dataLoaded ? false : true;
    }

    // ------- -------- --------- --------- Sorting, Filter and Searching Option Methos - START - -------- ----------- ----------
    // Method to show/hidden options
    toggleFilterOptions(){
        try {
            this.isDisplayOption = !this.isDisplayOption;
            const upperSection = this.template.querySelector('.upperSection');
            const optionContainer = this.template.querySelector('.optionContainer')
            const filerOptBackDrop = this.template.querySelector('.filerOptBackDrop');
            if(this.isDisplayOption){
                upperSection.classList.add('showOptionContainer');

                setTimeout(() => {
                    optionContainer.style = `overflow: visible;`
                }, 400);
                // Interval Time must be match to the transition time for the upperSection;

                filerOptBackDrop.style = `display : block;`;
            }
            else{
                optionContainer.style = ``;

                upperSection.classList.remove('showOptionContainer');

                filerOptBackDrop.style = ``;
            }

        } catch (error) {
            console.error('error in method showMessagePopup : ', error.stack);
        }
    }

    onOptionSelect(event){
        try {
            var filterOpt = event.currentTarget.dataset.name;
            var tempFilterOpts = JSON.parse(JSON.stringify(this.filterOpts));
            if(event.detail.length > 0){
                if(event.currentTarget.multiselect == 'true' || event.currentTarget.multiselect == true){
                    tempFilterOpts[filterOpt] = event.detail;
                }
                else{
                    tempFilterOpts[filterOpt] = event.detail[0];
                }

                //if user selected any object...then Add selected object in List of Pill To Display
                if(filterOpt == 'objectsToFilter'){
                    var objPillToDisplay = [];
                    event.detail.forEach(ele => {
                        var selectedObj = this.objectList.find(obj => obj.value === ele);
                        objPillToDisplay.push(selectedObj);
                    });

                    this.objPillToDisplay = objPillToDisplay;
                }
            }
            else if(tempFilterOpts.hasOwnProperty(filterOpt)){
                delete tempFilterOpts[filterOpt];
                this.objPillToDisplay = null;
            }

            this.filterOpts = tempFilterOpts;
            
        } catch (error) {
            console.error('error in onOptionSelect', error.stack);
        }
    }

    onFilterCheckboxChange(event){
        try {
            var filterOpt = event.currentTarget.dataset.name;
            var tempFilterOpts = JSON.parse(JSON.stringify(this.filterOpts));
            var value = event.target.value;
            if(event.target.checked){
                tempFilterOpts[filterOpt] = tempFilterOpts[filterOpt] ? tempFilterOpts[filterOpt].concat([value]) :  [value];
            }
            else{
                tempFilterOpts[filterOpt] = tempFilterOpts[filterOpt].filter((item) => item !== value);
                if(tempFilterOpts[filterOpt].length == 0){
                    delete tempFilterOpts[filterOpt];
                }
            }
            this.filterOpts = tempFilterOpts;
        } catch (error) {
            console.log('error in onFilterCheckboxChange', error.stack);
        }
    }

    setSortingOrder(event){
        try {
            var filterOpt = event.currentTarget.dataset.name;
            var value = event.target.value;
            var tempFilterOpts = JSON.parse(JSON.stringify(this.filterOpts));
            tempFilterOpts[filterOpt] = value;
            this.filterOpts = tempFilterOpts;
        } catch (error) {
            console.log('error in setSortingOrder : ', setSortingOrder);
        }
    }

    ChangeDates(event){
        try {
            var filterOpt = event.currentTarget.dataset.name
            this.filterOpts[filterOpt] = event.target.value;

            if(this.filterOpts['fromDate'] && this.filterOpts['toDate']){
                if(filterOpt == 'toDate'){
                    if(this.filterOpts['toDate'] < this.filterOpts['fromDate']){
                        this.filterOpts['toDate'] = '';
                        event.target.value = '';
                        this.template.querySelector(`[data-label="toDate"]`).classList.add('errorText');
                        this.showMessageToast('error', '', '"To" Date must be greater or equal to "From" date', 4000);
                    }
                    else{
                        this.template.querySelector(`[data-label="toDate"]`).classList.remove('errorText');
                    }
                }
                else if(filterOpt == 'fromDate'){
                    if(this.filterOpts['fromDate'] > this.filterOpts['toDate']){
                        this.filterOpts['fromDate'] = '';
                        event.target.value = '';
                        this.template.querySelector(`[data-label="fromDate"]`).classList.add('errorText');
                        this.showMessageToast('error', '', '"From" Date must be less than "To" date', 4000);
                    }
                    else{
                        this.template.querySelector(`[data-label="fromDate"]`).classList.remove('errorText');
                    }
                }
            }
        } catch (error) {
            console.error('error in ChangeDates :  ', error.stack);
        }
    }

    referencePillClick(event){
        try {
            var filterOpt = event.currentTarget.dataset.name;
            var selectedRefrenceTime = event.currentTarget.dataset.value;

            this.filterOpts[filterOpt] = selectedRefrenceTime;

            this.setFromToDate(selectedRefrenceTime);
        } catch (error) {
            console.error('error in referencePillClick :  ', error.stack);
        }
    }

    setFromToDate(selectedRefrenceTime){
        try {
            if(selectedRefrenceTime == 'LAST_WEEK'){
                this.filterOpts['fromDate'] = this.referenceDates.firstDayofPreviousWeek;
                this.filterOpts['toDate'] = this.referenceDates.lastDayOfPreviousWeek;
            }
            else if(selectedRefrenceTime == 'THIS_WEEK'){
                this.filterOpts['fromDate'] = this.referenceDates.firstDayofThisWeek;
                this.filterOpts['toDate'] = this.referenceDates.todayDate;
            }
            else if(selectedRefrenceTime == 'LAST_MONTH'){
                this.filterOpts['fromDate'] = this.referenceDates.firstDayofPreviousMonth;
                this.filterOpts['toDate'] = this.referenceDates.lastDayOfPreviousMonth;
            }
            else if(selectedRefrenceTime == 'THIS_MONTH'){
                this.filterOpts['fromDate'] = this.referenceDates.firstDayofThisMonth;
                this.filterOpts['toDate'] = this.referenceDates.todayDate;
            }
            else{
                delete this.filterOpts['fromDate'];
                delete this.filterOpts['toDate'];
                delete this.filterOpts['refrenceTime'];
            }
        } catch (error) {
            console.error('error in setFromToDate : ', error.stack);
        }
    }

    // When we remove select object from pills..
    removeSelectedObj(event){
        try {
            var unselectedValue = event.currentTarget.dataset.value;

            this.objPillToDisplay = this.objPillToDisplay.filter(obj => {
                return obj.value != unselectedValue;
            });

            console.log(`this.filterOpts['objectsToFilter'] : `, this.filterOpts['objectsToFilter']);

            this.filterOpts['objectsToFilter'] = this.filterOpts['objectsToFilter'].filter((option) => {
                return option != unselectedValue;
            });

            if(this.objPillToDisplay.length == 0){
                this.objPillToDisplay = null;
                delete this.filterOpts['objectsToFilter'];
            }


            this.template.querySelector(`[data-name="objectsToFilter"]`).unselectOption(unselectedValue);
        } catch (error) {
            console.error('error inside removeSelectedObj : ', error.stack);
        }
    }

    handleSetRangeDates(){
        try {
            var radioBtns = this.template.querySelectorAll('[name="refrenceTime"]');
            radioBtns.forEach(ele => {
                ele.checked = false;
            });
            
            this.setFromToDate(null);

        } catch (error) {
            console.error('error in hanldeClearRefrenceTime : ', error.stack);
        }
    }

    applyFilter(event, isClear){
        try {

            var isFilter = this.setErrorForRangeDate();
            if(isFilter){
                this.showMessageToast('error', 'Required fields are empty !!!', 'Please fill the required field.', 4000);
            }
            else{
    
                this.filteredTemplateList = this.templateList.filter(ele => {
                    var inObject = this.filterOpts['objectsToFilter'] ? this.filterOpts['objectsToFilter'].includes(ele.Object_API_Name__c) : true;
                    var inType = this.filterOpts['TempTypeToFilter'] ? this.filterOpts['TempTypeToFilter'].includes(ele.Template_Type__c) : true;
                    var inStatus = this.filterOpts['TempStatusToFilter'] ? this.filterOpts['TempStatusToFilter'].includes(ele.Template_Status__c.toString()) : true;
                    var inDate = true;
                    if(this.filterOpts['dateToFilter']){
                        var dateOnly = ele[this.filterOpts['dateToFilter']].split('T')[0];
                        inDate = dateOnly >= this.filterOpts['fromDate'] && dateOnly <= this.filterOpts['toDate'];
                    }

                    return (inObject && inType && inStatus && inDate);
                });

                
                this.sortDisplayTemplates();
                this.filteredTemplateList = this.setSerialNumber(this.filteredTemplateList);

                // Load only first 50 template in HTML on after apply filters...
                this.maxTempToDisplay = this.filteredTemplateList.length;
                this.displayedTemplateList = this.filteredTemplateList.slice(0, 50);

                // If There is No option available to filter after filtering... set "isFilterApplied" to false...
                this.isFilterApplied = Object.keys(this.filterOpts).length == 0 ? false : true;

                console.log('isClear : ', isClear);
                !isClear && this.toggleFilterOptions();
            }
        } catch (error) {
            console.error('error in applyFilter : ', error.stack);
        }
    }

    sortDisplayTemplates(){
        try {
            var fieldToSort = this.filterOpts['fieldToSort'] ? this.filterOpts['fieldToSort'] : this.defaultFieldToSort;
            var sortAs = this.filterOpts['filterSortAS'] ? this.filterOpts['filterSortAS'] : this.defaultSortAS;
            this.filteredTemplateList = this.filteredTemplateList.sort((a, b) => {
                if(a[fieldToSort].toLowerCase() > b[fieldToSort].toLowerCase()){
                    return sortAs == 'asc' ? 1 : -1;
                }
                if(a[fieldToSort].toLowerCase() < b[fieldToSort].toLowerCase()){
                    return  sortAs == 'asc' ? -1 : 1;
                }
                if(a[fieldToSort].toLowerCase() == b[fieldToSort].toLowerCase()){
                    
                    if(fieldToSort != 'Template_Name__c'){
                        if(a['Template_Name__c'].toLowerCase() == b['Template_Name__c'].toLowerCase()){
                            if(a['Template_Name__c'].toLowerCase() > b['Template_Name__c'].toLowerCase()){
                                return 1;
                            }
                            if(a['Template_Name__c'].toLowerCase() < b['Template_Name__c'].toLowerCase()){
                                return -1;
                            }
                            if(a['Template_Name__c'].toLowerCase() == b['Template_Name__c'].toLowerCase()){
                                return 0;
                            }
                        }
                    }
                    else{
                        return 0;
                    }
                }

            })
        } catch (error) {
            console.error('error in sortDisplayTemplates : ', error.stack);
        }
    }

    setErrorForRangeDate(){
        try {
            if(this.filterOpts['dateToFilter'] || this.filterOpts['fromDate'] || this.filterOpts['toDate'] ){
                if(!this.filterOpts['fromDate']){
                    this.template.querySelector(`[data-name="fromDate"]`).classList.add('errorBorder');
                }
                else{
                    this.template.querySelector(`[data-name="fromDate"]`).classList.remove('errorBorder');
                }

                if(!this.filterOpts['toDate']){
                    this.template.querySelector(`[data-name="toDate"]`).classList.add('errorBorder');
                }
                else{
                    this.template.querySelector(`[data-name="toDate"]`).classList.remove('errorBorder');
                }

                if(!this.filterOpts['dateToFilter']){
                    this.template.querySelector(`[data-name="dateToFilter"]`).isInvalidInput(true);
                }
                else{
                    this.template.querySelector(`[data-name="dateToFilter"]`).isInvalidInput(false);
                }
                
                if(this.filterOpts['dateToFilter'] && this.filterOpts['fromDate'] &&  this.filterOpts['toDate'] ){
                    return false;
                }
                else{
                    return true;
                }
            }
            else{
                this.template.querySelector(`[data-name="fromDate"]`).classList.remove('errorBorder');
                this.template.querySelector(`[data-name="toDate"]`).classList.remove('errorBorder');
                this.template.querySelector(`[data-name="dateToFilter"]`).isInvalidInput(false);
                return false;
            }
            
        } catch (error) {
            console.error('error in setErrorForRangeDate : ', error.stack);            
        }
        
    }

    // Set Serial Number after Searching, Sorting and Filtration...
    setSerialNumber(listToUpdate){
        
        listToUpdate.forEach(ele => {
            ele['srNo'] = listToUpdate.indexOf(ele) + 1;
        });

        return listToUpdate;
    }

    // Lazy loading Method to add and remove templates based in scroll position..
    loadTemplates(event){
        try {
            const currentScroll = event.target.scrollTop;                                           // current scrolling position..
            const offsetToBottom = event.target.scrollHeight - event.target.clientHeight - 600;     // add when scroll below this position..
            const halfOffset = (event.target.scrollHeight / 2) - 300;                               // remove when scroll above this position...

            // When Scrolling Downward... ADD template in bottom...
            if(currentScroll >= this.lastScroll && currentScroll >= offsetToBottom){

                if(this.displayedTemplateList.length < this.maxTempToDisplay){

                    const firstIndex = this.displayedTemplateList.length;
                    let lastIndex = this.displayedTemplateList.length + 50;
                    lastIndex = lastIndex < this.maxTempToDisplay ? lastIndex : this.maxTempToDisplay;

                    for(var i = firstIndex; i < lastIndex; i++){
                        this.displayedTemplateList.push(this.filteredTemplateList[i]);
                    }
                }
            }

            //When Scrolling Upward... REMOVED templates from bottom...
           else if(currentScroll < this.lastScroll && currentScroll < halfOffset){
                if(this.displayedTemplateList.length > 50){
                    let lastIndex = this.displayedTemplateList.length - 50;
                    lastIndex = lastIndex < 50 ? 50 : lastIndex;
    
                    this.displayedTemplateList = this.filteredTemplateList.slice(0, lastIndex);
                }
            }

            this.lastScroll = event.target.scrollTop;

        } catch (error) {
            console.log('error in loadTemplates : ', error.stack);
        }
    }

    clearFilterOpts(event){
        try {
            // crear filerOpt object keys...
            var tempFilterOpts = JSON.parse(JSON.stringify(this.filterOpts))
            for(var key in tempFilterOpts){
                delete tempFilterOpts[key];
            }
            this.filterOpts = tempFilterOpts;

            // Reset sortAS to 'asc
            this.template.querySelector('[data-value="asc"]').checked = true;

            // Untick all Checkbox of Template type selection...
            var TempTypeCheckBoxs = this.template.querySelectorAll('[data-name="TempTypeToFilter"]');
            TempTypeCheckBoxs.forEach(ele => {
                ele.checked = false;
            });

            // Untick all Checkbox of Template Statuc selection...
            var TempStatusCheckBoxs = this.template.querySelectorAll('[data-name="TempStatusToFilter"]');
            TempStatusCheckBoxs.forEach(ele => {
                ele.checked = false;
            });
            
            // Reset all custom combobox value to default...
            var customCombos = this.template.querySelectorAll('c-custom-combobox');
            if(customCombos.length > 0){
                customCombos.forEach(ele => {
                    ele.resetValue();
                    ele.clearSearch();
                });
            }

            // remove all obj pills...
            this.objPillToDisplay = null;

            // Un-tick all reference time selection as well as 'FROM' and 'TO' dates...
            this.handleSetRangeDates();

            // apply filter after removing all options
            this.applyFilter(event, true);
            
            this.isFilterApplied = false;
        } catch (error) {
            console.log('error in clearFilterOpts : ', error.stack);
        }
    }

    searchTemplates(event){
        try {
            var searchValue = (event.target.value).toLowerCase();

            var filteredTemplateList = [];
            
            filteredTemplateList = this.filteredTemplateList.filter((ele) => {
                 return ele.Template_Name__c.toLowerCase().includes(searchValue);
            });

            // Load only first 50 template in HTML after searching...
            this.maxTempToDisplay = filteredTemplateList.length;
            this.displayedTemplateList = filteredTemplateList.slice(0, 50);

            this.displayedTemplateList = this.setSerialNumber(this.displayedTemplateList);
            
        } catch (error) {
            console.error('error in searchTemplates : ', error.stack);
        }
    }

    // ------- -------- --------- --------- Sorting, Filter and Searching Option Methos - START - -------- ----------- ----------

    toggleCreateNEwTemplate(){
        this.isCreateTemplate = !this.isCreateTemplate;
    }

    toggleCloneTemplate(){
        this.isCloneTemplate = !this.isCloneTemplate;
    }

    // when user try to change status using toggle button.
    handleChangeStatus(event){
        try {
            this.toggelTemplateId = event.currentTarget.dataset.id;
            this.isToggleStatus = true;
            if(!event.target.checked){
                event.target.checked = !event.target.checked;
                // If user try to inactive status... Show Confirmation Popup Message...
                this.showMessagePopup('Warning', 'Warning !!!', 'Do you want to Inactive this Template');
            }
            else{
                // update Status the template List to reflect on UI
                var index = this.filteredTemplateList.findIndex(ele => ele.Id == this.toggelTemplateId);
                this.filteredTemplateList[index].Template_Status__c = true;

                var index2 = this.templateList.findIndex(ele => ele.Id == this.toggelTemplateId);
                this.templateList[index2].Template_Status__c = true;

                // Update Template in Backend...
                updateTemplate({ templateId : this.toggelTemplateId, isActive : true})
                .then(result => {
                    console.log('result on updateTemplate : ', result);
                })
                .catch(error => {
                    console.error('error in apex method  updateTemplate: ', {error});
                })

            }
        } catch (error) {
            console.error('error in handleChangeStatus : ',error.stack);
        }
    }

    handlePreviewTemplate(event){
        try {
            console.log('handlePreviewTemplate');
            this.showMessagePopup('info', 'Under Construction.. !!', 'This Functionality is still in Progess...');
        } catch (error) {
            console.error('error in handlePreviewTemplate : ',error.stack);
        }
    }

    handleDeleteTemplate(event){
        try {
            this.deleteTemplateId = event.currentTarget.dataset.id;
            console.log('this.deleteTemplateId : ', this.deleteTemplateId);
            this.isDeleteTemplate = true;
            this.showMessagePopup('Warning', 'Conform to Delete ?', 'Do you want to Delete this Template');
            
        } catch (error) {
            console.error('error in handleDeleteTemplate : ',error.stack);
        }
    }

    // As received confirmation from child popup message component...
    handleConfirmation(event){
        try {
            if(this.isToggleStatus){
                const toggelInput = this.template.querySelector(`[data-toggel="${this.toggelTemplateId}"]`);

                if(event.detail){
                    toggelInput.checked = !toggelInput.checked;
                    // If received Confirm from user ... 
                    // update Status the template List to reflect on UI...
                    var index = this.filteredTemplateList.findIndex(ele => ele.Id == this.toggelTemplateId);
                    this.filteredTemplateList[index].Template_Status__c = toggelInput.checked;
    
                    var index2 = this.templateList.findIndex(ele => ele.Id == this.toggelTemplateId);
                    this.templateList[index2].Template_Status__c = toggelInput.checked;

                    // Update Template in Backend...
                    updateTemplate({ templateId : this.toggelTemplateId, isActive : toggelInput.checked})
                    .then(result => {
                        console.log('result on updateTemplate : ', result);
                    })
                    .catch(error => {
                        console.error('error in apex method  updateTemplate: ', {error});
                    })
                }
                else{
                    this.isToggleStatus = false;
                    this.toggelTemplateId = null;
                }
                this.isToggleStatus = false;
            }
            if(this.isDeleteTemplate){
                if(event.detail){
                    // If recived Confirm from user ... Delete Template from backend...
                    this.isSpinner = true;
                    deleteTemplate({templateId : this.deleteTemplateId})
                    .then(result => {
                        console.log('result on deleteTemplate : ', result);
                        if(result == 'deleted'){
                            // Remove Template from TemplateList...
                            this.filteredTemplateList = this.filteredTemplateList.filter(ele => { return ele.Id != this.deleteTemplateId});
                            this.templateList = this.templateList.filter(ele => { return ele.Id != this.deleteTemplateId});
                            this.displayedTemplateList = this.displayedTemplateList.filter(ele => {return ele.Id != this.deleteTemplateId});
                            
                            // Set Serial Number after Deleting...
                            this.filteredTemplateList = this.setSerialNumber(this.filteredTemplateList);
                            this.templateList = this.setSerialNumber(this.templateList);
    
                            this.deleteTemplateId = null;
                            this.isDeleteTemplate = false;
                            this.isSpinner = false;
    
                            this.showMessageToast('Success', 'Template Deleted.', 'Your template deleted successfully.', 5000);
                        }
                        this.isSpinner = false;
                    })
                    .catch(error => {
                        console.error('error in apex method  deleteTemplate: ', {error});
                        this.isSpinner = false;
                    })
                }
                else{
                    this.deleteTemplateId = null;
                    this.isDeleteTemplate = false;
                }
            }
        } catch (error) {
            console.error('error in handleConfirmation : ', error.stack);
        }
    }

    handleEditClick(event){
        try {
            this.selectedTemplateId = event.currentTarget.dataset.id;
            this.selectedTemplate = this.templateList.find(ele => { ele.Id === event.currentTarget.dataset.id});
            this.selectedObjectName = event.currentTarget.dataset.objapi;
            // If Option Container Open.. then close it before open edit section...
            if(this.isDisplayOption){
                this.toggleFilterOptions();
            }
            var paramToPass = {
                templateId: this.selectedTemplateId,
                objectName : this.selectedObjectName
            }
            if(event.currentTarget.dataset.type == 'Simple Template'){
                // this.isEditSimpleTemplate = true;
                this.navigateToComp(navigationComps.simpleTemplateBuilder, paramToPass);

            }
            else if(event.currentTarget.dataset.type == 'CSV Template'){
                // this.isEditCSVTemplate = true;
                this.navigateToComp(navigationComps.csvTemplateBuilder, paramToPass);
            }
            else if(event.currentTarget.dataset.type == 'Drag&Drop Template'){
                // this.isEditDnDTemplate = true;
                this.navigateToComp(navigationComps.dNdTemplateBuilder, paramToPass);
            }
            else if(event.currentTarget.dataset.type == 'Google Doc Template'){
                this.navigateToComp(navigationComps.googleDocTemplateEditor, paramToPass);
            }

        } catch (error) {
            console.error('error in handleEditClick : ', error.stack);
        }
    }

    cloneTemp(event){
        try {
            console.log('click on the clone Bt');
            this.selectedTemplateId = event.currentTarget.dataset.id;
            console.log(' this.selectedTemplateId *** : ', this.selectedTemplateId);
            console.log('this.templateList *** : ',JSON.stringify(this.templateList));
            this.selectedTemplate = this.templateList.find(ele => ele.Id == this.selectedTemplateId);
            console.log(' this.selectedTemplate *** : ', this.selectedTemplate);
            this.selectedObjectName = event.currentTarget.dataset.objapi;
            console.log(' this.selectedObjectName *** : ', this.selectedObjectName);
            this.isCloneTemplate = !this.isCloneTemplate;

        } catch (error) {
            console.error('error in cloneTemp : ', error.stack);
        }

    }

        // ==== ===== ==== Generetic Method to test Message Popup and Toast... === === === === === === ===
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