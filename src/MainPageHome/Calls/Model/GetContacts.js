import { APIServicesURLs } from "../../../Utils/common";

export default class GetContacts {
  constructor() {
    let _that = this;
  }

  getContactsList() {
    console.log("get contact list");
    //this.LoggedDetails = localStorage.getItem("login");

    this.LoggedDetails = JSON.parse(localStorage.getItem("login"));

    console.log("get contact list", this.LoggedDetails.mail);

    return new Promise((resolve, reject) => {
      $.ajax({
        method: "GET",
        url: "/apiCalling",
        data: {
          Stype: "getContact",
          linkUrl: APIServicesURLs.contact,
          login_user_name: this.LoggedDetails.mailid,
          timestamp: 0,
        },
      })
        .done(function (response) {
          console.log(response);
          resolve(response);
        })
        .fail(function (err) {
          alert("Some error API Services", err);
        });
    });
  }
}
