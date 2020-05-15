/**
 * MVP design pattern
 * Presenter first design patttern
 * View and Model initanate from Presenter
 * @param  {true}} {this.loginWindow=loginTemplate({login
 */

import RightSideTemplate from "../../../Template/mainpage/innerrightwindow.hbs";

import Alert from "../../../Utils/Alert";
import FavContact from "../../Contacts/Presenter/FavContactPresenter";
import HOmeView from "../../DashBoard/View/HomeView";
import RightSideWindow from "../Presenter/RightSideWindow";
import { xmpp } from "../../Common/constant";
import { showWindow } from "../../Common/common";
//This class is the first process for all the application follow.
export default class RightWindowView {
  constructor(data) {
    this.rightWindow = RightSideTemplate(data);
  }

  //initLogin method used to append the loging template in the index.html
  initChat() {
    $("#ParentWindow").find("#mySidenav").html(this.rightWindow);

    $("#myTab a").click(function (e) {
      e.preventDefault();
      $(this).tab("show");
    });

    $(".favicon")
      .unbind()
      .click(function () {
        console.log($("#innerchat-win").attr("bid"));
        let FP = new FavContact($("#innerchat-win").attr("bid"));
        FP.init();
      });

    /*    $("#myTab a").click(function(e){
    //e.preventDefault();
console.log($(this).attr("href"));
    if($(this).attr("href") == "#home")
    {
      $("#profile").hide();
      $("#home").show();
    }
   else
   {
    $("#home").hide();
    $("#profile").show();
   }
}) */
  }
}
