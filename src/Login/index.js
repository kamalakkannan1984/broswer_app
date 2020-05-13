import LoginPrsenter  from './Presenter/LoginPresenter';
/**
 * Presenter first design pattern 
 * Connector for the all the remaining pattern 
 * This file used to initiate the Loginpresenter and presenter initiate the view 
 * @param  {} {letLV=newLoginPrsenter(
 * @param  {} ;LV.init(
 */
export default class Login{

    constructor() {
         let LV = new LoginPrsenter (); 
         LV.init();
    }

};
