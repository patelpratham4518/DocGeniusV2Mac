import { LightningElement, track, wire } from 'lwc';
// import left_backimg from "@salesforce/resourceUrl/leftBackground";
// import right_backimg from "@salesforce/resourceUrl/rightBackground";

import homePageImgs from '@salesforce/resourceUrl/homePageImgs';
import DocGeniusLogo from "@salesforce/resourceUrl/docGeniusLogoSvg";
import integrationImages from "@salesforce/resourceUrl/integrationImages";
import Dropablearea from "@salesforce/resourceUrl/dropAreaBackground";
import authorizeGoogle from "@salesforce/apex/GoogleDriveAuthorizationController.authorizeGoogle";
import getAuthCode from "@salesforce/apex/GoogleDriveAuthorizationController.getAuthCode";
import dropboxRedirect from "@salesforce/apex/DropBoxAuthorizationController.redirectUrl";
import onedriveRedirect from "@salesforce/apex/OneDriveAuthorizationController.redirectUrl";
import Popupimg from "@salesforce/resourceUrl/popupImage";
import checkgoogleauth from "@salesforce/apex/GoogleDriveAuthorizationController.checkgoogleauth";
import checkawsauth from "@salesforce/apex/AwsAuthorizationController.checkawsauth"
import checkOneDriveAuth from "@salesforce/apex/OneDriveAuthorizationController.checkonedriveauth";
import checkDropBoxAuth from "@salesforce/apex/DropBoxAuthorizationController.checkdropboxauth";
import unauth from "@salesforce/apex/GoogleDriveAuthorizationController.unauthorize";
import awsunauth from "@salesforce/apex/AwsAuthorizationController.unauthorize";
import onedriveunauth from "@salesforce/apex/OneDriveAuthorizationController.unauthorize";
import dropboxunauth from "@salesforce/apex/DropBoxAuthorizationController.unauthorize";
import noconnection from "@salesforce/resourceUrl/noconnection";
import awsAuthorization from "@salesforce/apex/AwsAuthorizationController.authorize";
import oneDriveAuthorization from "@salesforce/apex/OneDriveAuthorizationController.authorize";
import dropboxAuthorization from "@salesforce/apex/DropBoxAuthorizationController.authorize"
import { NavigationMixin } from 'lightning/navigation';



export default class IntegrationDashborad extends NavigationMixin(LightningElement) {

    bgimg;
    logo;
    dropable;
    popupimg;
    greenColor = '#14AD00';
    lightGreenColor = '#93E7AE';
    isGreen = true;
    isRed = true;
    redColor = '#E43232';
    lightRedColor = '#FFD2D2';
    nointegration = noconnection;

    @track loadedResources = 0;
    @track ispopup = false;
    @track isAws = false;
    @track isGoogle = false;
    @track isDropBox = false;
    @track isOneDrive = false;
    @track draggedkey;
    @track authcode;
    @track clientId;
    @track clientSecret;
    @track email;
    @track bucket;
    @track nickname;
    @track redirectUri;
    @track isIntegration = true;
    @track isLimitations = false;
    @track isUserguide = false;
    //to display status bar
    @track isActiveGoogleAuth ;
    @track isActiveDropboxAuth ;
    @track isActiveOnedriveAuth ;
    @track isActiveAwsAuth ;
    //used for active and inactive
    @track isWorkingGoogleAuth = false;
    @track isWorkingDropboxAuth = false;
    @track isWorkingOnedriveAuth = false;
    @track isWorkingAwsAuth = false;
    //usedfordisplayinggoogledata
    @track googlename;
    @track googlelinkdate;
    @track googleemail;
    //usedfordisplayingawsdata
    @track awslinkdate;
    @track awsbucket;
    @track awsNickname;
    //usedfordisplayingonedrivedata
    @track onedrivename;
    @track onedriveemail;
    @track onedrivelinkdate;
    //usedfordisplayingdropboxdata
    @track dropboxname;
    @track dropboxemail;
    @track dropboxlinkdate;
    @track isSpinner = true;
    @track invoke; //used to track who called the popup
    @track startchat = true;


    get googledrive_(){
        return integrationImages + '/googleDrive.png';
    }

    get onedrive_(){
        return integrationImages + '/oneDrive.png';
    }

    get dropbox_(){
        return integrationImages + '/dropbox.png';
    }

