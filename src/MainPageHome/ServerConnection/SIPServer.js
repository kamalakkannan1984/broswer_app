import * as publicIp from "public-ip";
import { sipConfig } from "../Common/constant";

/**
 * Create SIP connection to siggnalling server and loggedin user registration
 */
export async function sipConnection() {
  try {
    const ipAddress = await getIp();
    const loggeduser = JSON.parse(localStorage.getItem("login"));
    window.GateWay = ipAddress;
    window.host = ipAddress;
    window.ipnumber = ipAddress;
    const configuration = {
      wsServers: sipConfig.wsServers,
      traceSip: sipConfig.traceSip,
      viaHost: ipAddress,
      uri: `${loggeduser.ext}@${loggeduser.enetepriseid}.${sipConfig.domain}`,
      userAgentString: sipConfig.userAgentString,
      authorizationUser: loggeduser.ext,
      password: loggeduser.dp_password,
      log: sipConfig.log,
      turnServers: sipConfig.turnServers,
      displayName: loggeduser.ext,
      register: sipConfig.register,
      host: ipAddress,
      callId: loggeduser.ext,
    };
    const ua = new SIP.UA(configuration);
    ua.start();
    ua.on("registrationFailed", function (reason) {
      console.log("Registration Failed", reason);
    });
    ua.on("registered", function (reason) {
      console.log("Registered Successfully", reason);
    });
    ua.on("bye", function (rsession) {
      console.log("bye");
    });
    ua.on("invite", function (rsession) {
      console.log("invite");
      console.log(rsession);
    });
    return ua;
  } catch (err) {
    console.log(err);
  }
}

/**
 * Get IP address
 */
const getIp = async () => {
  return await publicIp.v4();
};

/**
 * Replace SDP
 */
window.ReplaceSDP = function (message) {
  var toreplace =
    "a=fmtp:111 maxaveragebitrate=28000;maxplaybackrate=16000;minptime=10;useinbandfec=1";
  var maxptime = "a=maxptime:60";
  var c = message.indexOf("a=fmtp:111");
  if (c > 0) {
    var d = message.indexOf("\r\n", c);
    var tofind = message.substr(c, d - c);

    message = message.replace(tofind, toreplace);

    if (message.indexOf(maxptime) < 0) {
      message = message + maxptime + "\r\n";
    }
  }
  console.log(message);
  return message;
};
