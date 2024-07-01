public with sharing class DocPreviewController {

    public String paraData {get; set;}
    public String usedFrom {get; set;}

    public String displayText {get; set;}
    public String pageMargins {get; set;}
    public String pageConfigUnit {get; set;}
    public String pageSize {get; set;}
    public String pageOrientation {get; set;}

    public String docPDFBase64 {get; set;}


    public DocPreviewController() {
    }

    public void constructor() {
        try {
            
            if(ApexPages.currentPage().getParameters().get('paraData') != null){
                paraData = String.escapeSingleQuotes(ApexPages.currentPage().getParameters().get('paraData'));
            }
            Map<String, Object> rawData = (Map<String, Object>)JSON.deserializeUntyped(paraData);
    
            System.debug('paraData : ' + paraData);
    
            usedFrom = (String)rawData.get('usedFrom');
            
            String templateId = (String)rawData.get('templateId');
            String recordId = (String)rawData.get('recordId');
            String objectApiName = (String)rawData.get('Object_API_Name__c');
    
            if(usedFrom == 'Simple Template'){
                Map<String, String> returnValue = DataMappingController.mappingFieldDataVF(templateId,recordId, objectApiName);
                
                displayText = returnValue.get('modifiedHTML');
                
                Template_Page__c pageConfigs = (Template_Page__c) JSON.deserialize(returnValue.get('pageConfigs'), Template_Page__c.class);
                pageMargins = pageConfigs.Page_Margin__c;
                pageConfigUnit = pageConfigs.unit_of_page_configs__c;
                pageOrientation = pageConfigs.Page_Orientation__c;
                pageSize = pageConfigs.Page_Size__c;
            }
            else if(usedFrom == 'Google Doc Template'){
                docPDFBase64 = EncodingUtil.base64Encode(GoogleDocPreview.doPreview(templateId, recordId,objectApiName));
            }
        } catch (Exception e) {
            
        }
    }
}