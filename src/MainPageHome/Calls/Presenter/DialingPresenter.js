/**
 * Presenter first pattern 
 * ContactView and model connected here 


 */
import DialingWindowView from "../View/DialingWindowView";
/*import CallWindowView from "../View/CallWindowView";
import GetContactModel from "../Model/GetContacts";
import GlobalData from "../../Storage/GlobalData";
import { xmpp } from "../../Common/constant";*/
import { groupingContacts } from "../../Common/common";
export default class DialingPresenter {
  constructor(item) {
    alert(item);
    this.dailing(item);
  }

  init() {}

  dailing(item) {
    this.View = new DialingWindowView(); // Create the object for View
    this.View.getView(item);
  }
}
