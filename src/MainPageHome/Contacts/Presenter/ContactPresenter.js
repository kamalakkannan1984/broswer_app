/**
 * Presenter first pattern 
 * ContactView and model connected here 


 */
import ContactView from "../View/ContactView";
import GetContactModel from "../Model/GetContacts";
import GlobalData from "../../Storage/GlobalData";
import { xmpp } from "../../Common/constant";

import { groupingContacts } from "../../Common/common";
export default class ContactPresenter {
  constructor() {}
  /*
   *** init function initiate on load event
   */
  init = () => {
    let that = this; // this stored in that for function scope
    that.callContacts();
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

          /* response.forEach(function(number, i) { 
                        console.log( response[i].user_status);

                        switch(response[i].user_status){
                            case "Available":
                            response[i].user_status = ""
                            break;
                            case "Busy":
                            response[i].user_status = ""
                            break;
                            case "Do not disturb":
                            response[i].user_status = ""
                            break;
                            case "Invisible":
                            response[i].user_status = ""
                            break;
                            default:
                            response[i].user_status = ""


                        }
                        
                        //response[i].DTEND = convertGMTtoLocalEnddate(number.DTEND*1000);

                        
                    }); */

          let groupindata = groupingContacts(response.companycontacts);

          /*  var groupindata = [
                    {
                        Category: "General",
                        DocumentList: [
                            {
                                DocumentName: "Document Name 1 - General",
                                DocumentLocation: "Document Location 1 - General"
                            },
                            {
                                DocumentName: "Document Name 2 - General",
                                DocumentLocation: "Document Location 2 - General"
                            }
                        ]
                    },
                    {
                        Category: "Unit Documents",
                        DocumentList: [
                            {
                                DocumentName: "Document Name 1 - Unit Documents",
                                DocumentList: "Document Location 1 - Unit Documents"
                            }
                        ]
                    },
                    {
                        Category: "Minutes"
                    }
                ]; */

          // console.log(GlobalData.ContactData);
          console.log("KAMAL");
          console.log(groupindata);
          let contactResponse = { isContact: true, contactarray: groupindata };

          this.View = new ContactView(contactResponse); // Create the object for View

          this.View.getView(contactResponse);
        } else {
          let contactResponse = { isContact: false, data: response };
          console.log(contactResponse);
          this.View = new ContactView(contactResponse); // Create the object for View

          this.View.initContact();
          // this.View.apisucess(false, response);
        }
      })
      .catch((e) =>
        console.error("Login Module Critical failure: " + e.message)
      );
  }
}
