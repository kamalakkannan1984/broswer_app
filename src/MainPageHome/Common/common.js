import GlobalData from "../Storage/GlobalData";
import ChatWindowPresenter from "../Chatwindow/Presenter/ChatWindowPresenter";
import { xmpp } from "../Common/constant";
import TaskPresenter from "../Task/Presenter/TaskPresenter";
import ContactView from "../Contacts/View/ContactView";

import DialingPresenter from "../Calls/Presenter/DialingPresenter";
import CallPresenter from "../Calls/Presenter/CallPresenter";

export const LoggedDetails = JSON.parse(localStorage.getItem("login"));
export function GetContactDetails(sipid) {
  console.log("details", GlobalData.BuddyList);
  if (GlobalData.BuddyList) {
    var obj = GlobalData.BuddyList.find((data) => data.sip_login_id == sipid);
    return obj;
  }
}

export function GetContactDetailsByExt(ext) {
  if (GlobalData.BuddyList) {
    var obj = GlobalData.BuddyList.find((data) => data.ext == ext);
    return obj;
  }
}

export function groupingContacts(contactsData) {
  let soretedContacts = contactsData.sort(compareg);

  let data = soretedContacts.reduce((r, e) => {
    let group = e.caller_id[0].toUpperCase();

    if (!r[group]) r[group] = { group, ContactList: [e] };
    else r[group].ContactList.push(e);

    return r;
  }, {});

  //data.sort((a, b) => a.localeCompare(b));

  let result = Object.values(data);

  console.log("data", data);
  console.log("resulet", result);
  return result;
}
export function groupingTasks(contactsData) {
  let soretedContacts = contactsData.sort(compareDate);

  let data = soretedContacts.reduce((r, e) => {
    console.log(e.LASTMODIFIED);
    let date = new Date(parseInt(e.LASTMODIFIED));
    console.log(date);
    date = date.toString();
    let group = date.split(" ").slice(0, -5).join(" ");

    if (!r[group]) r[group] = { group, TaskList: [e] };
    else r[group].TaskList.push(e);

    return r;
  }, {});

  //data.sort((a, b) => a.localeCompare(b));

  let result = Object.values(data);

  console.log("data", data);
  console.log("resulet", result);
  return result;
}

function compareDate(a, b) {
  var descA = a.DTEND * 1000;
  var descB = b.DTEND * 1000;
  var dateA = new Date(descA),
    dateB = new Date(descB);
  return dateA - dateB;
}

function compareg(a, b) {
  // Use toUpperCase() to ignore character casing

  const caller_idA = a.caller_id.toUpperCase();

  const caller_idB = b.caller_id.toUpperCase();

  let comparison = 0;

  if (caller_idA > caller_idB) {
    comparison = 1;
  } else if (caller_idA < caller_idB) {
    comparison = -1;
  }

  return comparison;
}

export function GetContactDetailsExt(exten) {
  var obj = undefined;
  if (typeof contacsarray != "undefined")
    obj = contacsarray.find((data) => data.ext == exten);
  return obj;
}

export function FilterContact() {
  var array = []; //getAllContactArray();
  if ($("#directorylst").text() == "Team") {
    array = Teamcontacsarray.sort(compareName) || [];
  } else {
    var array = getAllContactArray();

    array = array.sort(compareFirst);
    /* if($('#directorysrt').text() == "First Name")
			array = array.sort(compareFirst);
		else
			array  = array.sort(compareLast); */
  }
  //	filteroption.contact[0].search = input;
  console.log("befor ", array);
  sortarray(array);
}

function compareFirst(a, b) {
  var splitA = a.caller_id.split(" ");
  var splitB = b.caller_id.split(" ");
  var lastA = splitA[0].toUpperCase();
  var lastB = splitB[0].toUpperCase();

  if (lastA < lastB) return -1;
  if (lastA > lastB) return 1;
  return 0;
}

function getAllContactArray(status) {
  var bundleArray = [];

  var selectedOpt = $(".contact-span").text();

  if (selectedOpt == "All" || status == "All") {
    if (window.Teamcontacsarray != undefined && window.Teamcontacsarray != "") {
      bundleArray = Teamcontacsarray.concat(contacsarray);
      bundleArray = bundleArray.sort(compareName);
    } else {
      bundleArray = GlobalData.BuddyList.sort(compareName);
    }
  } else if (selectedOpt == "Favourite") {
    bundleArray = loadFavContact();
  } else bundleArray = GlobalData.BuddyList.sort(compareName);

  return bundleArray;
}

