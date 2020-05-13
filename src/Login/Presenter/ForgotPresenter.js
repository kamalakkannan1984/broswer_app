import ForgotPwdView from '../View/ForgotPwdView';
import Alert from '../../Utils/Alert';
import {
	isValidEmailAddress
} from './../Common/Validation';
import {
	getMyAccAPIAccesstokenforLogin
} from '../Model/ForgotModel';
export default class ForgotPresenter {

	constructor() {
		const setting = {
			login: false,
			title: "Forgot Password?",
			loginsetting: {
				username: {
					id: 'pwd_signup_address',
					type: 'email',
					name: 'email',
					display: "Email Address",
					maxlength: '64',
					class: 'form-control',
					style:"text-transform:lowercase",
				}

			}
		}
		this.View = new ForgotPwdView(setting);
		//this.Model = new LoginModel();
		this.View.initForgotpwd();


	}
	init() {
		let that = this;
		//Reset password for api call for email trigger 
		this.View.addResetPassword(function () {
			that.ResetPassword()
		});
		// Key press event for trigger the resetpassword 
		this.View.addKeypressemail(function (event) {
			$('.signinerr').attr('style', 'display:none');
			var keycode = (event.keyCode ? event.keyCode : event.which);
			keycode == '13' && that.ResetPassword();
		})
	}
	// REset password to call the api service for email notification 
	ResetPassword() {
		$('.signinerr').attr('style', 'display:none');
		let Resetpwd = $('#pwd_signup_address'); // email address 
		//alert(Resetpwd.val())
		if (Resetpwd.val() === "") {

			//new Alert('#AlertBoxWin',"Please Enter Mail Id!" );
			//alert('welcome');
			$('.signinerr').attr('style', 'display:block');
			$('.signerr-msg').text("Please Enter Mail Id");
		} else {
			var check = isValidEmailAddress(Resetpwd.val());

			if (check)

				getMyAccAPIAccesstokenforLogin(Resetpwd.val()).then((response) => {
					if (response[0].errcode == 0) {
						//new Alert('#myModal',"Please check your registered mailbox." );
						localStorage.setItem('forgotPwd', false);
						$('#myModal').modal('show');
						Resetpwd.val("");
						$(".done-btn").click(function () {
							window.location.reload();
						});
					} else {

						//         new Alert('#AlertBoxWin',response[0].errmsg );
						$('.signinerr').attr('style', 'display:block');
						$('.signinerr.msg').text(response[0].errmsg);

					}
				}).catch(e => console.error("Forgot password module Critical failure: " + e.message));
			else {
				//new Alert('#AlertBoxWin',"Please Enter Valid Mail Id!" );
				$('.signinerr').attr('style', 'display:block');
				$('.signerr-msg').text("Please Enter Valid Mail Id!");
			}
		}
	}
}