    get aws_(){
        return integrationImages + '/aws.png';
    }

    
    connectedCallback() {
        this.bgimg = homePageImgs + '/HomBg.png';
        // this.rightimg = homePageImgs + '/HomBg.png';
        this.logo = DocGeniusLogo;
        this.dropable = Dropablearea;
        this.popupimg = Popupimg;
        this.blinktimer();
        this.checkinggoogleauth();
        this.checkingawsauth();
        this.checkingonedriveauth();
        this.checkingdropboxauth();
        // setTimeout(() => {
        //     console.log(this.loadedResources);
        //     if(this.loadedResources == 8){
        //     this.isSpinner = false;
        //     }
        // }, 1000);
    }


    blinktimer(){
        setInterval(() => {
            let workingMethods = 0;
            let nonWorkingMethods = 0;

            if (this.isWorkingGoogleAuth && this.isActiveGoogleAuth) workingMethods++;
            if (this.isWorkingAwsAuth && this.isActiveAwsAuth) workingMethods++;
            if (this.isWorkingOnedriveAuth && this.isActiveOnedriveAuth) workingMethods++;
            if (this.isWorkingDropboxAuth && this.isActiveDropboxAuth) workingMethods++;
            if (!this.isWorkingGoogleAuth && this.isActiveGoogleAuth) nonWorkingMethods++;
            if (!this.isWorkingAwsAuth && this.isActiveAwsAuth) nonWorkingMethods++;
            if (!this.isWorkingOnedriveAuth && this.isActiveOnedriveAuth) nonWorkingMethods++;
            if (!this.isWorkingDropboxAuth && this.isActiveDropboxAuth) nonWorkingMethods++;
            if (workingMethods > 0) {
                this.toggleGreenColor();
            }
            if(nonWorkingMethods > 0){
                this.toggleRedColor();
            }
            
        }, 1000);
    }

    // loadingResource(){

    // }

    toggleGreenColor(){
        this.isGreen = !this.isGreen;
    }
    toggleRedColor(){
        this.isRed = !this.isRed;
    }

    get boxStyle() {
        return `background-color: ${this.isGreen ? this.greenColor : this.lightGreenColor}`;
    }

    get redBoxStyle() {
        return `background-color: ${this.isRed ? this.redColor : this.lightRedColor}`;
    }

    renderedCallback() {
        if(this.isIntegration){
            this.template.querySelector('.text1').style.backgroundColor = "white";
        }
    }

    checkinggoogleauth(){
        checkgoogleauth()
        .then(result =>{
            this.displaydetails(result, 'google', 'gc');
            this.loaded();
        })
    }

    loaded(){
        this.loadedResources++;
        console.log(this.loadedResources);
        if(this.loadedResources == 8){
            this.isSpinner = false;
        }
    }


    checkingawsauth(){
        checkawsauth()
        .then(result =>{
            if(result.bucket != null  && result.linkdate != null && result.name !=null){
                // console.log(parseInt(result.bucket.length));
                // console.log(result.name);
                // console.log(result.email.length);
                
                this.awsNickname = result.name;
                this.awsbucket = result.bucket;
                this.isWorkingAwsAuth = result.active;
                this.awslinkdate = result.linkdate;
                // this.template.querySelector('.ac').style.opacity = '0.5';
                const awsimg = this.template.querySelector('.ac img');
                awsimg.style.opacity = '0.5';
                const awsintegration = this.template.querySelector('.ac');
                awsintegration.removeAttribute('draggable');
                this.isActiveAwsAuth = true;
            }
            else{
                this.isActiveAwsAuth = false;
                // this.template.querySelector('.ac').style.opacity = '1';
                const awsimg = this.template.querySelector('.ac img');
                awsimg.style.opacity = '1';
                const awsintegration = this.template.querySelector('.ac');
                awsintegration.setAttribute('draggable', 'true');
            }
            this.loaded();
        })
    }

    
    checkingonedriveauth(){
        checkOneDriveAuth()
        .then(result =>{
            this.displaydetails(result, 'onedrive', 'oc')
            this.loaded();
        })
    }

    checkingdropboxauth(){
        checkDropBoxAuth()
        .then(result =>{
            this.displaydetails(result, 'dropbox', 'dc')
            this.loaded();
        })
    }

