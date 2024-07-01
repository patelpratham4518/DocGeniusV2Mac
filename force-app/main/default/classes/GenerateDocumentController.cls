public with sharing class GenerateDocumentController {
    
/*
*********************************************************
@description     : Method is used to fetch all the templates
@param           : objName {String} - Name of the object, from where the quick action is started
@return          : List<Template__c> - including all the templates fetched from org
********************************************************
*/
    @AuraEnabled
    public static List<Template__c> fetchTemplates(String objName){
        List<Template__c> templates = new List<Template__c>();
        try {
            templates = [ SELECT Id, Name, Object_API_Name__c, Template_Name__c, Template_Type__c, Template_Status__c, Description__c, LastModifiedDate FROM Template__c WHERE Object_API_Name__c=:objName];
        } catch (Exception e) {
            Log_Handler.store_Exception(e, 'GenerateDocumentController', 'fetchTemplates');
        }
        return templates;
    }

/*
*********************************************************
@description     : Method is used to fetch integration status
@param           : none
@return          : IntegrationWrapper - Wrapper containing all integration status
********************************************************
*/
    @AuraEnabled
    public static IntegrationWrapper getIntegrationStatus(){
        IntegrationWrapper IW = new IntegrationWrapper();
        try {
            List<AuthProviderSettings__c> gDrive = [SELECT Id, WorkingStatus__c FROM AuthProviderSettings__c];
            if(gDrive.size() > 0){
                IW.isGoogleDriveIntegrated = gDrive[0].WorkingStatus__c ;
            }
            List<AwsAuthProviderSettings__c> aws = [SELECT Id, WorkingStatus__c FROM AwsAuthProviderSettings__c];
            if(aws.size() > 0){
                IW.isAWSIntegrated = aws[0].WorkingStatus__c ;
            }
            List<DropBoxAuthProviderSettings__c> dropBox = [SELECT Id, WorkingStatus__c FROM DropBoxAuthProviderSettings__c];
            if(dropBox.size() > 0){
                IW.isDropBoxIntegrated = dropBox[0].WorkingStatus__c ;
            }
            List<OneDriveAuthProviderSettings__c> oneDrive = [SELECT Id, WorkingStatus__c FROM OneDriveAuthProviderSettings__c];
            if(oneDrive.size() > 0){
                IW.isOneDriveIntegrated = oneDrive[0].WorkingStatus__c ;
            }
        } catch (Exception e) {
            System.debug('Error in getIntegrationStatus =>' + e.getMessage());
            Log_Handler.store_Exception(e, 'GenerateDocumentController', 'getIntegrationStatus');
        }
        return IW;
    }


/*
*********************************************************
@description     : Method is used to fetch all the folders
@param           : none
@return          : List<FolderWrapper> - List of wrapper containing folder name and url
********************************************************
*/
@AuraEnabled
public static List<FolderWrapper> getFolders(){
    List<FolderWrapper> FW = new List<FolderWrapper>();
    try {
        List<Folder> folders = [SELECT Id, Name From folder WHERE Type ='Document'];
        FolderWrapper myFolder = new FolderWrapper();
        myFolder.label = 'My Personal Documents';
        myFolder.value = UserInfo.getUserId();
        FW.add(myFolder);
        for(Folder f : folders){
            FolderWrapper fWrapper = new FolderWrapper();
            fWrapper.label = f.Name;
            fWrapper.value = f.Id;
            FW.add(fWrapper);
        }
    } catch (Exception e) {
        System.debug('Error in getFolders =>' + e.getMessage());
        Log_Handler.store_Exception(e, 'GenerateDocumentController', 'getFolders');
    }
    return FW;
}


/*
*********************************************************
@description     : Method is used save document in the files
@param           : SaveDataWrapper {Wrapper} - wrapper containing needed data to store the file
// @param           : fileData {String} - data of the CSV
// @param           : templateId {String} - Id of the template
// @param           : fileName {String} - name of the file
// @param           : extension {String} - extension of the file
// @param           : folderId {String} - Id of the folder to save document in
// @param           : toEmails {List<String>} - list of to emails
// @param           : ccEmails {List<String>} - list of cc emails
// @param           : bccEmails {List<String>} - list of bcc emails
// @param           : emailSubject {String} - Subject of email
// @param           : emailBody {String} - Subject of email
// @param           : contentType {String} - contentType of the file
// @param           : addToNotesAttachments {Boolean} - true if file needs to be stored in Notes and Attachments
// @param           : addToFiles {Boolean} - true if file needs to be stored in Files
// @param           : addToChatter {Boolean} - true if file needs to be stored in Chatter
// @param           : addT0Documents {Boolean} - true if file needs to be stored in Documents
// @param           : sendEmail {Boolean} - true if file needs to be send via email
@return          : void - won't return anything back
********************************************************
*/
    @AuraEnabled
    public static void storeFilesAndSendEmail(SaveDataWrapper saveDataWrapper){
        try {
            // System.debug('In the save method with data :' + saveDataWrapper);
            ContentVersion cv = new ContentVersion();
            cv.title = saveDataWrapper.fileName;        
            cv.VersionData = Blob.valueOf(saveDataWrapper.fileData);
            cv.PathOnClient = saveDataWrapper.fileName+ saveDataWrapper.extension ;
            insert cv;
            // System.debug('Created the content version:' + cv);

            if(saveDataWrapper.addToChatter == true){
                FeedItem feed = new FeedItem();
                feed.ParentId =  saveDataWrapper.templateId;
                feed.RelatedRecordId = cv.Id;
                feed.Body = 'Create a file "' + saveDataWrapper.fileName + saveDataWrapper.extension + '"';
                insert feed;
                // System.debug('Created the Chatter post :' + feed);
            }else if(saveDataWrapper.addToFiles == true){
                ContentDocumentLink cdl = new ContentDocumentLink();
                cdl.ContentDocumentId = [Select Id, ContentDocumentId from ContentVersion WHERE Id=:cv.Id].ContentDocumentId;
                cdl.LinkedEntityId = saveDataWrapper.templateId;   
                cdl.Sharetype = 'I';
                insert cdl;
                // System.debug('Created the File' + cdl);
            }

            if(saveDataWrapper.addToDocument == true){
                Document doc = new Document();
                doc.Name = saveDataWrapper.fileName + saveDataWrapper.extension;
                doc.Body = Blob.valueOf(saveDataWrapper.fileData);
                // doc.ContentType = saveDataWrapper.contentType;
                doc.Type = saveDataWrapper.extension.substringAfter('.');
                doc.FolderId = saveDataWrapper.folderId;
                doc.IsPublic = true;
                Insert doc;
            }


            if(saveDataWrapper.sendEmail == true){
                Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
                String[] attachments =  new String[] {};
                system.debug('Email Body Here is :::'+ saveDataWrapper.emailBody);

                Matcher imgMatcher = Pattern.compile( '<img(.+?)>' ).matcher( saveDataWrapper.emailBody );

                // // iterate each image tag found
                while ( imgMatcher.find() ) {

                    // get the image tag html
                    String imageTag = imgMatcher.group();
                    System.debug( 'imageTag=' + imageTag );

                    // get the value of the src attribute
                    // the leading space is significant to avoid other attributes like data-cke-saved-src
                    String imageURL = imageTag.substringBetween( ' src="', '"' );
                    System.debug( 'imageURL=' + imageURL );

                    // if url contained parameters they might be html escaped, unescape them
                    // or, more conservatively, replace '&amp;' with '&'
                    String decodedURL = imageURL.unescapeHtml4();
                    System.debug( 'decodedURL=' + decodedURL );

                    // note, as of API 34.0 or later, getContent() is considered an http callout
                    // so take that into consideration for your unit tests and governor limits
                    // https://developer.salesforce.com/docs/atlas.en-us.pages.meta/pages/apex_System_PageReference_getContent.htm
                    PageReference page = new PageReference( decodedURL );
                    String b = page.getContent().toString();
                    System.debug( 'blob=' + b );

                    System.debug( 'Enjoy your Blob, save it as a Document, ContentVersion, whatever!' );

                    System.debug(''); // I like blank lines in my logs, easier to scan/read =)

                }
                attachments.add(cv.Id);
                mail.setToAddresses(saveDataWrapper.toEmails);
                mail.setCcAddresses(saveDataWrapper.ccEmails);
                mail.setBccAddresses(saveDataWrapper.bccEmails);
                mail.setSubject(saveDataWrapper.emailSubject);
                mail.setHtmlBody(saveDataWrapper.emailBody);
                mail.setEntityAttachments(attachments);

                system.debug('The mail Generated is ::::' + mail.htmlbody);
                Messaging.SendEmailResult[] result = Messaging.sendEmail(
                    new Messaging.SingleEmailMessage[] { mail });
                if (result[0].isSuccess()) {
                    System.debug('Email sent successfully');
                }
                else {
                    System.debug('The following errors occurred: ' + result[0].getErrors());            
                    throw new AuraHandledException('Email send was unsuccessfull');     
                }
            }


        }catch (Exception e) {
            System.debug('Error in storeFilesAndSendEmail =>' + e.getMessage());
            Log_Handler.store_Exception(e, 'GenerateDocumentController', 'storeFilesAndSendEmail');
            String errorMsg = e.getMessage();
            throw new AuraHandledException(ErrorMsg);
        }
    }

//--------------------------------------------------------------------------------------------------------------------------------------
//-----------------------------------------------------  CSV Generation Methods --------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------------------------------

/*
*********************************************************
@description      : Method is used to fetch the Query and count of records from the query
@param templateId : {String} - templateId of the selected template
@return           : {String} - containing fields, Query and the count of records
********************************************************
*/
    @AuraEnabled
    public static String getTemplateData(String templateId){
        String allData = '';
        try{
            List<Template_Data__c> tfList = [SELECT Id, CSV_Fields__c, CSV_Filter__c, CSV_Query__c, Template_Page__c FROM Template_Data__c WHERE Template__c =:templateId ORDER BY Order_No_Simple__c asc NULLS Last LIMIT 1];

            if(!tfList.isEmpty()){
                String fields = tfList[0].CSV_Fields__c;
                System.debug('all the Fields here :: ' + fields);
                String query = tfList[0].CSV_Query__c;

                String sessionId = '';

                if(Test.isRunningTest()) { 
                    sessionId = 'testSessionId';
                }else{
                    sessionId = Page.UserSessionIdPage.getContent().toString();
                }
                system.debug('sessionId : '+sessionId);


                allData = fields + ' <|QDG|> ' + query + ' <|QDG|> ' + sessionId;
                System.debug('All the Data to be Sent is :: ' + allData);
            }
        } catch (Exception e) {
            Log_Handler.store_Exception(e, 'GenerateDocumentController', 'getTemplateData');
        }
        return allData;
    }

// -=-=- Wrappers -=-=-
    public class IntegrationWrapper{
        @AuraEnabled public Boolean isGoogleDriveIntegrated;
        @AuraEnabled public Boolean isAWSIntegrated;
        @AuraEnabled public Boolean isOneDriveIntegrated;
        @AuraEnabled public Boolean isDropBoxIntegrated;
    }

    public class FolderWrapper{
        @AuraEnabled public String label;
        @AuraEnabled public String value;
    }

    public class SaveDataWrapper{
        @AuraEnabled public String fileData  { get; set; }
        @AuraEnabled public String templateId  { get; set; }
        @AuraEnabled public String fileName  { get; set; }
        @AuraEnabled public String extension  { get; set; }
        @AuraEnabled public String folderId  { get; set; }
        @AuraEnabled public List<String> toEmails  { get; set; }
        @AuraEnabled public List<String> ccEmails  { get; set; }
        @AuraEnabled public List<String> bccEmails  { get; set; }
        @AuraEnabled public String emailSubject { get; set;}
        @AuraEnabled public String emailBody { get; set;}
        // @AuraEnabled public String contentType { get; set;}
        @AuraEnabled public Boolean addToNotesAttachments  { get; set; }
        @AuraEnabled public Boolean addToFiles  { get; set; }
        @AuraEnabled public Boolean addToChatter  { get; set; }
        @AuraEnabled public Boolean addToDocument  { get; set; }
        @AuraEnabled public Boolean sendEmail  { get; set; }
    }

}





//Create the Document
// List<Folder> folderList = [SELECT Id, Name From Folder WHERE Name = 'CSV / XLS Folder'];
// String docFolderId = '07HH4000000Gp7xMAC';
// System.debug('Folder  was ::' +  folderList[0] + 'Id::' + docFolderId);
// String fileContent = 'This is a test file.';
// Datetime currentDT = System.now();
// String fileName = currentDT.format('yyyy-MM-dd-HH-mm-ss-SSS');
// Document doc = new Document();
// doc.Name = fileName;
// doc.Body = Blob.valueOf(fileContent);
// doc.ContentType = 'text/csv';
// doc.Type = 'csv';
// doc.FolderId = docFolderId;
// doc.IsPublic = true;
// Insert doc;

// System.debug('Doc inserted was ::' +  doc + 'Id::' + doc.Id);