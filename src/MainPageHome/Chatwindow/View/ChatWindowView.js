/**
 * MVP design pattern 
 * Presenter first design patttern 
 * View and Model initanate from Presenter 
 * @param  {true}} {this.loginWindow=loginTemplate({login
 */


   

import chatTemplate from '../../../Template/mainpage/inner-main.hbs';

import Alert from '../../../Utils/Alert';

import HOmeView from '../../DashBoard/View/HomeView';
import RightSideWindow from '../Presenter/RightSideWindow'
import {xmpp} from '../../Common/constant'
import {showWindow} from '../../Common/common'
import FavContact from '../../Contacts/Presenter/FavContactPresenter'
//This class is the first process for all the application follow. 
export default class ChatwindowView {

constructor(data)
{
   console.log("chat data",data )
    this.chatWindow = chatTemplate(data);
   
}

//initLogin method used to append the loging template in the index.html 
initChat() {
  
   $('#ParentWindow').find("#chatsec").html(this.chatWindow);

   $('.rowslideright').unbind().on("click",function(){
      console.log($("#innerchat-win").attr('bid'));

      let RP = new RightSideWindow($("#innerchat-win").attr('bid'));
      RP.init();
    })

    $(".favicon").unbind().click(function(){
      console.log($("#innerchat-win").attr('bid'));
      let FP = new FavContact($("#innerchat-win").attr('bid'));
         FP.init();
    });
    

    

 }



}