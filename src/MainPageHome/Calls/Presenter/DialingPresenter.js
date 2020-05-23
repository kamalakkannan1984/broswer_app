/**
 * Presenter first pattern
 * ContactView and model connected here
 */
import DialingWindowView from "../View/DialingWindowView";
import { GetContactDetailsByExt } from "../../Common/common";
import { sipConfig } from "../../Common/constant";
import { sipConnection } from "../../ServerConnection/SIPServer";
export default class DialingPresenter {
  constructor() {
    this.loggeduser = JSON.parse(localStorage.getItem("login"));
  }

  init() {}

  directNumber(PhoneNumber) {
    alert(PhoneNumber);
    this.dialNow(PhoneNumber);
  }

  extensionCall(ext) {
    this.View = new DialingWindowView(); // Create the object for View
    const details = GetContactDetailsByExt(ext);
    this.dialNow(ext);
    this.View.getView(details);
  }

  async dialNow(PhoneNumber) {
    var options = {
      media: { constraints: { audio: true, video: false } },
      extraHeaders: ["X-webcall: audio"],
      params: { from_displayName: this.loggeduser.ext },
    };
    var uri = "sip:" + PhoneNumber + "@" + sipConfig.domain;
    const ua = await sipConnection();
    console.log(ua);
    ua.on("invite", function (rsession) {
      console.log("KAMAL");
      console.log(rsession);
    });
    const invite = ua.invite(uri, options);
    console.log("KA");
    console.log(invite);
    //SessionRunner++;
    //sessions[SessionRunner] = UA.invite(uri, options);
  }
}
