import homePage from "./MainPageHome";

import $ from "jquery";
import { loggedUser } from "./MainPageHome/Profile/Model/ProfileModel";
import { xmpp } from "./MainPageHome/Common/constant";
import { jsxcconnection } from "./MainPageHome/ServerConnection/JSXCConnection";
import { sipConnection } from "./MainPageHome/ServerConnection/SIPServer";
$(document).ready(function () {
  if (sessionStorage.getItem("login")) {
    jsxcconnection().then(new homePage());
    sipConnect();
  } else {
    window.location = "index.html";
  }
});

async function sipConnect() {
  return await sipConnection()
    .then((res) => {
      return res;
    })
    .catch(console.error());
}
