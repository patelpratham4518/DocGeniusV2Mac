@IsTest
private class AwsAuthorizationControllerTest {

    private class AwsCalloutMock implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            
            if (req.getEndpoint().contains('s3.amazonaws.com')) {
                res.setStatusCode(200);
                res.setBody('{"message": "Success"}');
            } else {
                res.setStatusCode(404);
                res.setBody('{"error": "Not Found"}');
            }
            
            return res;
        }
    }

    @IsTest
    static void testCheckAwsAuth() {
        // Insert mock settings
        AwsAuthProviderSettings__c settings = new AwsAuthProviderSettings__c(
            ClientId__c = 'mockClientId',
            ClientSecret__c = 'mockClientSecret',
            BucketName__c = 'mockBucketName',
            LinkedDate__c = Datetime.newInstance(Date.today().year(), Date.today().month(), Date.today().day()).format('dd/MM/yyyy'),
            WorkingStatus__c = true,
            NickName__c = 'mockNickName'
        );
        insert settings;
        
        // Test checkawsauth method
        Test.startTest();
        Map<String, Object> result = AwsAuthorizationController.checkawsauth();
        Test.stopTest();
        
        // Validate results
        System.assertEquals('mockBucketName', result.get('bucket'));
        System.assertEquals(Datetime.newInstance(Date.today().year(), Date.today().month(), Date.today().day()).format('dd/MM/yyyy'), result.get('linkdate'));
        System.assertEquals(true, result.get('active'));
        System.assertEquals('mockNickName', result.get('name'));
    }

    @IsTest
    static void testAuthorize() {
        // Set up mock for HTTP callout
        Test.setMock(HttpCalloutMock.class, new AwsCalloutMock());
        // AwsAuthProviderSettings__c settings1 = [SELECT ClientId__c, ClientSecret__c, BucketName__c, NickName__c, LinkedDate__c, WorkingStatus__c FROM AwsAuthProviderSettings__c LIMIT 5];
        // System.debug('set1-->'+ settings1);

        // Test authorize method
        Test.startTest();
        String result = AwsAuthorizationController.authorize('mockClientId', 'mockClientSecret', 'mockBucket', 'mockNickName');
        Test.stopTest();

        AwsAuthProviderSettings__c settings2 = [SELECT ClientId__c, ClientSecret__c, BucketName__c, NickName__c, LinkedDate__c, WorkingStatus__c FROM AwsAuthProviderSettings__c LIMIT 5];
        System.debug('set1-->'+ settings2);
        
        // Validate results
        System.assertEquals('Success', result);
        
        // Validate the updated settings
        AwsAuthProviderSettings__c settings = AwsAuthProviderSettings__c.getInstance();
        System.assertEquals('mockClientId', settings.ClientId__c);
        System.assertEquals('mockClientSecret', settings.ClientSecret__c);
        System.assertEquals('mockBucket', settings.BucketName__c);
        System.assertEquals('mockNickName', settings.NickName__c);
        System.assertEquals(Datetime.newInstance(Date.today().year(), Date.today().month(), Date.today().day()).format('dd/MM/yyyy'), settings.LinkedDate__c);
        System.assertEquals(true, settings.WorkingStatus__c);
    }

    @IsTest
    static void testUnauthorize() {
        // Insert mock settings
        
        
        AwsAuthProviderSettings__c settings = AwsAuthProviderSettings__c.getInstance();
        System.assertNotEquals(null, settings);
        
        // Test unauthorize method
        Test.startTest();
        Boolean result = AwsAuthorizationController.unauthorize();
        AwsAuthProviderSettings__c settings1 = [SELECT ClientId__c, ClientSecret__c, BucketName__c, NickName__c, LinkedDate__c, WorkingStatus__c FROM AwsAuthProviderSettings__c LIMIT 5];
        System.debug('settings-->'+settings1);
        Test.stopTest();
        
        // Validate results
        System.assertEquals(true, result);
        
        // Retrieve updated settings
        System.debug('set-->'+settings1.ClientId__c);
        
        // Validate the updated settings
        System.assertEquals(null, settings1.ClientId__c, 'ClientId should be reset');
        System.assertEquals(null, settings1.ClientSecret__c, 'ClientSecret should be reset');
        System.assertEquals(null, settings1.BucketName__c, 'BucketName should be reset');
        System.assertEquals(null, settings1.NickName__c, 'NickName should be reset');
        System.assertEquals(null, settings1.LinkedDate__c, 'LinkDate should be reset');
        System.assertEquals(false, settings1.WorkingStatus__c, 'WorkingStatus should be reset');
    }
}