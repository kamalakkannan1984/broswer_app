/**
 * MVP design pattern
 * Presenter first design patttern
 * View and Model initanate from Presenter
 * @param  {true}} {this.loginWindow=loginTemplate({login
 */

import contactTemplate from "../../../Template/mainpage/calls/contacts.hbs";
import dialingTemplate from "../../../Template/mainpage/calls-dialing.hbs";

/*import Alert from "../../../Utils/Alert";
import TaskPresenter from "../../Task/Presenter/TaskPresenter";
import HomeView from "../../DashBoard/View/HomeView"; */
//import { xmpp } from "../../Common/constant";
import {
  showWindow,
  FilterContact,
  loadFavContact,
  sortarray,
  dropDownContactList,
  weekAndDay,
  showDialingWindow,
  closeDialingWindow,
} from "../../Common/common";
/*import CreateTask from "../../CreateTask/Presenter/NewtaskPresenter";
import RRulePresenter from "../../RRule/Presenter/RRulePresenter";
import TaskFileUpload from "../../CreateTask/Presenter/TaskFileUpload";
import GlobalData from "../../Storage/GlobalData"; */
//import CallPresenter from "../../Calls/Presenter/CallPresenter";
//This class is the first process for all the application follow.
export default class DialingView {
  constructor() {
    //this.chatWindow = chatTemplate(data);
  }

  //initLogin method used to append the loging template in the index.html
  getView(data) {
    this.assginTemplate(data);
    this.endCall();
  }

  assginTemplate(data) {
    let dilaingResponse = { isdata: true, dialingData: data };
    this.dialingTemplate = dialingTemplate(dilaingResponse);
    $("#chatsec").html(this.dialingTemplate);
  }

  endCall() {
    $(".callbtn").click(function () {
      alert("close dialing....");
      closeDialingWindow();
    });
  }
}
