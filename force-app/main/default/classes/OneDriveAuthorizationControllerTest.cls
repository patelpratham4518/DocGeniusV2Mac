/*******************************************************
* Name          : OneDriveAuthorizationControllerTest
* Author        : Tirth
* Create Date   : 26/06/2024 
* UsedBy        : OneDriveAuthorizationController
* Description   : Test Class 
* Company       : MV Clouds
*******************************************************/
@isTest
public class OneDriveAuthorizationControllerTest {

    @TestSetup
    static void setup(){
        OneDriveAuthProviderSettings__c settings = new OneDriveAuthProviderSettings__c(
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
        String result = OneDriveAuthorizationController.authorize(client_id, client_secret);
        Test.stopTest();
        OneDriveAuthProviderSettings__c settings = OneDriveAuthProviderSettings__c.getInstance();
        System.assertEquals(client_id, settings.ClientId__c);
        System.assertEquals(client_secret, settings.ClientSecret__c);
    }

    @isTest
    static void testheckonedriveauth(){
        Test.startTest();
        Map<String, Object> mappedResult = OneDriveAuthorizationController.checkonedriveauth();
        Test.stopTest();
        System.assertNotEquals(null, mappedResult);
        System.assertNotEquals('Error obtaining details: ', mappedResult.get('error'), 'Not getting error');

    }

    @isTest
    static void testUnauthorize(){
        Test.startTest();
        Boolean state = OneDriveAuthorizationController.unauthorize();
        Test.stopTest();
        System.assertEquals(true, state, 'status should be true');
    }

    @isTest
    static void testAuthorize_MissingParams(){
        Test.startTest();
        String result = OneDriveAuthorizationController.authorize('', '');
        Test.stopTest();
        System.assertEquals('Both Client ID and Client Secret are required.', result);
    }

    @isTest
    static void testRedirectUrl1() {
        // Test for develop.my.salesforce.com
        Test.startTest();
        String redirectUrl = OneDriveAuthorizationController.redirect('Url:[delegate=https://testorg.develop.my.salesforce.com]');
        Test.stopTest();
        System.assertEquals('https://testorg--c.develop.vf.force.com/apex/oneDriveSuccessPage', redirectUrl);

    }

    @isTest
    static void testRedirectUrl2() {
       

        // Test for sandbox.my.salesforce.com
        Test.startTest();
        String redirectUrl = OneDriveAuthorizationController.redirect('Url:[delegate=https://testorg.sandbox.my.salesforce.com]');
        Test.stopTest();
        System.assertEquals('https://testorg--c.sandbox.vf.force.com/apex/oneDriveSuccessPage', redirectUrl);

    }

    @isTest
    static void testRedirectUrl3() {
        
        // Test for scratch.my.salesforce.com
        Test.startTest();
        String redirectUrl = OneDriveAuthorizationController.redirect('Url:[delegate=https://testorg.scratch.my.salesforce.com]');
        Test.stopTest();
        System.assertEquals('https://testorg--c.scratch.vf.force.com/apex/oneDriveSuccessPage', redirectUrl);

    }

    @isTest
    static void testRedirectUrl4() {

        // Test for default case
        Test.startTest();
        String redirectUrl = OneDriveAuthorizationController.redirect('Url:[delegate=https://testorg.my.salesforce.com]');
        Test.stopTest();
        System.assertEquals('https://testorg--c.vf.force.com/apex/oneDriveSuccessPage', redirectUrl);
    }
}