trigger PreventFAQFieldChange on ChatBotData__c (before update) {
    chatBotChats__c settings = chatBotChats__c.getInstance();
    Boolean allowupdate = settings != null ? settings.Enable_storage__c : false;

    if(!allowupdate){
        for (ChatBotData__c record : Trigger.new){
            ChatBotData__c oldRecord = Trigger.oldMap.get(record.Id);

            if (record.Chats__c != oldRecord.Chats__c){
                record.Chats__c.addError('This field cannot be changed manually');
            }
        }
    }
}