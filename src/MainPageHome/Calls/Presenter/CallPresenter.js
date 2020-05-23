/**
 * Presenter first pattern 
 * ContactView and model connected here 


 */
import CallWindowView from "../View/CallWindowView";
import GetContactModel from "../Model/GetContacts";
import GlobalData from "../../Storage/GlobalData";
import { xmpp } from "../../Common/constant";
import { groupingContacts } from "../../Common/common";
import { sipConnection } from "../../ServerConnection/SIPServer";
export default class CallPresenter {
  constructor() {}
  /*
   *** init function initiate on load event
   */
  init = () => {
    this.callContacts();
    this.sreverIntgration();
  };

  callContacts() {
    let __Model = new GetContactModel();
    __Model
      .getContactsList()
      .then((response) => {
        if (response.error_code == 0 && response.error_msg == "Success") {
          GlobalData.BuddyList = response.companycontacts;

          response.companycontacts.map(function (val, index) {
            var username = val.sip_login_id + "@" + xmpp.domain;

            var bid = jsxc.jidToBid(username);
            if (!jsxc.storage.getUserItem("buddy", bid)) {
              jsxc.xmpp.addBuddy(
                val.sip_login_id + "@" + xmpp.domain,
                val.caller_id,
                val.ext,
                val.sip_login_id,
                val.email_id
              );
            }
          });

          let groupindata = groupingContacts(response.companycontacts);

          // console.log(GlobalData.ContactData);
          let contactResponse = {
            isContact: true,
            contactarray: groupindata,
          };

          this.View = new CallWindowView(contactResponse); // Create the object for View
          this.View.getView(contactResponse);
          this.View.dialPadView(response.companycontacts);
        } else {
          let contactResponse = { isContact: false, data: response };
          console.log(contactResponse);
          this.View = new CallWindowView(contactResponse); // Create the object for View

          this.View.initContact();
          // this.View.apisucess(false, response);
        }
      })
      .catch((e) => {
        console.error(e.message);
      });
  }

  /**
   * call module intgration
   */
  async sreverIntgration() {
    const ua = await sipConnection();
    console.log(ua);
  }
}
