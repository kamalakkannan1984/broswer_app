/**
 * Presenter first pattern 
 * Login view and model connected here 
 * Alert is the common method for all the alert 
 * store all other common method are in common folder common file 
 * Validation seperate method 
 * @param  {} {this.View=newLoginView(
 * @param  {} ;this.Model=newLoginModel(
 * @param  {} ;this.View.initLogin(
 * @param  {} ;}init=(
 * @param  {} =>{letthat=this;letrem=RemPassword(
 * @param  {} ;rem&&this.View.RemPasswordView(rem
 * @param  {} ;this.View.addKeyPressUsername(function(event
 * @param  {event.which} {varkeycode=(event.keyCode?event.keyCode
 */
import LoginView from '../View/LoginView';
import {calcSHA1} from '../../Common/securesha1';
import {encryptCodes,ejabbordRegister} from './../Common/Common'
import LoginModel from '../Model/LoginModel';
import {RemPassword} from './RememberPwd'
export default class LoginPrenter {
  
    constructor()
    {
        const setting = {login:true, title:"Sign In",loginsetting:{username:{  
            id: 'username', 
            type: 'text',
            name: 'login-name',
            display: 'Email or Direct Number',
            maxlength:'64',
            style:"text-transform:lowercase",
            class:'form-control',
            tabindex:"0"
          },
          password:{
              id: 'password-field', 
              type: 'password',
              name: 'password',
              display: "Password",
              style:"text-transform:none",
              class:'form-control',
              maxlength:'18',
              tabindex:"1"
            }
        }}
       
        this.View = new LoginView(setting); // Create the object for View
         // create the object for model 
        this.View.initLogin(); // init login for append the login template method 
   
        
    }
    /* 
    *** Rempassword get from localstorage and display in control
    *** init function initiate on load event 
    */
    init=()=>{
        let that=this; // this stored in that for function scope 
        let rem = RemPassword(); // remember password retive from local storage 
        rem && this.View.RemPasswordView(rem); // Send remember object to View 
        
        //Key press event for password handler to trigger the login process 
       
        //Submit singin click handler for call login valdiation api module 
        this.View.addSubmitSignin(function(inputdata){
            
            (that.checkLogin(inputdata));
                    });
    
    //Submit singin click handler for call login valdiation api module 
    this.View.addKeyPressPass(function(inputdata){
        return(that.checkLogin(inputdata));
                });
                 
        }

        
        /**
         * @param  {} username
         * @param  {} password
         * @param  {} remChk
         * @param  {} remval
         */
        checkLogin({username,password,remChk,remval}){
            
           //Change to Submit to reset button 
            //this.View.ResetSubmitButton();
            // Model api call and call back resolve method 
        
            let __Model = new LoginModel();
            __Model.loginprocess(username,password).then((response)=>
			{
            localStorage.setItem('autologin',0);
            if (response[0].error_code == 0) 
            {
                this.View.apisucess(true);
                // Error code zero than get the all the response key and 
                // Create login details objects and set in local storage 
                localStorage.setItem('autologin',10); // autologin set to 10	
                localStorage.setItem('_candidate', this.username && username.replace(/[^A-Z0-9]/ig, ""));// Candidate set the usernaem 
                
                          
                var remember				=	{username:username, password: btoa(password), check:remChk}
                //store the remmber information to localstorage 
                localStorage.setItem('remember',JSON.stringify(remember));
                //Destructure the reponse object and add few new key 
                
                const { ext,cli,enetepriseid,dp_password,profile_url,customer_id,role_id,app_log_id,local_number,company_id,dir_user_id, domain_id,sip_password,Email,caller_id,sip_login_id,} = response[0];
                let logindetails = {
                 username: caller_id,
                 sip_userid: sip_login_id,
                 sip_password,
                 is_mail_verified:1,
                 mailverifieddate:'',
                 user_id:sip_login_id,
                 errcode:0,
                 errmsg:"success",
                 jid:	username.replace("@", "___"),
                 mailid: Email,
                 secure: 	calcSHA1(password),
                 profileUrl: profile_url || "",
                 dir_user_id,
                 domain_id,
                 ext,
                 cli,
                 caller_id,
                 company_id,
                 customer_id,
                 local_number,
                 app_log_id,
                 role_id,
                 chkbx: 	remval,
                 enetepriseid,
                 dp_password,
                 password:encryptCodes(password,'password'),
                 status:""
                };
                
                 localStorage.setItem('login',JSON.stringify(logindetails));
                 sessionStorage.setItem('login',JSON.stringify(logindetails));
                 window.ChatDomain				=	enetepriseid+'.unifiedring.co.uk';
                 //Chat server configuration setting 
                 ejabbordRegister(sip_login_id, sip_password);	
                 //LoginDetails to localstorage 
                
    
             } 
             else 
             {
                this.View.apisucess(false);
                
             }
            }).catch(e => console.error("Login Module Critical failure: " + e.message));
                 
        }


  
    }
   