function compareName(a, b) {
  var tempA = a.caller_id;
  var tempB = b.caller_id;

  tempA = tempA.toUpperCase();
  tempB = tempB.toUpperCase();

  if (tempA < tempB) return -1;
  if (tempA > tempB) return 1;

  return 0;
}

export function sortarray(result) {
  var text = $("#con-search").val();

  let FilterdArray = [];
  $.each(result, function (index, data) {
    var chkAdmin = $("#directorylst").text();

    var contName = data.caller_id;
    var mail = data.email_id ? data.email_id : "";
    var ext = data.ext ? data.ext : "";

    if (text != "" && text != undefined) {
      text = text.trim();
      text = text.toUpperCase();
      if (
        mail.toUpperCase().indexOf(text) == -1 &&
        contName.toUpperCase().indexOf(text) == -1 &&
        ext.toString().indexOf(text) == -1
      )
        return;
    }

    FilterdArray.push(data);
  });

  console.log("FIleted", FilterdArray);

  let grouping = groupingContacts(FilterdArray);
  // Create the object for View
  let contactResponse;

  if (FilterdArray.length > 0)
    contactResponse = { isContact: true, contactarray: grouping };
  else contactResponse = { isContact: false, contactarray: FilterdArray };

  let CView = new ContactView();
  CView.getView(contactResponse);
}

export function dropDownContactList(input) {
  console.log(input);
  if (input.length >= 1) $("#taskContactLst").show();
  else $("#taskContactLst").hide();

  input = input.toUpperCase();
  var div = "";
  $.each(GlobalData.BuddyList, function (index, item) {
    var teamsname = item.caller_id;
    teamsname = teamsname.split(" ").join("@");
    var ContName = item.caller_id;
    if (ContName.length > 23) ContName = ContName.substring(0, 28) + "...";

    var img = "images/avatar_profile_pic.svg";
    if (item.ImageURL) img = item.ImageURL;

    /* 	var moderatestatus = "images/green-active.svg";
		if(item.user_status == "Available")	moderatestatus = "images/green-active.svg";
		else if(item.user_status == "Busy")	moderatestatus = "images/grey.png";
		else if(item.user_status == "Do not disturb")	moderatestatus = "images/red.png";
		else if(item.user_status == "Invisible")	moderatestatus = "images/yellow.png"; */

    if (input != undefined && input != "") {
      input = input.toUpperCase();
      if (
        item.email_id.toUpperCase().indexOf(input) == -1 &&
        item.caller_id.toUpperCase().indexOf(input) == -1 &&
        item.ext.toString().indexOf(input) == -1
      )
        return;

      div +=
        "<li data-name='" +
        teamsname +
        "' data-id='" +
        item.sip_login_id +
        "@" +
        xmpp.domain +
        '\'><span class="conlist-img"><img src=' +
        img +
        '></span><span class="conlist-name">' +
        ContName +
        "</span></li>";

      /* div +='<li onclick="TaskCreateAssign(\''+teamsname+'\',\''+item.sip_login_id+"@"+window.ChatDomain+'\')"><a href="#"><div class="name-images"><img src='+img+' class="list-name-img"><img src='+moderatestatus+' class="dotactives"></div><span>'+ContName+'</span></a></li>\n'; */
      //}
    }
  });

  /* $.each(Teamcontacsarray, function (index, item) {
	
		var teamsname = item.caller_id;
		teamsname = teamsname.split(' ').join('@');
		var ContName = item.caller_id;
		if(ContName.length > 23)
			ContName = ContName.substring(0,28)+"...";
		
		var img = "images/avatar_profile_pic.svg";
		if(item.ImageURL)
			img = item.ImageURL;
		
		var moderatestatus = "images/green-active.svg";
	
			
		if( (input != undefined) && (input != ""))
		{	
			input = input.toUpperCase();
			//if( (item.caller_id.toUpperCase().indexOf(input) != -1) || ((item.ext.toString()).indexOf(input) != -1) ){
			if ((item.caller_id.toUpperCase().indexOf(input) == -1) ) 	return;
				div +='<li onclick="TaskCreateAssign(\''+teamsname+'\',\''+item.team_guid+"@"+window.ConferenceDomain+'\')"><a href="#"><div class="name-images"><img src='+img+' class="list-name-img"><img src='+moderatestatus+' class="dotactives"></div><span>'+ContName+'</span></a></li>\n';
			//}
		}
	}) */

  //div +='</ul>';

  $("#taskContactLst").empty();
  $("#taskContactLst").append(div);

  $("#taskContactLst li")
    .unbind()
    .click(function (e) {
      TaskCreateAssign($(this).attr("data-name"), $(this).attr("data-id"));
    });
}

