/*******************************************************
* Name          : DropboxAuthorizationControllerTest
* Author        : Tirth
* Create Date   : 26/06/2024 
* UsedBy        : DropboxAuthorizationController
* Description   : TestClass
* Company       : MV Clouds
*******************************************************/

@isTest
public with sharing class DropboxAuthorizationControllerTest {
    @TestSetup
    static void setup(){
        DropBoxAuthProviderSettings__c settings = new DropBoxAuthProviderSettings__c(
            refresh_token__c = 'dummy_refresh_token',
            access_token__c = 'dummy_access_token',
            email__c = 'test@example.com',
            LinkedDate__c = ''+Date.today(),
            WorkingStatus__c = true,
            username__c = 'testuser'
        );
        insert settings;
    }

    @isTest
    static void testAuthorize(){
        String client_id = 'MockClientId';
        String client_secret = 'MockClientSecret';
        Test.startTest();
        String result = DropBoxAuthorizationController.authorize(client_id, client_secret);
        DropBoxAuthProviderSettings__c settings = DropBoxAuthProviderSettings__c.getInstance();
        Test.stopTest();
        System.assertEquals(client_id, settings.ClientId__c);
    }
    @isTest
    static void testRedirectUrl1() {
        // Test for develop.my.salesforce.com
        Test.startTest();
        String redirectUrl = DropBoxAuthorizationController.redirect('Url:[delegate=https://testorg.develop.my.salesforce.com]');
        Test.stopTest();
        System.assertEquals('https://testorg--c.develop.vf.force.com/apex/dropboxSuccessPage', redirectUrl);

    }

    @isTest
    static void testRedirectUrl2() {
       

        // Test for sandbox.my.salesforce.com
        Test.startTest();
        String redirectUrl = DropBoxAuthorizationController.redirect('Url:[delegate=https://testorg.sandbox.my.salesforce.com]');
        Test.stopTest();
        System.assertEquals('https://testorg--c.sandbox.vf.force.com/apex/dropboxSuccessPage', redirectUrl);

    }

    @isTest
    static void testRedirectUrl3() {
        
        // Test for scratch.my.salesforce.com
        Test.startTest();
        String redirectUrl = DropBoxAuthorizationController.redirect('Url:[delegate=https://testorg.scratch.my.salesforce.com]');
        Test.stopTest();
        System.assertEquals('https://testorg--c.scratch.vf.force.com/apex/dropboxSuccessPage', redirectUrl);

    }

    @isTest
    static void testRedirectUrl4() {

        // Test for default case
        Test.startTest();
        String redirectUrl = DropBoxAuthorizationController.redirect('Url:[delegate=https://testorg.my.salesforce.com]');
        Test.stopTest();
        System.assertEquals('https://testorg--c.vf.force.com/apex/dropboxSuccessPage', redirectUrl);
    }

     @isTest
    static void testUnauthorize(){
        Test.startTest();
        Boolean state = DropBoxAuthorizationController.unauthorize();
        Test.stopTest();
        System.assertEquals(true, state, 'status should be true');
    }

    @isTest
    static void testheckonedriveauth(){
        Test.startTest();
        Map<String, Object> mappedResult = DropBoxAuthorizationController.checkdropboxauth();
        Test.stopTest();
        System.assertNotEquals(null, mappedResult);
        System.assertNotEquals('Error obtaining details: ', mappedResult.get('error'), 'Not getting error');

    }
}