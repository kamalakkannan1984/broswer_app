/**
 * MVP design pattern 
 * login flag is false for show forgot view 
 * Login.hbs template file for login page 
 * domManpulation for few dom manpulation functionality
 * EventListerner module used to bind the event listerner for the elements
 * LoginPrsenter module used to handler funtionality available in this module
 * Below is the costructor param 
 * @param  {false}} {this.loginWindow=loginTemplate({login
 */
import loginTemplate from '../../Template/Login/login.hbs';
import {GetDom} from '../../helpers/domManpulation';
import {EventListerner} from '../../helpers/EventListerners';
import LoginPrsenter  from '../Presenter/LoginPresenter';
// Forgot password screen update class
export default class ForgotPwdView {
constructor (setting)
{
    //Following variable entire DOM element stored here with flag false
    this.loginWindow = loginTemplate(setting);
    
}
/*
Forgot window appended in the login page
*/

 initForgotpwd() {

  
  $('.login-bg').empty().append(this.loginWindow);
  
    this.forgotpasswordWindow = GetDom('.login-bg');
    //Following method for add event lissterner for back to login functionality
    // Redirect to login page module
      EventListerner('.forgot-screen',".backtologin","click",function(event){
       let LV = new LoginPrsenter (); 
         LV.init();
     })
} 
 
 //AddResetPassword event listerner with handler functions define in presenter 
 /**
  * @param  {} handler
  * @param  {} {EventListerner('.login-bg'
  * @param  {} "#next4"
  * @param  {} 'click'
  * @param  {} handler
  */
 addResetPassword(handler)
 {
   
      $('.forgot-screen').on('click',"#next4",handler)
 
 }
 //Keypress events for email text box when user press enter key
 // trigger the reset functionality 
 
 /**
  * @param  {} handler
  * @param  {} {EventListerner('.login-bg'
  * @param  {} "#pwd_signup_address"
  * @param  {} 'keypress'
  * @param  {} handler
  */
 addKeypressemail(handler)
 {
    
  $('#pwd_signup_address').focusin(function(){
    $('.signinerr').attr('style', 'display:none');
  })
        $('.forgot-screen').on('keypress',"#pwd_signup_address",handler);

 }

}   