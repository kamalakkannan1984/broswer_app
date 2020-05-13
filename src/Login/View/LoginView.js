/**
 * MVP design pattern 
 * Presenter first design patttern 
 * View and Model initanate from Presenter 
 * @param  {true}} {this.loginWindow=loginTemplate({login
 */

// Following method in helpers function for dom manupulation 
// eventlisterner method used to add the event listerner. 
// LoginTemplate for load the login template
// ForgotPresent initiate the forgot password page.   
import {
  GetDom
} from '../../helpers/domManpulation';
import {
  EventListerner
} from '../../helpers/EventListerners';
import loginTemplate from '../../Template/Login/login.hbs';
import ForgotPresent from './../Presenter/ForgotPresenter'
import {
  isValidEmailAddress
} from './../Common/Validation';
import h1comp from '../../Template/Login/h1component.hbs';
import Alert from '../../Utils/Alert';
//This class is the first process for all the application follow. 
export default class LoginView {

  constructor(setting) {

    this.loginWindow = loginTemplate(setting);

  }

  //initLogin method used to append the loging template in the index.html 
  initLogin() {

    $('.login-bg').empty().append(this.loginWindow);
    this.LoginWindow = GetDom('.login-screen');

    //Following forgotpwd event for initiate the forgotpassword page
    /**
     * @param  {} '.login-screen'
     * @param  {} ".forgotpwd"
     * @param  {} "click"
     * @param  {} function(event
     * @param  {} {letFP=newForgotPresent(
     * @param  {} ;FP.init(
     * @param  {} ;}
     */
    $('.login-screen').on("click", ".forgotpwd", function (event) {
      let FP = new ForgotPresent();
      FP.init();
    })

    /*
     ** Key press event for username textbox
     */



    /*
     * Add event listerner for Toggle Password 
     */

    EventListerner(".login-screen", "#show_hide_password span", "click", function (event) {
      event.preventDefault();
      $('.signinerr').attr('style', 'display:none');
      if ($('#show_hide_password input').attr("type") == "text") {
        $('#show_hide_password input').attr('type', 'password');
        $('#show_hide_password span').addClass("icon_hide_password");
        $('#show_hide_password span').removeClass("icon_show_password");
      } else if ($('#show_hide_password input').attr("type") == "password") {
        $('#show_hide_password input').attr('type', 'text');
        $('#show_hide_password span').removeClass("icon_hide_password");
        $('#show_hide_password span').addClass("icon_show_password");
      }

    })

  }
  /**
   * @param  {} {return$("#username"
   * @param  {} .val(
   * @param  {} };getpassword(
   * @param  {} {return$("#password-field"
   * @param  {} .val(
   * @param  {} };getremChk(
   * @param  {} {return$('#remember_me'
   * @param  {checked"} .is("
   */
  // following are getter for username, password, remeber check, remeber value

  get inputFields() {
    return {
      username: $("#username").val(),
      password: $("#password-field").val(),
      remChk: $('#remember_me').is(":checked"),
      remVal: $('#remember_me').val()
    }
  }



  /*
   ** Signin button event handler
   */
  addSubmitSignin(handler) {
    let that = this;
    $(".login-screen").on("click", "#submitsignin", function (event) {
      $('.signinerr').attr('style', 'display:none');
      that.CallPresenterHandler(handler);
    });
  }


  /*
   ** Key press event for Password textbox
   */
  addKeyPressPass(handler) {
    let that = this;
    EventListerner('.login-screen', "#password-field", "keypress", function (event) {
      
      var keycode = (event.keyCode ? event.keyCode : event.which);
      if (keycode == '13') {
        that.CallPresenterHandler(handler);
      }
    })
    $('#password-field').focusin(function(){
      $('.signinerr').attr('style', 'display:none');
    })  
    
    EventListerner('.login-screen', "#username", "keypress", function (event) {
      $('.signinerr').attr('style', 'display:none');
      var keycode = (event.keyCode ? event.keyCode : event.which);
      if (keycode == '13') {
        $('#password-field').focus();
      }
    });
    $('#username').focusin(function(){
      $('.signinerr').attr('style', 'display:none');
    }) 
  }
  /*
   **** Remember Password event 
   */
  RemPasswordView(login) {
    $('.signinerr').attr('style', 'display:none');
    $('#username').val(login.username);
    $('#password-field').val(atob(login.password));
    $('#password-field').focus();
    $('#remember_me').attr("checked", true);
  }


  /*
   ** API Sucess call back function 
   */
  apisucess(value) {
    if (!value) {

      $('.loadersimg').hide(300); // Preload hide
      //new Alert('#AlertBoxWin',"Your username or password is wrong!");                
      $('.signinerr').attr('style', 'display:block');
      $('signerr-msg').text("Your username or password is wrong!");

    } else {
      if (window.loggedSuccess) window.loggedSuccess();

      window.location = "mainWindow.html";
    }

  }
  // Call prsenterHandler for the api calls
  CallPresenterHandler(handler) {

    if (this.inputFields.username.trim() !== '' && this.inputFields.password.trim() !== '') {

      let ValidInputfields = this.ValidUserPwd(this.inputFields.username);

      console.log(ValidInputfields);
      if (ValidInputfields) {
        event.preventDefault();
        const source = $(this);
        $(source).find('.submit').button('reset');
        $(source).find('.alert').hide();
        $('.signinerr').attr('style', 'display:none');


        //call check login method for API model 
        handler(this.inputFields)

      } else {
        //new Alert('#AlertBoxWin',"Enter valid mail id or direct number" );
        $('.signinerr').attr('style', 'display:block');
        $('.signerr-msg').text("Enter valid mail id or direct number");
      }
    } else {
      //alert('welcome');
      //new Alert('#AlertBoxWin',"All fields mandatory" );
      $('.signinerr').attr('style', 'display:block');
      $('.signerr-msg').text("All fields mandatory");
    }

  }
  // VAlidate the username and password valid or not 
  ValidUserPwd(username) {

    if (isValidEmailAddress(username) == false && !Number.isInteger(parseInt(username))) {
      // validation if username is number (direct number)

      return Number.isInteger(parseInt(username)) ? true : false;
    } else {

      return true;
    }
  }

}