export function TaskCreateAssign(name, bid) {
  console.log("taskcrea");
  $("#taskContactLst").hide();
  $("#inputassigneeto_name").val("");
  var lst = false;
  $(".taskAvatarimg").each(function (index) {
    var oldBid = $(this).attr("bid");
    if (bid == oldBid) lst = true;
  });

  if (lst) return;
  name = name.replace(/@/gi, " ");

  var temp =
    '<li  class="taskAvatarimg"  bid="' +
    bid +
    '">' +
    name +
    '<span class="icon_close f12"></span></li>';
  $(".taskLst").append(temp);

  $(".addconlist").show();
  $(".taskLst .icon_close").click(function () {
    $(this).parent().remove();

    if ($(".addconlist ol").children().length == 0) $(".addconlist").hide();
    else $(".addconlist").show();
  });
}

export function loadFavContact() {
  var filterdData = GlobalData.BuddyList.filter(
    (data) => data.is_favourite == 1
  );

  return filterdData;
}

export function getTaskcountByUser(id) {
  if (GlobalData.TaskData) {
    console.log("getTaskcountByUser", id);

    var filterdData = GlobalData.TaskData.filter(
      (data) => data.RECEIVER == id || data.SENDER == id || data.OWNERID == id
    );

    console.log("filterdData", filterdData.length);
    $("#tsk_cnt").text(filterdData.length);
  } else {
    let TP = new TaskPresenter(true, id);
    TP.init();
  }
}
export function getAssineeNameList(ATTENDEE) {
  var assigneeNameList = ATTENDEE.split(",");
  var AssineeNames = "";
  console.log("ATTENDE ARRAY", assigneeNameList);

  for (var a = 0; a < assigneeNameList.length; a++) {
    if (assigneeNameList[a].trim() == jsxc.bid) {
      if (AssineeNames == "") AssineeNames = LoggedDetails.username;
      else AssineeNames = AssineeNames + ", " + LoggedDetails.username;
    } else {
      if (assigneeNameList[a].split("@")[1] == undefined) continue;

      var assignne_isTeam = assigneeNameList[a].split("@")[1].split(".")[0];
      if (assignne_isTeam == "conference") {
        var TeamDetails = GetTeamDetails(assigneeNameList[a].split("@")[0]);
        if (TeamDetails) {
          if (AssineeNames == "") AssineeNames = TeamDetails.caller_id;
          else AssineeNames = AssineeNames + ", " + TeamDetails.caller_id;
        }
      } else {
        var ContactDetails = GetContactDetails(
          assigneeNameList[a].split("@")[0].trim()
        );
        console.log("ContactDetails", ContactDetails);
        if (ContactDetails) {
          if (AssineeNames == "") AssineeNames = ContactDetails.caller_id;
          else AssineeNames = AssineeNames + ", " + ContactDetails.caller_id;
        }
      }
    }
  }
  return AssineeNames;
}

function msgSetFavourite(contact) {
  if (contact == undefined) contact = window.LastChatWindow;

  if (contact.includes("@conference")) {
    //teamFavorite(contact);
    return;
  }

  var data = GetContactDetails(contact.split("@")[0]);
  var status = 0;
  if (data.is_favourite == 1) {
    status = 0;
    /* //$('.name_fav_icon').show();
		//$(".icon-tick").hide()
		$('.chatPage').find('.chatfav').attr('src',"images/chat_img/unfavourite.svg")
		$('.chatfav').attr('title','Add favourite');
		$('.Cfavourite').find("span").remove();
		SaveChatRegister(contact, "");		// adding chat history in _chatRegister window... */
  } else {
    status = 1;
    /* 	//$('.name_fav_icon').hide();
		//$(".icon-tick").show();
		$('.chatPage').find('.chatfav').attr('src',"images/chat_img/favourite.svg")
		$('.chatfav').attr('title','Remove favourite');
		$('.Cfavourite').find("a").append('<span class="icon-tick"></span>');
		favSetCloseConv();		 */ // removing chat history in _chatRegister window...
  }
  //const index = Data.findIndex(item => item.sip_login_id == contact.split("@")[0]);
  for (var i = 0; i < contacsarray.length; i++) {
    if (contacsarray[i].sip_login_id == contact.split("@")[0]) {
      contacsarray[i].is_favourite = status;

      var weburl =
        ApiServerURL + "v1/user/XXAccesstokenXX/Urmaappfavouritecontactsave";
      var url =
        "/apiCalling?Stype=setFav&dir_user_id=" +
        loggeduser.dir_user_id +
        "&company_id=" +
        loggeduser.company_id +
        "&mobileno=" +
        data.ext +
        "&status=" +
        status +
        "&linkUrl=" +
        weburl +
        "";
      $.get(url, function (response) {
        if (response[0].errcode == 0) {
          loadFavContact();
          loadContact();
        }
      });
      //openContactwindow(contact);
      //openChatWin(contact.split("@")[0]);
      return;
    }
  }
}

