export let loggeduser = JSON.parse(localStorage.getItem("login"));
export const DomainName = loggeduser.enetepriseid + ".UR.mundio.com";
export let loggedpassword = localStorage.getItem("password");
export let autologin = localStorage.getItem("autologin");
export let boardbid = 0;

export const ChatDomain = "im01.unifiedring.co.uk"; //loggeduser.enetepriseid+'.unifiedring.co.uk';
//window.ConferenceDomain		=	'conference.'+loggeduser.enetepriseid+'.unifiedring.co.uk';
export const ConferenceDomain = "conference.im01.unifiedring.co.uk";

export const xmpp = {
  url: "https://im01.unifiedring.co.uk:5281/http-bind/", //'https://chat.unifiedring.co.uk:5281/http-bind/',
  domain: ChatDomain, //'im01.unifiedring.co.uk',//window.ChatDomain,
  resource: "example",
  overwrite: true,
};

export const jidSuffix = "@" + window.ChatDomain;
//export const callTimer = new _timer;

export let cJobs = {};
export let settings = {};

export let catFile = ""; //path.join( appRoot , 'categories.json');
export let contactsFile = ""; //path.join(appRoot , 'contacts.json');
export let settingsFile = ""; //path.join(appRoot , 'settings.json');
export let TaskFile = ""; //path.join(appRoot , 'urdtasklistfilev02.json');
export let EventsFile = ""; //path.join(appRoot , 'urdeventsfile.json');
export let EventsFilterFile = ""; //path.join(appRoot , 'urdeventsfilterfile.json');
export let GoogleContactFile = ""; //path.join( appRoot , 'googlecontacts.json');
export let GoogleFileShare = ""; //path.join( appRoot , 'Googlefiles.json');
export let MicrosoftFileShare = ""; //path.join( appRoot , 'Microsoftfiles.json');
export let DropBoxFileShare = ""; //path.join( appRoot , 'DropBoxfiles.json');
export let BoxFileShare = ""; //path.join( appRoot , 'BoxFileShare.json');
export let EverNoteFileShare = ""; //path.join( appRoot , 'EverNoteFileShare.json');
export let MicrosoftContactFile = ""; //path.join(appRoot , 'microsoftcontacts.json');
export let categoriesList = {};
export let taskFilesbundle;
export let isTaskAttachment = false;
export let loadDashBoardWin = "";
export let loadChatWin = "";
export let loadChatDetail = "";
export let loadChatDetail_side = "";
export let loadPhoneWin = "";
export let loadBookMrkWin = "";
export let loadProFileWin = "";
export let loadTaskWin = "";
export let loadEventWin = "";
export let loadNotesWin = "";
export let loadFileWin = "";
export let loadLinkWin = "";
export let loadAdminWin = "";
export let loadMentionWin = "";
export let loadPreferenceWin = "";
export let loadTeamWin = "";
export let loadCallWin = "";
export let UA = null;
export let sessiondtmf = null;
export let userid = null;
export let userpass = null;
export let sessions = [];
export let SessionRunner = -1;

/**
 * [SIP] Signalling server configuration
 */
export const sipConfig = {
  traceSip: true,
  wsServers: ["wss://ucwebrtc.vectone.com:57344"],
  viaHost: "",
  uri: "",
  userAgentString: "URWEB:WEB",
  traceSip: true,
  register: false,
  authorizationUser: "",
  password: "",
  log: "debug",
  turnServers: {
    urls: "turn:stun02.mundio.com:3478",
    username: "admin",
    password: "system123",
  },
  displayName: "",
  domain: "UR.mundio.com",
  callId: "",
  host: "",
};
