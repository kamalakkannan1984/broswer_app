import { xmpp } from "../Common/constant";
export let inputstatus = "";
export async function jsxcconnection() {
  var loggedUser = JSON.parse(localStorage.getItem("login"));
  try {
    await jsxc.xmpp.logout();
    if (loggedUser == undefined) {
      window.location = "index.html";
      return;
    } else {
      var temp = jsxc.xmpp.conn;
      if (temp != null) await jsxc.xmpp.logout();
      await jsxc.init({
        rosterAppend: "#hiddenroster",
        mam: {
          max: 5,
        },
        root: "helper",
        displayRosterMinimized: function () {
          return false;
        },
        xmpp: {
          url: xmpp.url,
        },
        favicon: {
          enable: true,
          bgColor: "#E59400",
          textColor: "#fff",
        },
      });
      console.log(loggedUser);
      console.log(
        loggedUser.sip_userid + "@" + xmpp.domain,
        loggedUser.sip_password,
        xmpp.url
      );
      await jsxc.start(
        loggedUser.sip_userid + "@" + xmpp.domain,
        loggedUser.sip_password
      );
    }

    $(document).on("connected.jsxc ()", function () {
      jsxc.xmpp.conn.addHandler(
        function (presence) {
          console.log("presend handler ", presence);
        },
        null,
        "presence"
      );
      jsxc.xmpp.conn.addHandler(
        function (message) {
          console.log("group chat handler ", message);
        },
        null,
        "message",
        "groupchat"
      );
      jsxc.xmpp.conn.addHandler(
        function (message) {
          console.log("Chat handler ", message);
        },
        null,
        "message",
        "chat"
      );

      inputstatus = "connected";
      console.log("CHAT Jsxc Connected");
    });

    $(document).on("connecting.jsxc", function () {
      console.log("CHAT connecting");
    });

    $(document).on("authfail.jsxc", function () {
      console.log("CHAT failed");
      //window.location.replace("index.html")
    });

    $(document).on("attached.jsxc", function () {
      /* setTimeout(function () {
				if (typeof window.contacsarray == "undefined")
					_getAPIAccesstoken();
			}, 1000);
			loadlocalimg();
			var total = jsxc.storage.getUserItem('unreadMsg') || 0; */
      //       Tinycon.setBubble(total);
    });
    $(document).on("cloaded.roster.jsxc", function () {
      setTimeout(function () {
        loadContact("");
        loadTeamContact("");
        jsxc.xmpp.bookmarks.loadFromRemote();
      }, 2000);
    });

    $(document).on("disconnected.jsxc", function () {
      inputstatus = "disconnected";
      console.log("CHAT disconnect", jsxc.bid);
      /* setTimeout(function()
			{
				var answer = window.confirm("Server Disconnected Do You Want to Restart!");
				if (answer) {
					location.reload(true);	
				}
			},20000) */

      setTimeout(function () {
        jsxc.start(
          loggeduser.sip_userid + "@" + xmpp.domain,
          loggeduser.sip_password
        );
        _getAPIAccesstoken();
      }, 5000);
    });
  } catch (error) {
    console.log("Cirtical error ", error.stack);
  }
}
export function setstatus(input) {
  inputstatus = input;
}

export async function setPresence(input) {
  try {
    console.log("setpresense", input);
    var bid = jsxc.bid;
    await jsxc.selfPresence(bid, input);
  } catch (error) {
    console.log("jsxc connection", error.stack);
  }
}