    displaydetails(result, integrationname, cssname){
        if(result.name != null && result.linkdate != null && result.email != null) {
            if(result.name != null){
                this[integrationname + 'name'] = result.name;
            }
                this[integrationname + 'email'] = result.email;
            if(integrationname == 'dropbox'){
                this.isWorkingDropboxAuth = result.active;
                this.isActiveDropboxAuth = true;
            }
            else if(integrationname == 'onedrive'){
                this.isWorkingOnedriveAuth = result.active;
                this.isActiveOnedriveAuth = true;
            }
            else if(integrationname == 'google'){
                this.isWorkingGoogleAuth = result.active;
                this.isActiveGoogleAuth = true;

            }
            this[integrationname + 'linkdate'] = result.linkdate;
            // this.template.querySelector('.'+cssname).style.opacity = '0.5';
            const integrationimg = this.template.querySelector('.'+cssname + ' img');
            integrationimg.style.opacity = '0.5';
            const integrations = this.template.querySelector('.'+cssname);
            integrations.removeAttribute('draggable');
        }
        else{
            if(integrationname == 'dropbox'){
                this.isActiveDropboxAuth = false;
            }
            else if(integrationname == 'onedrive'){
                this.isActiveOnedriveAuth = false;
            }
            else if(integrationname == 'google'){
                this.isActiveGoogleAuth = false;

            }
            // this.template.querySelector('.'+cssname).style.opacity = '1';
            const integrationimg = this.template.querySelector('.'+cssname + ' img');
            integrationimg.style.opacity = '1';
            const integrations = this.template.querySelector('.'+cssname);
            integrations.setAttribute('draggable', 'true');
        }
    }
    

    // fetchgoogledredirecturi(){
    //     googleDriveRedirect()
    //     .then(result =>{
    //         this.redirectUri = result;
    //         this.ispopup = true;
    //     });
    // }

    fetchdropboxredirecturi(){
        dropboxRedirect()
        .then(result =>{
            this.redirectUri = result;
            this.ispopup = true;
        });
    }

    fetchonedriveredirecturi(){
        onedriveRedirect()
        .then(result =>{
            this.redirectUri = result;
            this.ispopup = true;
        });
    }

    

    handleDragStart(event){
        const key = event.target.dataset.key;
        event.dataTransfer.setData('key', key);
        console.log(key);
        this.template.querySelector('.dragbackground').style.opacity = '0.5';
        this.template.querySelector('.dropandstatus').style.opacity = '0.5';

    }

    handleDragOver(event){
        event.preventDefault();
    }

    handleNickname(event){
        this.nickname = event.target.value.trim();
        console.log(this.nickname);
    }


    handledDrop(event){
        console.log('handledDrop Invoked');
        this.template.querySelector('.dragbackground').style.opacity = '1';
        this.draggedkey = event.dataTransfer.getData('key');
        this.isSpinner = true;
        if(this.draggedkey == 'aws'){
            this.isAws = true;
            this.ispopup = true;
        }
        else if(this.draggedkey == 'onedrive'){
            this.fetchonedriveredirecturi();
            this.isOneDrive = true;
            
        }
        else if(this.draggedkey == 'google'){
            // this.fetchgoogledredirecturi();
            this.clientId = '1074472660019-o1k9el6u5qfl1ct0nnvi4j3r78mterf8.apps.googleusercontent.com';
            this.clientSecret = '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';
            this.isGoogle = true;
            this.ispopup = true;
        }
        else if(this.draggedkey == 'dropbox'){
            this.fetchdropboxredirecturi();
            this.isDropBox = true;
        }
        else{
            this.isSpinner = false;
            this.ispopup = false;
        }
    }

    // hideModalBox(){
    //     this.isSpinner = true;
    //     this.ispopup = false;
    //     this.isAws = false;
    //     this.isOneDrive = false;
    //     this.isGoogle = false;
    //     this.isDropBox = false;
    //     this.isSpinner = false;
    //     this.clientId = null;
    //     this.clientSecret = null;
    //     this.bucket = null;
    //     this.nickname = null;
    // }

    closeSpinner(){
        this.isSpinner = false;
    }

    handleDragEnd(event) {
        event.preventDefault();
        this.template.querySelector('.dragbackground').style.opacity = '1';
        this.template.querySelector('.dropandstatus').style.opacity = '1';
    }

    handleClientId(event) {
        this.clientId = event.target.value.trim();
        console.log(this.clientId);
    }

    handleClientSecret(event) {
        this.clientSecret = event.target.value.trim();
        console.log(this.clientSecret);
    }

    // handleEmail(event){
    //     this.email = event.target.value.trim();
    //     console.log(this.email);
    // }

    handleBucket(event){
        this.bucket = event.target.value.trim();
        console.log(this.bucket);
    }

