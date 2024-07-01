public with sharing class DocGenerateController {

    public String paraData {get; set;}
    public String displayText {get; set;}
    public String contentType {get; set;}
    public String docType {get; set;}
    public String useMode {get; set;}
    public String recordName {get; set;}

    public String pageMargins {get; set;}
    public String pageConfigUnit {get; set;}
    public String pageSize {get; set;}
    public String pageOrientation {get; set;}

    public String fileBlob {get; set;}

    public DocGenerateController() {

        try {
            if(ApexPages.currentPage().getParameters().get('paraData') != null){
                paraData = String.escapeSingleQuotes(ApexPages.currentPage().getParameters().get('paraData'));
            }
            Map<String, Object> rawData = (Map<String, Object>)JSON.deserializeUntyped(paraData);
    
            // Map<String, String> returnValue = KeyMappingController.mappingFieldDataVF((String)rawData.get('templateId'), (String)rawData.get('recordId'), (String)rawData.get('Object_API_Name__c'));
            Map<String, String> returnValue = DataMappingController.mappingFieldDataVF((String)rawData.get('templateId'), (String)rawData.get('recordId'), (String)rawData.get('Object_API_Name__c'));
    
            displayText = returnValue.get('modifiedHTML');
            recordName = returnValue.get('recordName');
    
            Template_Page__c pageConfigs = (Template_Page__c) JSON.deserialize(returnValue.get('pageConfigs'), Template_Page__c.class);
            pageMargins = pageConfigs.Page_Margin__c;
            pageConfigUnit = pageConfigs.unit_of_page_configs__c;
            pageOrientation = pageConfigs.Page_Orientation__c;
            pageSize = pageConfigs.Page_Size__c;
    
            if((String)rawData.get('docType') != null && (String)rawData.get('docType') != ''){
                
                // if((String)rawData.get('docType') == 'PDF'){
                //     contentType = '';
                // }
                // else if((String)rawData.get('docType') == 'DOC'){
                //     contentType = 'application/msword#'+recordName+'.doc';
                // }
                // else if((String)rawData.get('docType') == 'PPT'){
                //     contentType = 'application/vnd.ms-powerpoint';
                // }
                docType = (String)rawData.get('docType');
                useMode = (String)rawData.get('useMode');
            }
        } catch (Exception e) {
            
        }

    }

    public void callFromJS(){
        try {
            System.debug('method call from vf page js'+ this.fileBlob);
        } catch (Exception e) {
            system.debug('exception in callFromJS : ' +  e.getMessage() +'\n'+ 'Line Number : ' + e.getLineNumber());
        }
    }

    public void setContentType(){
        System.debug('content Type Set');
    }
}