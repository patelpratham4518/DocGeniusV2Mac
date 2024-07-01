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
private class TemplateBuilder_ControllerTest {
    public static Blob imageBlob = Blob.valueOf('iVBORw0KGgoAAAANSUhEUgAAARAAAAB/CAIAAACovQp5AAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAABEKADAAQAAAABAAAAfwAAAADAZSePAAANGUlEQVR4Ae2dO4gUSxSGr5drauIqYmjgBoKbi+CCGCisKIiRgusjMTIQH2io+MDAyMQHgkaLoLCggSysIAZmCgYaGIr4QDA1uZ/3XA7l9kxPVU9NT/XuP8FQU33q1Om/zt+nnj2rPn/+/Jc+QkAIxCHwd5yYpISAEPiNgAgjPxACCQiIMAlgSVQIiDDyASGQgIA');

    @isTest
    static void templateBuilderControllerTest1() {
        Template__c temp = createTemplateRecord();
        Template_Page__c pageConfigs = createPageConfig(temp.Id);
        
        Test.startTest();
        TemplateBuilder_Controller.getTemplateData(temp.Id);
        String returnValue = TemplateBuilder_Controller.saveTemplateApex(temp, templateValues(), pageConfigs);
        Test.stopTest();

        System.assertEquals('Temlpate Updated Successfully Success', returnValue, 'success');
    }

    @isTest
    static void templateBuilderControllerTest2() {
        Template__c temp = createTemplateWithoutPage();
        List<string> newValue = new List<String>{'afff'};
        
        Test.startTest();
        TemplateBuilder_Controller.getTemplateData(temp.Id);
        Template_Page__c pageConfigs = createPageConfig(temp.Id);
        String returnValue = TemplateBuilder_Controller.saveTemplateApex(temp, templateValues(), pageConfigs);
        TemplateBuilder_Controller.saveTemplateApex(temp, newValue, pageConfigs);
        Test.stopTest();

        System.assertEquals('Temlpate Updated Successfully Success', returnValue, 'success');

    }

    @isTest
    static void templateBuilderControllerTest3() {
        Template__c temp2 = new Template__c();
        Template__c csvTemp = createCSVTemplate();

        Test.startTest();
        TemplateBuilder_Controller.getTemplateData('asdasd');
        String returnValue = TemplateBuilder_Controller.saveTemplateApex(temp2, null, null);
        TemplateBuilder_Controller.getTemplateData(csvTemp.Id);
        Test.stopTest();

        System.assertEquals('Template Not Found', returnValue, 'success');

    }

    @isTest
    static void templateBuilderControllerTest4() {
        Template__c temp = createExceptionTemplate();
        Test.startTest();
        TemplateBuilder_Controller.getTemplateData(temp.Id);
        String returnValue = TemplateBuilder_Controller.saveTemplateApex(temp, null, null);
        Test.stopTest();

        System.assertEquals('error', returnValue, 'success');

    }



    static Template__c createTemplateRecord(){
        Template__c template = new Template__c();
        template.Template_Name__c = 'Test Template';
        template.Template_Type__c = 'Simple Template';
        template.Object_API_Name__c = 'Account';
        template.Template_Status__c = true;
        insert template;

        createPageConfig(template.Id);

        Template_Data__c templateField = new Template_Data__c();
        templateField.Template__c = template.Id;
        templateField.Template_Value_Simple__c = '<div></div>';
        templateField.Order_No_Simple__c =1;
        insert templateField;

        return template;
    }

    public static Template_Page__c createPageConfig(String tempId){
        Template_Page__c page = new Template_Page__c();
        page.Template__c = tempId;
        page.Page_Number__c = 1;
        page.Page_Margin__c = '1;1;1;1';
        page.Page_Oriantation__c = 'portrait';
        page.Page_Size__c = 'a4';
        page.unit_of_page_configs__c = 'inch';
        insert page;
        return page;
    }

    public static Template__c createTemplateWithoutPage(){
        Template__c template = new Template__c();
        template.Template_Name__c = 'Test Template 2';
        template.Template_Type__c = 'Simple Template';
        template.Object_API_Name__c = 'Account';
        template.Template_Status__c = true;
        insert template;
        return template;
    }

    public static Template__c createCSVTemplate(){
        Template__c template = new Template__c();
        template.Template_Name__c = 'Test Template 3';
        template.Template_Type__c = 'CSV Template';
        template.Object_API_Name__c = 'Account';
        template.Template_Status__c = true;
        insert template;
        return template;
    }
    
    public static Template__c createExceptionTemplate(){
        Template__c template = new Template__c();
        template.Template_Name__c = 'Test Template 5';
        template.Template_Type__c = 'Simple Template';
        template.Object_API_Name__c = 'fdsdf';
        template.Template_Status__c = true;
        insert template;
        return template;
    }

    public static List<String> templateValues(){
        List<String> tempValues = new List<String>();

        String templateValue ='<p>{{#Id}}&nbsp;{{#Name}}&nbsp;{{Doc.Date.date}}&nbsp;{{Doc.User.AboutMe}}&nbsp;{{Doc.Org.City}}&nbsp;{{#CreatedBy.Username}}</p><p>{{#Name *L:20*}}&nbsp;{{#CreatedDate *dd/MM/yyyy HH:mm:ss*}}&nbsp;{{#IsDeleted *yes/no*}}&nbsp;{{#NumberOfEmployees *F:yes,*}}</p><table data-name="childRecords"><tbody class="" lwc-1tbjdqlnk30=""><tr><td style="overflow: hidden; text-align: center;">No.</td><td style="overflow: hidden; text-align: center;">Account ID</td><td style="overflow: hidden; text-align: center;">Created Date</td><td style="overflow: hidden; text-align: center;">Last Modified Date</td></tr><tr data-name="keyRow"><td style="overflow: hidden; text-align: center;">{{No.Index}}</td><td style="overflow: hidden; text-align: center;">{{!AccountId}}</td><td style="overflow: hidden; text-align: center;">{{!CreatedDate}}</td><td style="overflow: hidden; text-align: center;">{{!LastModifiedDate}}</td></tr><tr data-name="infoRow"><td colspan="4" style="position: relative; text-align: center; overflow: hidden; border-color: rgb(203, 203, 203) !important; color: rgb(76, 76, 76) !important;">Object: Contact,<br>$objApi:Contact$, $childRelation:Contacts$, $limit:12$, , $filter: IsDeleted = false  ORDER BY AccountId ASC $<br></td></tr></tbody></table>';
        tempValues.add(templateValue);
        tempValues.add('<p></p>');
        return tempValues;
    }
}