    handleIntegration(){
        this.isSpinner = true;
        this.isIntegration = true;
        this.isLimitations = false;
        this.isUserguide = false;
        this.template.querySelector('.text1').style.backgroundColor = "white";
        this.template.querySelector('.text2').style.backgroundColor = "";
        this.template.querySelector('.text3').style.backgroundColor = "";
        this.isSpinner = false;
    }

    copyToClipboard() {
        this.isSpinner = true;
        console.log('Invoked clipboard');
        var copyText = this.template.querySelector(".clipboard");
        console.log(copyText);
        copyText.select();
        copyText.setSelectionRange(0, 99999); // For mobile devices
        navigator.clipboard.writeText(copyText.value);
        copyText.setSelectionRange(0, 0); // For mobile devices
        this.isSpinner = false;
    }

    handleGoogleAuthorization(){
        try{
        if (!this.authcode) {
            console.log('All details are compulsory');
            return;
        }
        else{
            console.log('going for integration');
            authorizeGoogle({ authcode: this.authcode })
            .then(result =>{
                if(result === 'success'){
                    console.log('success');
                    const messageContainer = this.template.querySelector('c-message-popup')
                    messageContainer.showMessageToast({
                        status: 'success',
                        title: 'Success',
                        message : 'Successfully connected to Google Drive',
                    });
                    
                }
                else{
                    console.log('error');
                    const messageContainer = this.template.querySelector('c-message-popup')
                    messageContainer.showMessageToast({
                        status: 'error',
                        title: 'error',
                        message : 'Error connecting to Google Drive',
                    });
                    }
                })
            }
        }
        
        catch(error){
            console.log(error.getMessage);
            console.error('this is error'+JSON.stringify(error));
        }
    }
    


    handleAuthCode(event) {
        console.log('inside parent');
        if(!this.clientId || !this.clientSecret){
            console.log('both client id and secret are compulsary');
        }
        else{
            getAuthCode({ clientId: this.clientId, clientSecret: this.clientSecret})
            .then(durl =>{
                window.open(durl, '_blank');
            })
            .catch(error =>{
                console.error('Error:', error);
            })
        }
    //     const inputs = this.template.querySelectorAll('input');
    //     inputs.forEach(input =>{
    //         if(input.value == null || input.value == ''){
    //             input.classList.add('error-border');
    //         }
    //         else{
    //             input.classList.remove('error-border');
    //         }
    //     })
    //     if (!this.clientId || !this.clientSecret) {
    //         console.log('both client id and secret are compulsary');
    //         return;
    //     }
    //     else{
    //     console.log('Going for authorization');
    //     this.ispopup = false;
    //     this.isGoogle = false;
    //     googleDriveAuthorization({clientId: this.clientId, clientSecret: this.clientSecret})
    //     .then(durl => {
    //         // Navigate to the authorization URL
    //         // const windowWidth = 500;
    //         // const windowHeight = 600;
    //         // const screenWidth = window.screen.width;
    //         // const screenHeight = window.screen.height;
    //         // const left = Math.max(0, (screenWidth - windowWidth) / 2);
    //         // const top = Math.max(0, (screenHeight - windowHeight) / 2);

    //         window.location.href = durl;

    //         // this[NavigationMixin.Navigate]({
    //         //     type: 'standard__webPage',
    //         //     attributes: {
    //         //         url: durl
    //         //     }
    //         // }
    //         // );

    //         // Open a new window with the authorization URL
    //         // const newWindow = window.open(durl, '_blank', `width=${windowWidth},height=${windowHeight},left=${left},top=${top},scrollbars=yes,resizable=yes`);

    //         // Focus the new window
    //         // if (newWindow) {
    //         //     newWindow.focus();
    //         // }
        
    //         // window.setTimeout(function(){
    //         //     console.log('this is location-->'+newWindow.location.href);
    //         // },2000);
        
    //     })
    //     .catch(error => {
    //         console.error('Error:', error);
    //     });
    //     this.clientId = '';
    //     this.clientSecret = '';
    //     }
    }

