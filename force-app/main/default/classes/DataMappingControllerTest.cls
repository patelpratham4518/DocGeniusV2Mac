/**
 * This class contains unit tests for validating the behavior of Apex classes
 * and triggers.
 *
 * Unit tests are class methods that verify whether a particular piece
 * of code is working properly. Unit test methods take no arguments,
 * commit no data to the database, and are flagged with the testMethod
 * keyword in the method definition.
 *
 * All test methods in an org are executed whenever Apex code is deployed
 * to a production org to confirm correctness, ensure code
 * coverage, and prevent regressions. All Apex classes are
 * required to have at least 75% code coverage in order to be deployed
 * to a production org. In addition, all triggers must have some code coverage.
 * 
 * The @isTest class annotation indicates this class only contains test
 * methods. Classes defined with the @isTest annotation do not count against
 * the org size limit for all Apex scripts.
 *
 * See the Apex Language Reference for more information about Testing and Code Coverage.
 */

@isTest
private class DataMappingControllerTest {
    public static Blob imageBlob = Blob.valueOf('iVBORw0KGgoAAAANSUhEUgAAARAAAAB/CAIAAACovQp5AAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAABEKADAAQAAAABAAAAfwAAAADAZSePAAANGUlEQVR4Ae2dO4gUSxSGr5drauIqYmjgBoKbi+CCGCisKIiRgusjMTIQH2io+MDAyMQHgkaLoLCggSysIAZmCgYaGIr4QDA1uZ/3XA7l9kxPVU9NT/XuP8FQU33q1Om/zt+nnj2rPn/+/Jc+QkAIxCHwd5yYpISAEPiNgAgjPxACCQiIMAlgSVQIiDDyASGQgIA');
    
    @isTest
    static void dataMappingTest() {
        String templateID = createTemplateRecord().Id; 
        String recordId = createAccountRecord().Id; 
        String sourceObjectAPI = createTemplateRecord().Object_API_Name__c;

        Test.startTest();
        Map<String, String> returnValue = DataMappingController.mappingFieldDataVF(templateID,  recordId, sourceObjectAPI);
        DataMappingController.mappingFieldDataVF('templateID',  recordId, sourceObjectAPI);
        Test.stopTest();

        System.assertEquals('test Account', returnValue.get('recordName'), 'success');
    }

    @isTest
    static void keyMappingTest(){
        String sourceObjectAPI = createTemplateRecord().Object_API_Name__c;
        String imgID = createContentVersion().Id;

        Test.startTest();
        KeyMappingController.getChildObjects(sourceObjectAPI);
        KeyMappingController.getMerginTemplateKeys();
        KeyMappingController.getAllContentVersionImgs();
        string getBlob = KeyMappingController.fetchImgBlob(imgID);
        KeyMappingController.formattingFieldKeys();
        Test.stopTest();

        System.assertEquals(EncodingUtil.base64Encode(imageBlob), getBlob, 'success');
    }

    @isTest
    static void keyMappingTestException(){
        Test.startTest();
        KeyMappingController.getFieldMappingKeys('sdasfd', false);
        KeyMappingController.getChildObjects('sdasfd');
        KeyMappingController.getRelatedObjects('sdasfd');
        List<Schema.DescribeFieldResult> objectField = KeyMappingController.getObjectFields('sdasd');
        KeyMappingController.createMappingFieldInstance(null, 'sadas0', 'sdasddas');
        Test.stopTest();

        System.assertEquals(null, objectField, 'exception success');
    }

    @isTest
    static void docPreviewTest(){
        Template__c temp = createTemplateRecord();
        Account acc = createAccountRecord();
        DocPreviewController pre = new DocPreviewController();
        pre.paraData = '{ "templateId" : "'+temp.Id+'", "Object_API_Name__c" : "'+temp.Object_API_Name__c+'", "recordId" : "'+acc.Id+'", "usedFrom" : "Simple Template" }';
        pre.usedFrom = '';
        pre.displayText = '';
        pre.pageMargins = '';
        pre.pageConfigUnit = '';
        pre.pageSize = '';
        pre.pageOrientation = '';
        pre.docPDFBase64 = '';
        Test.startTest();
        pre.constructor();
        Test.stopTest();
    }

    @isTest
    static void docGenerateTest(){
        Template__c temp = createTemplateRecord();
        Account acc = createAccountRecord();
        Test.startTest();
        DocGenerateController gen = new DocGenerateController();
        gen.paraData = '{ "templateId" : "'+temp.Id+'", "Object_API_Name__c" : "'+temp.Object_API_Name__c+'", "recordId" : "'+acc.Id+'", "usedFrom" : "Simple Template" }';
        gen.displayText = '';
        gen.pageMargins = '';
        gen.pageConfigUnit = '';
        gen.pageSize = '';
        gen.pageOrientation = '';
        gen.contentType = '';
        gen.docType = '';
        gen.useMode = '';
        gen.recordName = '';
        gen.fileBlob = '';
        Test.stopTest();
    }

    @isTest
    static void keyMappingTest2(){
        Test.startTest();
        KeyMappingController.getAllContentVersionImgs();
        String getBlob = KeyMappingController.fetchImgBlob('sdas');
        Test.stopTest();

        System.assertEquals(null, getBlob, 'success');
    }

    