export function getTaskUploadURL() {
  var listofFiles = "";

  console.log("File Upload", GlobalData.array_taskfile);
  console.log(GlobalData.taskfileListArray);
  for (var i = 0; i < GlobalData.array_taskfile.length; i++) {
    console.log("URL", GlobalData.array_taskfile[i]);

    for (var m = 0; m < GlobalData.taskfileListArray.length; m++) {
      console.log("URL", GlobalData.taskfileListArray[m].URL);
      if (
        GlobalData.taskfileListArray[m].FileName == GlobalData.array_taskfile[i]
      ) {
        console.log("URL", GlobalData.taskfileListArray[m].URL);
        if (listofFiles == "")
          listofFiles = GlobalData.taskfileListArray[m].URL;
        else
          listofFiles = listofFiles + "," + GlobalData.taskfileListArray[m].URL;
      }
    }
  }
  console.log(listofFiles);
  return listofFiles;
}

export function weekAndDay() {
  var date = new Date();
  console.log(date);
  var days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ],
    prefixes = ["First", "Second", "Third", "Fourth", "Fifth"];
  return prefixes[Math.floor(date.getDate() / 7)] + " " + days[date.getDay()];
}

export function convertGMTtoLocalEnddate(inputdate) {
  var monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  var dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  //inputdate 		= inputdate.replace(/-/g,'/');
  var date = new Date(inputdate);
  var day = date.getDate();
  var monthIndex = date.getMonth();
  var year = date.getFullYear();
  var time = formatAMPM(date);

  var formatted_date = "";
  if (time == "12:00 AM") time = "11:59 PM";

  formatted_date =
    monthNames[date.getMonth()] +
    " " +
    date.getDate() +
    ", " +
    date.getFullYear() +
    " " +
    time;

  return formatted_date;
}

function formatAMPM(date) {
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var ampm = hours >= 12 ? "PM" : "AM";

  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? "0" + minutes : minutes;

  var strTime = hours + ":" + minutes + " " + ampm;

  return strTime;
}

export function showWindow(item) {
  console.log("item", item);
  if (item == jsxc.bid) return;

  $(".loadersimg").css("display", "block");
  var data = "";
  if (item.includes("@conference")) {
    var temp = GetTeamDetails(item.split("@")[0]);
    if (temp != undefined) {
      var post_msg = temp.post_msg;
      if (temp.created_by == loggeduser.ext) post_msg = 1;

      var self = jsxc.muc;
      self.join(
        item,
        jsxc.xmpp.conn.jid,
        null,
        temp.caller_id,
        undefined,
        true,
        true
      );
      initiateChatWin("", item, temp.caller_id, temp.is_favourite, post_msg);
    } else {
      $(".loadersimg").css("display", "none");
    }
  } else {
    var data = jsxc.storage.getUserItem("buddy", item);

    var temp = GetContactDetails(item.split("@")[0]);
    console.log("emp", temp);
    if (data == null) {
      data = [];
      var temp = GetContactDetails(item.split("@")[0]);

      if (temp != undefined) {
        jsxc.xmpp.addBuddy(
          temp.sip_login_id + "@" + xmpp.domain,
          temp.caller_id,
          temp.ext,
          temp.sip_login_id,
          temp.email_id
        );
        var getdata = GetContactDetails(item.split("@")[0]);
        if (getdata != undefined) {
          data.extension = getdata.ext;
          data.name = getdata.caller_id;
        }
      }
    }
    //initiateChatWin(data.extension, item, data.name);
    let CP = new ChatWindowPresenter(temp);
    CP.init();
  }
}

//
export function showDialingWindow(item) {
  let DP = new DialingPresenter();
  DP.extensionCall(item);
}

export function directNumber(item) {
  let DP = new DialingPresenter();
  DP.directNumber(item);
}

export function closeDialingWindow() {
  let CP = new CallPresenter();
  CP.init();
}