    handleAwsAuthorization(){
        const inputs = this.template.querySelectorAll('input');
        inputs.forEach(input =>{
            if(input.value.trim() == null || input.value.trim() == ''){
                input.classList.add('error-border');
            }
            else{
                input.classList.remove('error-border');
            }
        })
        if (!this.clientId || !this.clientSecret || !this.bucket) {
            console.log('All details are compulsory');
            return;
        }
        else{
            this.ispopup = false;
            this.isAws = false;
            awsAuthorization({ clientId: this.clientId, clientSecret: this.clientSecret, bucket: this.bucket, awsNickname: this.nickname })
            .then(result =>{
                console.log(result);
                if(result === 'Success'){
                const messageContainer = this.template.querySelector('c-message-popup')
                    messageContainer.showMessageToast({
                        status: 'success',
                        title: 'Integration successfull',
                        message : 'Aws integration successful',
                        duration : 5000
                    });
                    this.checkingawsauth();
                }
                else{
                    const messageContainer = this.template.querySelector('c-message-popup')
                    messageContainer.showMessageToast({
                        status: 'error',
                        title: 'Integration failed',
                        message : 'Aws details are wrong',
                        duration : 5000
                    });
                }
            });  
            this.bucket = '';
            this.clientId = '';
            this.clientSecret = '';
            this.nickname = '';
    }
}

    unauthorize(event) {
        // this.invoke = event.target.dataset.key;
        console.log(event.target.dataset.key);
        this.invoke = event.target.dataset.key;
        console.log(this.invoke);
        const messageContainer = this.template.querySelector('c-message-popup')
                messageContainer.showMessagePopup({
                        status: 'Warning',
                        title: 'Confirm',
                        message : 'Are you sure you want to delete integration',
                    });
        
        console.log('something will happen');
    }

    handleConfimation(event){
        console.log(event.detail);
        console.log(this.invoke);
        if(event.detail == true && this.invoke =='google'){
            this.isSpinner = true;
            unauth()
            .then(result =>{
                console.log(result);
                if(result){
                    const messageContainer = this.template.querySelector('c-message-popup')
                    messageContainer.showMessageToast({
                        status: 'success',
                        title: 'Deleted Successfully',
                        message : 'Google Drive Integration deleted Successfully',
                        duration : 5000
                    });
                    console.log('inside');
                    this.isActiveGoogleAuth = false;
                    this.checkinggoogleauth();
                    
                }
            })
        
        this.isSpinner = false;
        }
        else if(event.detail == true && this.invoke =='aws'){
            this.isSpinner = true;
            awsunauth()
            .then(result =>{
                console.log(result);
                if(result){
                    const messageContainer = this.template.querySelector('c-message-popup')
                    messageContainer.showMessageToast({
                        status: 'success',
                        title: 'Deleted successfully',
                        message : 'Aws integration deleted successfully',
                        duration : 5000
                    });
                    console.log('inside');
                    this.isActiveAwsAuth = false;
                    this.checkingawsauth();
                }
            })
        
        this.isSpinner = false;
        }
        else if(event.detail == true && this.invoke =='onedrive'){
            this.isSpinner = true;
            onedriveunauth()
            .then(result =>{
                console.log(result);
                if(result){
                    const messageContainer = this.template.querySelector('c-message-popup')
                    messageContainer.showMessageToast({
                        status: 'success',
                        title: 'Deleted successfully',
                        message : 'Onedrive integration deleted successfully',
                        duration : 5000
                    });
                    console.log('inside');
                    this.isActiveOnedriveAuth = false;
                    this.checkingonedriveauth();
                }
            })
        
        this.isSpinner = false;
        }
        else if(event.detail == true && this.invoke =='dropbox'){
            this.isSpinner = true;
            dropboxunauth()
            .then(result =>{
                console.log(result);
                if(result){
                    const messageContainer = this.template.querySelector('c-message-popup')
                    messageContainer.showMessageToast({
                        status: 'success',
                        title: 'Deleted successfully',
                        message : 'dropbox integration deleted successfully',
                        duration : 5000
                    });
                    console.log('inside');
                    this.isActiveDropboxAuth = false;
                    this.checkingdropboxauth();
                }
            })
        
        this.isSpinner = false;
        }
        
    }

