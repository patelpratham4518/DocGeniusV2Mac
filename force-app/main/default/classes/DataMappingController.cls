public with sharing class DataMappingController {
    
    // === ==== Replace mapping with actual data methods --- START ---- ==== ====
    public static Map<String, String> mappingFieldDataVF(String templateID, String recordId, String sourceObjectAPI){
        try {

            Map<String, String> returnValue = new Map<String, String>();
            String recordName = '';

            String innerHTML = '';
            String modifiedHTML = '';

            List<Template__c> temp = [SELECT Id, Name, Object_API_Name__c, Template_Name__c, Template_Type__c, Template_Status__c, Description__c, CreatedDate, LastModifiedDate, Column__c, Row__c, Don_t_show_Header_Footer_on_First_Page__c, Header_Text__c, Logo__c,  Type_of_Header__c, Watermark__c,
                                (SELECT Id, Name, Template__c, Template_Value_Simple__c, Order_No_Simple__c FROM Template_Data__r ORDER BY Order_No_Simple__c ASC),
                                (SELECT Id, Name, Template__c, Page_Margin__c, Page_Orientation__c, Page_Size__c, unit_of_page_configs__c FROM Template_Pages__r ORDER BY Page_Number__c ASC)
                                FROM Template__c  WHERE Id =: templateID WITH SECURITY_ENFORCED LIMIT 1 ];

            if(temp.size() > 0){
                for(Template_Data__c fieldValue : temp[0].Template_Data__r){
                    innerHTML += fieldValue.Template_Value_Simple__c;
                }
            }

            innerHTML = innerHTML.replace('&nbsp;', ' ');
            innerHTML = innerHTML.replace('<br>', '<br></br>');

            modifiedHTML = innerHTML;
            modifiedHTML = mappingObjFieldsData(modifiedHTML, recordId, sourceObjectAPI);
            modifiedHTML = mappingGeneralFieldData(modifiedHTML);
            modifiedHTML = mappingMergeTemplate(modifiedHTML);
            modifiedHTML = mappingSFimgWithBase64(modifiedHTML);
            modifiedHTML = mappingChildObject(modifiedHTML, recordId, sourceObjectAPI);
            
            // ... Get Record Name ...
            String stringQuery = 'SELECT Id, Name FROM '+ sourceObjectAPI + ' WHERE Id = \''+ recordId +'\' LIMIT 1';
            sObject sobj1 = Database.query(stringQuery);
            recordName = (String)sobj1.get('Name');
            returnValue.put('recordName', recordName);
            
            returnValue.put('modifiedHTML', modifiedHTML);
            string pageConfigs = JSON.serialize(temp[0].Template_Pages__r[0]) ;
            returnValue.put('pageConfigs', pageConfigs);
            return returnValue;

        } catch (Exception e) {
            Log_Handler.store_Exception(e, 'KeyMappingController', 'mappingFieldDataVF');
            system.debug('exception in mappingFieldDataVF : ' +  e.getMessage() +'\n'+ 'Line Number : ' + e.getLineNumber());
            return null;
        }
    }
    // --- Source Object and Related Object field Mapping -- START ---
    public static String mappingChildObject(String innerHTML, String recordId, String sourceObjectAPI){
        try {

            List<childTableInfo> childTables = new List<childTableInfo>();
            List<String> childRelations = new List<String>();
            Map<Integer, List<String>> queryGroup = new Map<Integer, List<String>>();
            Map<Integer, sObject> queryVSsObject = new Map<Integer, sObject>();
            
            //
            // Define a regular expression pattern to match placeholders...
            // Create a matcher with the input string to find pattern....
            //
            Pattern childRecordTablePattern = Pattern.compile('(?s)<table[^>]*data-name="childRecords"[^>]*>.*?<\\/table>');
            Matcher matcher = childRecordTablePattern.matcher(innerHTML);

            Pattern fieldKeyPattern = Pattern.compile('(?s)<tr[^>]*data-name="keyRow"[^>]*>.*?<\\/tr>');
            Pattern infoRowPattern = Pattern.compile('(?s)<tr[^>]*data-name="infoRow"[^>]*>.*?<\\/tr>');
            Pattern childFieldPattern = Pattern.compile('\\{\\{\\'+KeyMappingController.childKeySymbol+'(..*?)\\}\\}');

            // ===>>>> Interate loop over patter and find table with child records key... <<<<===
            while (matcher.find()) {
                String childTable = matcher.group();
                childTableInfo tableInfo = new childTableInfo();

                tableInfo.tableHTML = childTable;

                // ===>>>> Find the key row in child record table and add into map.... <<<<===
                Matcher fieldKeyMatcher = fieldKeyPattern.matcher(childTable);
                if(fieldKeyMatcher.find()){
                    tableInfo.keyRow = fieldKeyMatcher.group();
                }

                // ===>>>> Find the info row in child record table and add into map.... <<<<===
                Matcher infoRowMatcher = infoRowPattern.matcher(childTable);
                if(infoRowMatcher.find()) {
                    tableInfo.infoRow = infoRowMatcher.group();
                }

                childTables.add(tableInfo);
            }

            for(childTableInfo tableInfo : childTables){
                // ==>> Extract all table information from info Row... <<==
                String infoRow = tableInfo.infoRow;
                String queryFilters = '';
                String queryLimit = '';
                String childObjetAPI = '';
                if(infoRow != null && infoRow != ''){
                    tableInfo.childRelationshipName = infoRow.substringBetween('$childRelation:', '$');
                    childObjetAPI = infoRow.substringBetween('$objApi:', '$');
                    queryFilters = infoRow.substringBetween('$filter:', '$');
                    queryLimit = infoRow.substringBetween('$limit:', '$');
                    // If user enter Invalid limit string... handle it...
                    try {
                        Integer qLimit = Integer.valueOf(queryLimit);
                        queryLimit = qLimit > 50 ? '50' : queryLimit;
                    } catch (Exception e) {
                        queryLimit  = '';
                        // Do nothing
                    }
                }

                // ==> Process further only if table has child Relationship Name And Child Object Api info in info Row
                if( tableInfo.childRelationshipName != null  &&  tableInfo.childRelationshipName != ''
                &&  childObjetAPI != null &&  childObjetAPI != ''){

                    childRelations.add(tableInfo.childRelationshipName);

                    // Collect all child Object's field to verify that matching key have valid field Api or not?
                    List<String> validFields = new List<String>();
                    list<KeyMappingController.MappingObjects> objectWithFields = KeyMappingController.getFieldMappingKeys(childObjetAPI, false).fieldMappingsWithObj;
                    for(KeyMappingController.MappingObjects obj : objectWithFields){
                        for(KeyMappingController.MappingFields field : obj.fieldMappings){
                            validFields.add(field.name);
                        }
                    }
    
                    // ==> extract All Filed from key Row...
                    // ==> validate each field... and add into field's list to create query....
                    String keyRow = tableInfo.keyRow;
                    Map<String, String> fieldKeysVSfieldApi = new Map<String, String>();
                    if(keyRow != null && keyRow != ''){
                        matcher childFieldMatcher = childFieldPattern.matcher(keyRow);
                        while(childFieldMatcher.find()){
                            String fieldKey = childFieldMatcher.group();
                            String field = childFieldMatcher.group(1);
                            // Check If matched field key is valid of not... if valid add to list...
                            if(validFields.contains(field)){
                                fieldKeysVSfieldApi.put(fieldKey, field);
                            }
                        }
                    }

                    tableInfo.fieldKeysVSfieldApi = fieldKeysVSfieldApi;
    
                    // if Field list not contains Id field... add Id field...
                    list<String> queryFieldsList = fieldKeysVSfieldApi.values();
                    if(!queryFieldsList.contains('Id') && !queryFieldsList.contains('ID') && !queryFieldsList.contains('id')){
                        queryFieldsList.add('Id');
                    }
    
                    String queryFields = '';
                    queryFields = String.join(queryFieldsList, ',');
    
                    // ==> Generate Query for child Records....
                    String childQuery = '';
                    childQuery += '(SELECT '+queryFields+' FROM '+tableInfo.childRelationshipName;
                    if(queryFilters != null && queryFilters != ''){
                        childQuery += ' WHERE '+queryFilters;
                    }
                    if(queryLimit != null && queryLimit != ''){
                        childQuery += ' LIMIT '+queryLimit;
                    }
                    childQuery += ')';
    
                    system.debug('childQuery : ' + childQuery);

                    tableInfo.queryGroup = countIteration(childRelations, tableInfo.childRelationshipName);

                    if(queryGroup.get(tableInfo.queryGroup) == null){
                        queryGroup.put(tableInfo.queryGroup, new List<String>{childQuery});
                    }
                    else{
                        List<String> existingQuerys = queryGroup.get(tableInfo.queryGroup);
                        existingQuerys.add(childQuery);
                        queryGroup.put(tableInfo.queryGroup, existingQuerys);
                    }
                }
            }
    
            // ==> Iterate over map of queryGroup collect all child object query...
            for(Integer grp : queryGroup.keySet()){
                if(queryGroup.get(grp) != null){
                    List<String> childQueryList = queryGroup.get(grp);
                    // ==> Generate an single query of base object reocrd to fetch all child object table record in sinle query...
                    String mainReocrdQuery = 'SELECT Id, Name';
                    mainReocrdQuery += ', '+String.join(childQueryList, ',');
                    mainReocrdQuery += ' FROM '+sourceObjectAPI+' WHERE Id =: recordId LIMIT 1';
                    System.debug('queryGroup : '+ mainReocrdQuery);
                    sObject sourceObject = Database.query(mainReocrdQuery);
                    // ==> Strore sObject for ecch queryGroup to Avoid "twise relationship error"...
                    queryVSsObject.put(grp, sourceObject);
                }
                else{
                    // ==>>> If queryGroup doesn't have any child query... remove it from map....
                    // This happens when user have table with childRelation and objectApi but remove or doesn't have any child object field keys in table...
                    queryVSsObject.remove(grp);
                }
            }

            if(queryGroup.keySet().size() > 0){
                for(childTableInfo tableInfo : childTables){
                    String modifiedTableHTML = tableInfo.tableHTML; 
                    String keyRow = tableInfo.keyRow;
                    String infoRow = tableInfo.infoRow;
                    String childRelationshipName = tableInfo.childRelationshipName;
                    sObject sourceObject = queryVSsObject.get(tableInfo.queryGroup);
                    Object cr = sourceObject.getPopulatedFieldsAsMap().get(childRelationshipName);
                    
                    // ==> Type Casting : Object to List of Object..(for multiple child records)
                    String crString = JSON.serialize(cr);
                    List<Object> childRecords = (List<Object>) JSON.deserializeUntyped(crString);
                    
                    
                    if(childRecords != null){
                        List<String> childRecordRows = new List<String>();
                        for(Integer i = 0; i < childRecords.size(); i++){
                            String updatedKeyRow = keyRow;
                            // ==> Type Casting : Object to map of string & Object....(for single child records)
                            String cString = JSON.serialize(childRecords[i]);
                            map<string, Object> childrecord = (map<string, Object>) JSON.deserializeUntyped(cString);

                            for(String fieldKey : tableInfo.fieldKeysVSfieldApi.keySet()){
                                String fieldApi = tableInfo.fieldKeysVSfieldApi.get(fieldKey);
                                String fieldValue = (String) childrecord.get(fieldApi);
                                fieldValue = fieldValue != null ? fieldValue : '';
                                updatedKeyRow = updatedKeyRow.replace(fieldKey, fieldValue);
                            }

                            if(updatedKeyRow.contains(KeyMappingController.tableIndexKey)){              // KeyMappingController.tableIndexKey = {{No.Index}};
                                updatedKeyRow = updatedKeyRow.replace(KeyMappingController.tableIndexKey, String.valueOf(i+1));
                            }

                            childRecordRows.add(updatedKeyRow);
                        }
                        modifiedTableHTML = modifiedTableHTML.replace(keyRow, String.join(childRecordRows, ''));
                    }
                    else{
                        modifiedTableHTML = modifiedTableHTML.replace(keyRow, '');
                    }
                    modifiedTableHTML = modifiedTableHTML.replace(infoRow, '');
                    innerHTML = innerHTML.replace(tableInfo.tableHTML, modifiedTableHTML);
                }
            }

            return innerHTML;
        } catch (Exception e) {
            // Log_Handler.store_Exception(e, 'KeyMappingController', 'mappingChildObject');
            system.debug('exception in mappingChildObject : ' +  e.getMessage() +'\n'+ 'Line Number : ' + e.getLineNumber());
            return innerHTML;
        }
    }

    public static String mappingObjFieldsData(String innerHTML, String recordId, String sourceObjectAPI){
        try {

            Map<String, String> validFieldAPIvsFieldType = new Map<String, String>();

            // Collect all related Object's field to verify that matching key are field Api or not?
            list<KeyMappingController.MappingObjects> objectWithFields = KeyMappingController.getFieldMappingKeys(sourceObjectAPI, true).fieldMappingsWithObj;
            for(KeyMappingController.MappingObjects obj : objectWithFields){
                for(KeyMappingController.MappingFields field : obj.fieldMappings){
                    validFieldAPIvsFieldType.put(field.name, field.type);
                }
            }

            // Define a regular expression pattern to match placeholders..
            Pattern objMapPattern = Pattern.compile('\\{\\{\\'+KeyMappingController.mappingSymbol+'(..*?)\\}\\}');

            ExtractedMappings extractedFields = extractMappingKeys(innerHTML, validFieldAPIvsFieldType, objMapPattern);

            String fieldApiString = string.join(extractedFields.fieldApiList, ',');

            // Create Dynamic query and retrive object dynamically......
            String dynamicQuery = 'SELECT ' + fieldApiString + ' FROM ' + sourceObjectAPI + ' WHERE Id = \''+ recordId +'\' LIMIT 1';
            system.debug('dynamicQuery : '+dynamicQuery);

            sObject sobj = Database.query(dynamicQuery);

            String modifiedHTML = innerHTML;
            for(string mappingKey : extractedFields.mappingKEYvsName.keyset()){
                extractedFields.modifiedHTML = modifiedHTML;
                extractedFields.sobj = sobj;
                modifiedHTML = mapObjRecordValues(extractedFields, mappingKey);
            }

            return modifiedHTML;
        } catch (Exception e) {
            // Log_Handler.store_Exception(e, 'KeyMappingController', 'mappingObjFieldsData');
            system.debug('exception in mappingObjFieldsData : ' +  e.getMessage() +'\n'+ 'Line Number : ' + e.getLineNumber());
            return innerHTML;
        }
    }
    public static String mapObjRecordValues(ExtractedMappings extractedFields, String mappingKey){
        try {

            String fieldAPI = extractedFields.mappingKEYvsName.get(mappingKey);
            String fieldKey = mappingKey;
            String formatType = extractedFields.mappingKEYvsFormat.get(mappingKey);
            String fieldType = extractedFields.mappingKEYvsType.get(mappingKey);

            String fieldValue = '';
            String userTimeZone = (String)String.valueOf(UserInfo.getTimeZone().getID());

            if(fieldAPI.contains('.') == true){ //Means Related Object...
                String relationshipName = fieldAPI.substringBefore('.');
                String fieldName = fieldAPI.substringAfter('.');

                // Get Related sObject value as a "Object"...
                Object relatedObject = extractedFields.sobj.getPopulatedFieldsAsMap().get(relationshipName);
                // Convert sObject value's Obejct in JSON as we can not get data without string...
                // (here we have key as a string varibale not as a string)...
                String relatedObjectString = JSON.serialize(relatedObject);
                // Deseiralize Object as map of stirng and object so that we can fetch data based on map key...
                Map<String, Object> relatedObjectValue = (Map<String, Object>) JSON.deserializeUntyped(relatedObjectString);

                fieldValue = relatedObjectValue != null ? (String)String.valueOf(relatedObjectValue.get(fieldName)) : fieldValue;         // Get record Value From Sobject....
            }
            else{
                fieldValue = (String)String.valueOf(extractedFields.sobj.get(fieldAPI));         // Get record Value From Sobject....
            }

            if(formatType != null && fieldValue != '' && fieldValue != null){
                // field required formatting...
                switch on fieldType{
                    when 'DATETIME'{
                        fieldValue = formatDateTime(fieldValue, formatType);
                    }
                    when 'DATE'{
                        fieldValue = formatDateTime(fieldValue, formatType);
                    }
                    when 'BOOLEAN'{
                        fieldValue = formatBoolean(fieldValue, formatType);
                    }
                    when 'STRING'{
                        fieldValue = formatString(fieldValue, formatType);
                    }
                    when 'INTEGER'{
                        fieldValue = formatNumber(fieldValue, formatType);
                    }
                    when 'DOUBLE'{
                        fieldValue = formatNumber(fieldValue, formatType);
                    }
                    when 'CURRENCY'{
                        fieldValue = formatNumber(fieldValue, formatType);
                    }
                    when 'PERCENT'{
                        fieldValue = formatNumber(fieldValue, formatType);
                    }
                }
            }

            fieldValue = fieldValue != null ? fieldValue : '';
            extractedFields.modifiedHTML = extractedFields.modifiedHTML.replace(fieldKey, fieldValue);      // Replace Mapping field with record value.....
            
            return extractedFields.modifiedHTML;
        } catch (Exception e) {
            // Log_Handler.store_Exception(e, 'KeyMappingController', 'mapObjRecordValues');
            system.debug('exception in mapObjRecordValues : ' +  e.getMessage() +'\n'+ 'Line Number : ' + e.getLineNumber());
            System.debug('error to map key : '+ mappingKey);
            return extractedFields.modifiedHTML;
        }
    }
        // --- Source Object and Related Object field Mapping -- END ---

    public static string mappingGeneralFieldData(String innerHTML){
        try {

            Map<String, String> validFieldAPIvsFieldType = new Map<String, String>();

            // Collect all general field to verify that matching key are valid or not?
            list<KeyMappingController.MappingObjects> objectWithFields = KeyMappingController.getGeneralFields().fieldMappingsWithObj;
            for(KeyMappingController.MappingObjects obj : objectWithFields){
                for(KeyMappingController.MappingFields field : obj.fieldMappings){
                    validFieldAPIvsFieldType.put(field.name, field.type);
                }
            }

            // Define a regular expression pattern to match placeholders..
            Pattern generalFieldPattern = Pattern.compile('\\{\\{Doc\\.(..*?)\\}\\}');

            ExtractedMappings extractedFields = extractMappingKeys(innerHTML, validFieldAPIvsFieldType, generalFieldPattern);

            set<string> mappedDateField = new set<string>();
            set<string> mappedUserField = new set<string>();
            set<string> mappedOrgField = new set<string>();

            for(string mappingKey : extractedFields.mappingKEYvsName.keyset()){
                String mappingAPI = extractedFields.mappingKEYvsName.get(mappingKey);
                switch on mappingAPI.substringBefore('.'){
                    when 'Date'{
                        mappedDateField.add(mappingAPI.substringAfter('.'));
                    }
                    when 'User'{
                        mappedUserField.add(mappingAPI.substringAfter('.'));
                    }
                    when 'Org'{
                        mappedOrgField.add(mappingAPI.substringAfter('.'));
                    }
                }
            }

            sObject userObj;
            if(mappedUserField.size() > 0){
                String userId = UserInfo.getUserId();
                String fieldApiString = string.join(mappedUserField, ',');
                String dynamicQuery = 'SELECT ' + fieldApiString + ' FROM User WHERE Id = \''+ userId +'\' LIMIT 1';
                system.debug('dynamicQuery : '+dynamicQuery);

                userObj = Database.query(dynamicQuery);
            }

            sObject orgObj;
            if(mappedOrgField.size() > 0){
                String orgId = UserInfo.getOrganizationId();
                String fieldApiString = string.join(mappedOrgField, ',');
                String dynamicQuery = 'SELECT ' + fieldApiString + ' FROM Organization WHERE Id = \''+ orgId +'\' LIMIT 1';
                system.debug('dynamicQuery : '+dynamicQuery);

                orgObj = Database.query(dynamicQuery);
            }

            String modifiedHTML = innerHTML;
            for(string mappingKey : extractedFields.mappingKEYvsName.keyset()){
                extractedFields.modifiedHTML = modifiedHTML;
                String mappingAPI = extractedFields.mappingKEYvsName.get(mappingKey);
                switch on mappingAPI.substringBefore('.'){
                    when 'Date'{
                        extractedFields.sObj = null;
                        extractedFields.keyVSdata = KeyMappingController.dateFormats();
                    }
                    when 'User'{
                        extractedFields.sObj = userObj;
                        extractedFields.keyVSdata = null;
                    }
                    when 'Org'{
                        extractedFields.sObj = orgObj;
                        extractedFields.keyVSdata = null;
                    }
                }
                modifiedHTML = mapGeneralFieldNTempData(extractedFields, mappingKey);
            }

            return modifiedHTML;
        } catch (Exception e) {
            system.debug('exception in mappingGeneralFieldData : ' +  e.getMessage() +'\n'+ 'Line Number : ' + e.getLineNumber());
            return innerHTML;
        }
    }

    public static string mappingMergeTemplate(String innerHTML){
        try {

            Map<String, String> validFieldAPIvsFieldType = new Map<String, String>();

            list<Template__c> allTemps = [SELECT Id FROM Template__c WITH SECURITY_ENFORCED];
            if(allTemps.size() > 0){
                for(Template__c temp : allTemps){
                    validFieldAPIvsFieldType.put('Temp.'+ temp.Id, 'NONE');
                }
            }

            // Define a regular expression pattern to match placeholders..
            Pattern margeTempPattern = Pattern.compile('\\{\\{Doc\\.(..*?)\\}\\}');
            ExtractedMappings extractedFields = extractMappingKeys(innerHTML, validFieldAPIvsFieldType, margeTempPattern);

            set<string> mergeTempIds = new set<string>();

            for(string mappingKey : extractedFields.mappingKEYvsName.keyset()){
                String mappingAPI = extractedFields.mappingKEYvsName.get(mappingKey);
                if(mappingAPI.substringBefore('.') == 'Temp'){
                    mergeTempIds.add(mappingAPI.substringAfter('.'));
                }
            }

            map<String, String> tempIDvsTempData = new map<String, String>();
            if(mergeTempIds.size() > 0){
                list<Template__c> templatesToMerge = [SELECT Id, Template_Name__c, Template_Type__c, Template_Status__c,
                                        (SELECT Id, Name, Template__c, Template_Value_Simple__c, Order_No_Simple__c FROM Template_Data__r ORDER BY Order_No_Simple__c ASC )
                                        FROM Template__c WHERE Id IN: mergeTempIds WITH SECURITY_ENFORCED];

                if(templatesToMerge.size() > 0){
                    for(Template__c temp : templatesToMerge){
                        string tempValue = '';
                        if(temp.Template_Type__c == 'Simple Template' || temp.Template_Type__c == 'Google Doc Template'){
                            if(temp.Template_Status__c == true){
                                for(Template_Data__c tempData : temp.Template_Data__r){
                                    tempValue += tempData.Template_Value_Simple__c;
                                }
                            }
                            else{
                                tempValue = KeyMappingController.generalFieldkeys.replace('mappingKey', 'Temp.'+ temp.Id +' '+ KeyMappingController.formattingKeys.replace('formatKey', temp.Template_Name__c) +' <span style="color: red;"> -- Inactive Template -- </span>');
                            }
                            tempIDvsTempData.put(temp.Id, tempValue);

                        }
                        else if(temp.Template_Type__c == 'CSV Template'){
                            tempValue = KeyMappingController.generalFieldkeys.replace('mappingKey', 'Temp.'+ temp.Id +' '+ KeyMappingController.formattingKeys.replace('formatKey', temp.Template_Name__c) +' <span style="color: red;"> -- CSV Template Can not be merge -- </span>');
                            tempIDvsTempData.put(temp.Id, tempValue);
                        }

                    }
                }
            }

            String modifiedHTML = innerHTML;
            for(string mappingKey : extractedFields.mappingKEYvsName.keyset()){
                extractedFields.modifiedHTML = modifiedHTML;
                String mappingAPI = extractedFields.mappingKEYvsName.get(mappingKey);
                if(mappingAPI.substringBefore('.') == 'Temp'){
                    extractedFields.sObj = null;
                    extractedFields.keyVSdata = tempIDvsTempData;
                }

                modifiedHTML = mapGeneralFieldNTempData(extractedFields, mappingKey);
            }

            return modifiedHTML;

        } catch (Exception e) {
            system.debug('exception in mappingGeneralFieldData : ' +  e.getMessage() +'\n'+ 'Line Number : ' + e.getLineNumber());
            return innerHTML;
        }
    }

    public static string mappingSFimgWithBase64(String innerHTML){
        try {

            Set<String> sfImgIds = new Set<String>();                       // To Store Sf Image Ids (15 character ID)
            Set<String> sfImgSRC = new Set<String>();                       // TO Stror sf image URL(version Data URL)
            Map<String, String> idVSbase64 = new Map<String, String>();     // TO store base64 against Id to replace with image URL

            String orgDomain = URL.getOrgDomainURL().toExternalForm();
            String orgHost = orgDomain.substringBefore('.');
            
            // Define the regex pattern to match img tags and extract the src attribute
            // Using (?i) for case-insensitivity
            String imgTagPattern = '(?i)<img[^>]+src="([^"]+)"';
            Pattern pattern = Pattern.compile(imgTagPattern);

            // Create a matcher with the input string
            Matcher matcher = pattern.matcher(innerHTML);

            while (matcher.find()) {
                String imgSRC = matcher.group(1);

                // Check if the URL contains 'sfc/servlet.shepherd/version/download' 
                // AND
                // URL belogs to current org...
                if (imgSRC.contains('sfc/servlet.shepherd/version/download') && imgSRC.startsWith(orgHost)) {
                    sfImgIds.add(imgSRC.substringAfterLast('/'));
                    sfImgSRC.add(imgSRC);
                }
            }

            if(sfImgIds.size() > 0){
                // * NOTE : Do't add versionDataUrl field in SOQL, it will throw an intenrnal server error... 
                List<ContentVersion> sfImgs = [SELECT Id, VersionData FROM ContentVersion WHERE Id IN: sfImgIds AND IsLatest = true];
                if(sfImgs.size() > 0){
                    for(ContentVersion cv : sfImgs){
                        // 15 character Id vs (blob > base64 -> dataURL)
                        idVSbase64.put(string.valueOf(cv.Id).substring(0, 15), 'data:image/png;base64,' + EncodingUtil.base64Encode(cv.VersionData));
                    }
                }
            }

            if(idVSbase64.keySet().size() > 0){
                for(string src : sfImgSRC){
                    // extract id from contentVesrion SRC to get base64 SRC from map...
                    string cvId = src.substringAfterLast('/');      
                    // if base64 null, replace ContentVersion SRC with dummy image base64 SRC...
                    string base64 = idVSbase64.get(cvId) != null ? idVSbase64.get(cvId) : 'data:image/png;base64,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';
                    if(base64 != null){
                        innerHTML = innerHTML.replace(src, base64);
                    }
                }
            }

            return innerHTML; 
        } catch (Exception e) {
            system.debug('exception in mappingSFimgWithBase64 : ' +  e.getMessage() +'\n'+ 'Line Number : ' + e.getLineNumber());
            return innerHTML; 
        }
    }

    // -- Generic methods for mapping functionality ----
    public static ExtractedMappings extractMappingKeys(String innerHTML,  Map<String, String> validFieldAPIvsFieldType, Pattern pattern){
        ExtractedMappings extractedFields = new ExtractedMappings();
        try {            
            // Create a matcher with the input string
            Matcher matcher = pattern.matcher(innerHTML);
            
            set<string> fieldApiList = new set<String>();

            map<String, String> mappingKEYvsName = new map<String, String>();       // This mpa use to get field name by mappingKey...
            map<String, String> mappingKEYvsFormat = new map<String, String>();    // This mpa use to get field format by mappingKey...
            map<String, String> mappingKEYvsType = new map<String, String>();       // This mpa use to get field type by mappingKey...

            while (matcher.find()) {
                String fieldKey = matcher.group();
                String fieldAPI = matcher.group(1);      // Seperate Mapping Field Keyword from HTML String

                // Check fieldAPI inside mapping key is valid or not...
                if(validFieldAPIvsFieldType.get(fieldAPI) == null){
                    // if fieldType is null, it meanse Key is not vaild or key consist formatting key...

                    String fKey = fieldAPI.substringBetween('*');
                    if(fKey != null){
                        // fieldAPI Consist  string between *, it meanse fieldKey consist formatting key...
                        // ** here we need to check if formatting key in valid key or not .. pending ...

                        string formattingKey = '*'+fKey+'*';
                        string format = fKey;
                        string fAPI = fieldAPI.replace(formattingKey, '').trim();      // remove text with ** and space, we will find fieldAPI..

                        // after seperate formatKey... Again check fieldAPI inside mapping key is valid or not...
                        if(validFieldAPIvsFieldType.get(fAPI) != null){
                            fieldApiList.add(fAPI);
    
                            mappingKEYvsName.put(fieldKey,  fAPI);
                            mappingKEYvsFormat.put(fieldKey,  format);
                            mappingKEYvsType.put(fieldKey,  validFieldAPIvsFieldType.get(fAPI));
                        }
                    }

                }
                else{
                    // fieldAPI of mapping key is valid....
                    fieldApiList.add(fieldAPI);

                    mappingKEYvsName.put(fieldKey,  fieldAPI);
                    mappingKEYvsFormat.put(fieldKey,  null);
                    mappingKEYvsType.put(fieldKey,  validFieldAPIvsFieldType.get(fieldAPI));
                }
            }

            if(!fieldApiList.contains('Id')){
                fieldApiList.add('Id');
            }
            if(!fieldApiList.contains('Name')){
                fieldApiList.add('Name');
            }

            extractedFields.fieldApiList = new List<String>(fieldApiList);
            extractedFields.mappingKEYvsName = mappingKEYvsName;
            extractedFields.mappingKEYvsFormat = mappingKEYvsFormat;
            extractedFields.mappingKEYvsType = mappingKEYvsType;
            
            return extractedFields;
        } catch (Exception e) {
            system.debug('exception in extractMappingKeys : ' +  e.getMessage() +'\n'+ 'Line Number : ' + e.getLineNumber());
            return extractedFields;
        }
    }
    public static string mapGeneralFieldNTempData(ExtractedMappings extractedFields, String mappingKey){
        try {

            String mappingAPI = extractedFields.mappingKEYvsName.get(mappingKey);
            String fieldKey = mappingKey;
            String formatType = extractedFields.mappingKEYvsFormat.get(mappingKey);
            String fieldType = extractedFields.mappingKEYvsType.get(mappingKey);

            String fieldValue = '';

            String generalFieldType = mappingAPI.substringBefore('.');
            String fieldAPI = mappingAPI.substringAfter('.');

            if(generalFieldType == 'Date'){
                fieldValue = extractedFields.keyVSdata.get(fieldAPI).split('; ')[3];
            }
            else if(generalFieldType == 'User' || generalFieldType == 'Org'){
                if( extractedFields.sobj != null){
                    fieldValue = (String)String.valueOf(extractedFields.sobj.get(fieldAPI));         // Get record Value From Sobject....
                }
            }
            else if(generalFieldType == 'Temp'){
                fieldValue = extractedFields.keyVSdata.get(fieldAPI);
            }

            if(formatType != null && fieldValue != '' && fieldValue != null){
                // field required formatting...
                switch on fieldType{
                    when 'DATETIME'{
                        fieldValue = formatDateTime(fieldValue, formatType);
                    }
                    when 'DATE'{
                        fieldValue = formatDateTime(fieldValue, formatType);
                    }
                    when 'BOOLEAN'{
                        fieldValue = formatBoolean(fieldValue, formatType);
                    }
                    when 'STRING'{
                        fieldValue = formatString(fieldValue, formatType);
                    }
                    when 'INTEGER'{
                        fieldValue = formatNumber(fieldValue, formatType);
                    }
                    when 'DOUBLE'{
                        fieldValue = formatNumber(fieldValue, formatType);
                    }
                    when 'CURRENCY'{
                        fieldValue = formatNumber(fieldValue, formatType);
                    }
                    when 'PERCENT'{
                        fieldValue = formatNumber(fieldValue, formatType);
                    }
                }
            }

            if(fieldValue == null){
                fieldValue = '';
                extractedFields.modifiedHTML = extractedFields.modifiedHTML.replace(fieldKey, fieldValue);   // Replace Mapping field with record value.....
            }
            else{
                extractedFields.modifiedHTML = extractedFields.modifiedHTML.replace(fieldKey, fieldValue);   // Replace Mapping field with record value.....
            }

            return extractedFields.modifiedHTML;
        } catch (Exception e) {
            system.debug('exception in mappingGeneralFieldData : ' +  e.getMessage() +'\n'+ 'Line Number : ' + e.getLineNumber());
            return extractedFields.modifiedHTML;
        }
    }
    public static string formatDateTime(string fieldValue, string formatType){
        String userTimeZone = (String)String.valueOf(UserInfo.getTimeZone().getID());
        Datetime dt = Datetime.valueOfGMT(fieldValue);

        fieldValue = dt.format(formatType, userTimeZone);

        return fieldValue;
    }
    public static string formatBoolean(string fieldValue, string formatType){
        fieldValue = fieldValue == 'true' ? formatType.substringBefore('/') : formatType.substringAfter('/');

        return fieldValue;
    }
    public static string formatString(string fieldValue, string formatType){
        Integer endIndex = (Integer) Integer.valueOf(formatType.substringAfter('L:'));
        endIndex = endIndex > fieldValue.length() ? fieldValue.length() : endIndex;             // endIndex must be less than value string length...
        fieldValue = fieldValue.substring(0, endIndex);

        return fieldValue;
    }
    public static string formatNumber(string fieldValue, string formatType){
        Decimal val = (Decimal) Decimal.valueOf(fieldValue);
        String format = formatType.substringBetween('F:', ',');
        String decimalPlaces = formatType.substringBetween('dP:', ',');
        String roundMode = formatType.substringBetween('rM:', ',');

        if(decimalPlaces != null){
            if(roundMode != null){
                System.RoundingMode rM = System.RoundingMode.valueOf(roundMode);
                val = val.setScale(Integer.valueOf(decimalPlaces), rM);
            }
            else{
                val = val.setScale(Integer.valueOf(decimalPlaces));
            }
        }

        if(format == 'yes'){
            fieldValue = val.format();

            // Standard format() method remove decimal if user did't set any decimal places at time of field creation...
            // So, when decimalPlaces is not 0, add decimal from our end as per formatKey...
            if(decimalPlaces != null && decimalPlaces != '0'){
                string valStr = (String) String.valueOf(val);
                String decimalValue = (String) String.valueOf(valStr.substringAfter('.'));
                if(fieldValue.contains('.')){
                    // when fieldValue contains any decimals..., remove standard decimal palces and add custom decimal palces...
                    fieldValue = val.format().substringBefore('.') + '.'+ decimalValue;
                }
                else{
                    // when fieldValue not contains any decimals...
                    fieldValue = val.format() + '.'+ decimalValue;
                }
            }

        }
        else{
            fieldValue = String.valueOf(val);
        }

        return fieldValue;
    }
    // === ==== Replace mapping with actual data methods --- END ---- ==== ====

    public static Integer countIteration(List<String> listToCount, String stringToCount){
        return countIteration(listToCount, stringToCount, 0);
    }

    public static Integer countIteration(List<String> listToCount, String stringToCount, Integer previousCount){
        List<String> previousList = new List<String>(listToCount);
        if(previousList.contains(stringToCount)){
            previousCount ++;
            Integer index = previousList.indexOf(stringToCount);
            previousList.remove(index);
            return countIteration(previousList, stringToCount, previousCount);
        }
        else{
            return previousCount;
        }
    }


    public class ExtractedMappings{
        @AuraEnabled public List<string> fieldApiList;
        @AuraEnabled public map<String, String> mappingKEYvsName;
        @AuraEnabled public map<String, String> mappingKEYvsFormat;
        @AuraEnabled public map<String, String> mappingKEYvsType;
        @AuraEnabled public String modifiedHTML;
        @AuraEnabled public sObject sobj;
        @AuraEnabled public map<String, String> keyVSdata;
    }

    public class childTableInfo{
        @auraEnabled public String tableHTML;
        @AuraEnabled public String keyRow;
        @AuraEnabled public String infoRow;
        @AuraEnabled public String childRelationshipName;
        @AuraEnabled public Map<String,String> fieldKeysVSfieldApi;
        @AuraEnabled public Integer queryGroup;
    }

}