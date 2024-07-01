@isTest
public class GoogleDriveAuthorizationControllerTest {

    private class GoogleCalloutMock implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            
            if (req.getEndpoint().contains('https://oauth2.googleapis.com/token')) {
                res.setStatusCode(200);
                res.setBody('{"token_type":"Bearer","scope":"Files.ReadWrite.All User.Read","expires_in":3600,"ext_expires_in":3600,"access_token":"EwBoA8l6BAAUbDba3x2OMJElkF7gJ4z/VbCPEz0AAfyM9TZgvBBytObO9RQ//AoKrpp77Yhm2RPebj08chxFR6tqNsqjd+LMhzAYAviSaIbRmSfM839VO/IdiyI9pR8nO8IJZrIQI=","refresh_token":"M.C510_SN1.0.U.-OIFbkeX*vV4anI4s!*zSOUqIuEOsGFatoNaPJinxub4xh4RJzhEURulO6!AU7Vhhp7N7F1V3$"}');
            }else if(req.getEndpoint().contains('https://www.googleapis.com/drive/v3/about?fields=user')){
                res.setStatusCode(200);
                res.setBody('{"user": {"emailAddress": "test@example.com", "displayName": "testuser", "photoLink": "dummy_photo_link"}}');
            } else {
                res.setStatusCode(404);
                res.setBody('{"error": "Not Found"}');
            }
            
            return res;
        }
    }

    @TestSetup
    static void setup(){
        AuthProviderSettings__c settings = new AuthProviderSettings__c(
            refresh_token__c = 'dummy_refresh_token',
            access_token__c = 'dummy_access_token',
            email__c = 'test@example.com',
            LinkedDate__c = ''+Date.today(),
            WorkingStatus__c = true,
            username__c = 'testuser',
            ClientId__c = 'Mock',
            ClientSecret__c = 'Mock',
            photolink__c = 'www.google.com'
        );
        insert settings;
    }                    

    @isTest
    static void testCheckGoogleAuth() {
        AuthProviderSettings__c settings = AuthProviderSettings__c.getInstance();
        System.debug(settings);
        Test.startTest();
        Map<String, Object> result = GoogleDriveAuthorizationController.checkgoogleauth();
        Test.stopTest();

        System.assertNotEquals(null, result);
        System.assertEquals('testuser', result.get('name'));
        System.assertEquals('test@example.com', result.get('email'));
        System.assertEquals(''+Date.today(), result.get('linkdate'));
        System.assertEquals(true, result.get('active'));
    }

    @isTest
    static void testunauthorize() {

        Test.startTest();
        Boolean result = GoogleDriveAuthorizationController.unauthorize();
        AuthProviderSettings__c settings = AuthProviderSettings__c.getInstance();
        Test.stopTest();


        System.assertEquals(true, result);

        System.debug('this is setting-->'+settings);
        System.assertEquals(null, settings.ClientId__c);
        System.assertEquals(null, settings.ClientSecret__c);
        System.assertEquals(null, settings.username__c);
        System.assertEquals(null, settings.LinkedDate__c);
        System.assertEquals(null, settings.email__c);
        System.assertEquals(null, settings.refresh_token__c);
        System.assertEquals(null, settings.access_token__c);
        System.assertEquals(false, settings.WorkingStatus__c);
    }


    @isTest
    static void testgetAuthCode(){
        String client_id = 'Mock';
        String client_secret = 'Mock';
        Test.startTest();
        String result = GoogleDriveAuthorizationController.getAuthCode(client_id, client_secret);
        Test.stopTest();
    }

    @isTest
    static void testauthorizeGoogle(){
        String authcode = '5465sf5sd6f46d5f4';
        Test.setMock(HttpCalloutMock.class, new GoogleCalloutMock());
        Test.startTest();
        String result = GoogleDriveAuthorizationController.authorizeGoogle(authcode);
        Test.stopTest();
    }


    
}