    handleOneDriveAuthorization(){
        const inputs = this.template.querySelectorAll('input');
        inputs.forEach(input =>{
            if(input.value == null || input.value == ''){
                input.classList.add('error-border');
            }
            else{
                input.classList.remove('error-border');
            }
        })
        if (!this.clientId || !this.clientSecret) {
            console.log('both client id and secret are compulsary');
            return;
        }
        else{
        console.log('Going for authorization');
        this.ispopup = false;
        this.isOneDrive = false;
        oneDriveAuthorization({clientId: this.clientId, clientSecret: this.clientSecret})
        .then(durl => {

            window.location.href = durl;

            // Navigate to the authorization URL
            // const windowWidth = 500;
            // const windowHeight = 600;
            // const screenWidth = window.screen.width;
            // const screenHeight = window.screen.height;
            // const left = Math.max(0, (screenWidth - windowWidth) / 2);
            // const top = Math.max(0, (screenHeight - windowHeight) / 2);

            // // Open a new window with the authorization URL
            // const newWindow = window.open(durl, '_blank', `width=${windowWidth},height=${windowHeight},left=${left},top=${top},scrollbars=yes,resizable=yes`);

            // // Focus the new window
            // if (newWindow) {
            //     newWindow.focus();
            // }
        
            // window.setTimeout(function(){
            //     console.log('this is location-->'+newWindow.location.href);
            // },1000);
        
        })
        .catch(error => {
            console.error('Error:', error);
        });
        this.clientId = '';
        this.clientSecret = '';
        }
    }

    handleDropboxAuthorization() {
        const inputs = this.template.querySelectorAll('input');
        inputs.forEach(input =>{
            if(input.value == null || input.value == ''){
                input.classList.add('error-border');
            }
            else{
                input.classList.remove('error-border');
            }
        })
        if (!this.clientId || !this.clientSecret) {
            console.log('both client id and secret are compulsary');
            return;
        }
        else{
        console.log('Going for authorization');
        this.ispopup = false;
        this.isDropBox = false;
        dropboxAuthorization({clientId: this.clientId, clientSecret: this.clientSecret})
        .then(durl => {

            window.location.href = durl;

            // Navigate to the authorization URL
            // const windowWidth = 500;
            // const windowHeight = 600;
            // const screenWidth = window.screen.width;
            // const screenHeight = window.screen.height;
            // const left = Math.max(0, (screenWidth - windowWidth) / 2);
            // const top = Math.max(0, (screenHeight - windowHeight) / 2);

            // // Open a new window with the authorization URL
            // const newWindow = window.open(durl, '_blank', `width=${windowWidth},height=${windowHeight},left=${left},top=${top},scrollbars=yes,resizable=yes`);

            // // Focus the new window
            // if (newWindow) {
            //     newWindow.focus();
            // }
        
            // window.setTimeout(function(){
            //     console.log('this is location-->'+newWindow.location.href);
            // },2000);
        
        })
        .catch(error => {
            console.error('Error:', error);
        });
        this.clientId = '';
        this.clientSecret = '';
        }
    }

    authorizeremaining() {
        const messageContainer = this.template.querySelector('c-message-popup')
            messageContainer.showMessagePopup({
                        status: 'info',
                        title: 'Under Construction',
                        message : 'Page Under Construction',
                    });
    }

    // *********************************************************
    // @Method Name    : openChatBot & updateChatStatus
    // @author         : Tirth Shah
    // @description    : Method is used to open chatbot
    // @param          :
    // @return         : 
    // ********************************************************

    openChatBot(){
        // if(this.startchat){
        //     this.startchat = false;
        //     const CHATPOPUP = this.template.querySelector('c-chat-bot');
        //     CHATPOPUP.togglePopup();
        //     console.log('chat bot called');
        // }
        // else{
        //     console.log(this.startchat);
        // }
    }

    updateChatStatus(event){
        console.log(event.detail.message);
        setTimeout(()=>{
            this.startchat = event.detail.message
        },1000)
        console.log(this.startchat);
    }

    // ************Chatbot method End*******************

    closeCreateTemplate(event){
        this.ispopup = false
        this.isAws = false;
        this.isOneDrive = false;
        this.isGoogle = false;
        this.isDropBox = false;
        this.isSpinner = false;
        this.clientId = null;
        this.clientSecret = null;
        this.bucket = null;
        this.nickname = null;
    }

    handleAfterSave(event){
        console.log('parent1');
        this.ispopup = false
        const { clientId, clientSecret, bucket, nickname, draggedkey, authcode } = event.detail;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.bucket = bucket;
        this.nickname = nickname;
        this.draggedkey = draggedkey; 
        this.authcode = authcode; 
        if(this.isAws){
            console.log('1');
            this.handleAwsAuthorization();
        } 
        else if(this.isGoogle){
            console.log('2');
            this.handleGoogleAuthorization();
        } 
        else if(this.isDropBox){
            console.log('3');
            this.handleDropboxAuthorization();
        } 
        else if(this.isOneDrive){
            console.log('4');
            this.handleOneDriveAuthorization();
        } 
        
    }
}