    static Template__c createTemplateRecord(){
        Template__c template = new Template__c();
        template.Template_Name__c = 'Test Template';
        template.Template_Type__c = 'Simple Template';
        template.Object_API_Name__c = 'Account';
        template.Template_Status__c = true;
        insert template;

        Template_Page__c page = new Template_Page__c();
        page.Template__c = template.Id;
        page.Page_Number__c = 1;
        page.Page_Margin__c = '1;1;1;1';
        page.Page_Oriantation__c = 'portrait';
        page.Page_Size__c = 'a4';
        page.unit_of_page_configs__c = 'inch';
        insert page;

        String templateValue = templateValue();
        
        Template_Data__c templateField = new Template_Data__c();
        templateField.Template__c = template.Id;
        templateField.Template_Value_Simple__c = templateValue;
        templateField.Order_No_Simple__c =1;
        insert templateField;

        return template;
    }

    public static Template__c createMergeTemplate(){
        Template__c template = new Template__c();
        template.Template_Name__c = 'Test Template 2';
        template.Template_Type__c = 'Simple Template';
        template.Object_API_Name__c = 'Account';
        template.Template_Status__c = true;
        insert template;

        Template_Data__c templateField = new Template_Data__c();
        templateField.Template__c = template.Id;
        templateField.Template_Value_Simple__c = 'test data 1234';
        templateField.Order_No_Simple__c =1;
        insert templateField;

        return template;
    }

    public static Template__c createMergeTemplateInActive(){
        Template__c template = new Template__c();
        template.Template_Name__c = 'Test Template 3';
        template.Template_Type__c = 'Simple Template';
        template.Object_API_Name__c = 'Account';
        template.Template_Status__c = false;
        insert template;

        return template;
    }

    public static Template__c createMergeTemplateCSV(){
        Template__c template = new Template__c();
        template.Template_Name__c = 'Test Template 4';
        template.Template_Type__c = 'CSV Template';
        template.Object_API_Name__c = 'Account';
        template.Template_Status__c = false;
        insert template;

        return template;
    }

    static Account createAccountRecord(){
        Account acc = new Account();
        acc.Name = 'test Account';
        acc.NumberOfEmployees  = 12;
        insert acc;

        List<Contact> childContacts = new List<Contact>();
        for(Integer i = 1; i < 10; i++){
            childContacts.add(createContact(i, acc.Id));
        }
        insert childContacts;

        return acc;
    }

    public static Contact createContact(Integer i, String accId){
        Contact con = new contact();
        con.lastName = 'test contact' + i;
        con.accountId = accId;
        return con;
    }

    public static ContentVersion createContentVersion(){
        ContentVersion cv = new ContentVersion();
        cv.Title = 'test image';
        cv.PathOnClient = 'test image.png';
        cv.VersionData = imageBlob;
        insert cv;
        return cv;
    }

    public static string templateValue(){
        String mergeTempId = createMergeTemplate().Id;
        String inActiveMergeTempId = createMergeTemplateInActive().Id;
        String csvMergeTempId = createMergeTemplateCSV().Id;
        String convetVersionId = createContentVersion().Id;
        String orgDomain = URL.getOrgDomainURL().toExternalForm();
        String orgHost = orgDomain.substringBefore('.');

        String templateValue ='<p>{{#Id}}&nbsp;{{#Name}}&nbsp;{{Doc.Date.date}}&nbsp;{{Doc.User.AboutMe}}&nbsp;{{Doc.Org.City}}&nbsp;{{#CreatedBy.Username}}</p><p>{{#Name *L:20*}}&nbsp;{{#CreatedDate *dd/MM/yyyy HH:mm:ss*}}&nbsp;{{#IsDeleted *yes/no*}}&nbsp;{{#NumberOfEmployees *F:yes,*}}</p><table data-name="childRecords"><tbody class="" lwc-1tbjdqlnk30=""><tr><td style="overflow: hidden; text-align: center;">No.</td><td style="overflow: hidden; text-align: center;">Account ID</td><td style="overflow: hidden; text-align: center;">Created Date</td><td style="overflow: hidden; text-align: center;">Last Modified Date</td></tr><tr data-name="keyRow"><td style="overflow: hidden; text-align: center;">{{No.Index}}</td><td style="overflow: hidden; text-align: center;">{{!AccountId}}</td><td style="overflow: hidden; text-align: center;">{{!CreatedDate}}</td><td style="overflow: hidden; text-align: center;">{{!LastModifiedDate}}</td></tr><tr data-name="infoRow"><td colspan="4" style="position: relative; text-align: center; overflow: hidden; border-color: rgb(203, 203, 203) !important; color: rgb(76, 76, 76) !important;">Object: Contact,<br>$objApi:Contact$, $childRelation:Contacts$, $limit:12$, , $filter: IsDeleted = false  ORDER BY AccountId ASC $<br></td></tr></tbody></table>';
        templateValue += '{{Doc.Temp.'+mergeTempId+' *test merge temp*'+'}}';
        templateValue += '{{Doc.Temp.'+inActiveMergeTempId+' *test merge temp*'+'}}';
        templateValue += '{{Doc.Temp.'+csvMergeTempId+' *test merge temp*'+'}}';
        templateValue += '<img src="'+orgHost+'/sfc/servlet.shepherd/version/download/'+convetVersionId+'" data-origin="sf" style="width: 75%;">';
        return templateValue;
    }
}