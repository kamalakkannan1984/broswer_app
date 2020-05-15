const express = require("express");
var request = require("request");
var bodyParser = require("body-parser");
const https = require("https");
var app = express();
var qs = require("qs");
var url = require("url");
var fomidable = require("formidable");
var fs = require("fs");
const path = require("path");
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const NodeCouchDb = require("node-couchdb");
const fileUpload = require("express-fileupload");
const FormData = require("form-data");
const axios = require("axios");

const couchExternal = new NodeCouchDb({
  host: "im01.unifiedring.co.uk",
  protocol: "https",
  port: 6984,
  auth: {
    user: "admin",
    pass: "vicarage2000",
  },
});

app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(fileUpload());
const ApiHeader = {
  authorization: "Basic TXVuZGlvdW5pZmllZHJpbmdteWFjY291bnR3ZWJhcGkxMDY4",
  "cache-control": "no-cache",
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

var ApiMongoHeader = {
  "Content-Type": "application/json",
};

const ApiServerURL = "https://urmyaccount.mundio.com/";
var getAccesstokenkey = "";
var AccesstokenCentralization = "";
const projectId = 106887;

const api = {
  updateIp: "/updateIp",
  token: "/getAccesstoken",
  login: "/Login",
  thumb: "/getthumbnail",
  contact: "getContact",
  teamcontact: "getTeamContact",
  forgetPassword: "ForgetPass",
  setStatus: "SetStatus",
  getStatus: "GetStatus",
  getBoundId: "GetBoundId",
  voiceMail: "GetVoiceMail",
  record: "GetRecords",
  FavContact: "setFav",
  FavTeamContact: "setTeamFav",
  setMute: "setMute",
  InviteUser: "InviteUser",
  getProfile: "GetProfile",
  getProfileImg: "GetProfileImg",
  setProfilePass: "SetProfilePass",
  getStoreRetention: "Getstoreretention",
  getAdmin: "Getadmindetail",
  adminAddRemove: "adminaddremove",
  adminCAddRemove: "adminComAddRemove",
  addCompliance: "addadmincompliance",
  getCompliance: "getcompliancedetail",
  adminFileShare: "adminFileShareSave",
  adminRetention: "adminretention",
  getRetention: "getRetention",
  setRetention: "soreRetention",
  chkMsgRemove: "checkmsgremove",
  displayPic: "displaypicture",
  deleteVoiceMail: "delvoicemail",
  getPreference: "GetPreference",
  setPreference: "SetPreference",
  googleShare: "/cloudShare",
  dropShare: "/dropbox",
  boxShare: "/openbox",
  evernoteShare: "/evernote",
  oneDriveShare: "/onedrive",
  newKey: "/profileData",
  addTeamParticipant: "/addTeamParticipant",
  deleteTeamParticipant: "/removeTeamParticipant",
  roomDetail: "/roomdetail",
  teamAnnouncement: "/teamAnnouncement",
  fileGenrate: "/fileGenrate",
  emergencyAdd: "/emergencyAdd",
  emergencyGet: "/emergencyGet",
  emergencyMod: "/emergencyMod",
  createTeam: "createTeam",
  TeamAddmem: "Teamaddmem",
  GTeamMem: "getTeamDetail",
  getNote: "getallnotes",
  createNote: "createnote",
  deleteNote: "removenotes",
  getEvent: "getallevent",
  createEvent: "createevent",
  deleteEvent: "removeevent",
  archiveTeam: "archiveteam",
  leaveTeam: "leaveteam",
  deleteTeam: "deleteteam",
  getTask: "getTask",
  deleteTask: "deleteTask",
  setTask: "setTask",
  taskFileUpload: "/taskFileUpload",
};

var server = app.listen(8000, "0.0.0.0", function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log("Example app listening at http://%s:%s", host, port);
});
server.setTimeout(10000);

app.get(api.updateIp, (req, res) => {
  var url = req.query.linkUrl;
  request.post({ url: url }, function (e, r, body) {
    if (body != undefined) res.send(body);
    else res.send("failure");
  });
});
async function uploadtoserver(path) {
  let formData = new FormData();
  let stream = fs.createReadStream(path);

  formData.append("file", stream);

  let formHeaders = formData.getHeaders();

  let res = await axios
    .post(
      "https://urmyaccount.mundio.com/v1/user/" +
        getAccesstokenkey +
        "/UrUploadFiles",
      formData,
      {
        headers: {
          ...formHeaders,
        },
      }
    )
    .catch((error) => {
      console.log(error);
    });
  return res;
}

async function uploadfiles(req, res) {
  if (Object.keys(req.files).length == 0) {
    return res.status(400).send("No files were uploaded.");
  }
  let target_file = req.files.file;
  let filet = target_file.mv(
    path.join(__dirname, "/uploads", target_file.name),
    (err) => {
      if (err) throw err;
    }
  );
  let finalres = await uploadtoserver(
    path.join(__dirname, "/uploads", target_file.name)
  );
  res.send(finalres.data);
  fs.unlink(path.join(__dirname, "/uploads", target_file.name), (_err) => {});
}
//-----------------------------------------------------------
app.post(api.taskFileUpload, function (req, res) {
  console.log("inside taskFileUpload");

  getaccess(projectId);

  let file = req.files.file;

  uploadfiles(req, res);
});
app.get(api.token, (req, res) => {
  getaccess(projectId, function (data) {
    res.send(data);
  });
});

app.get(api.newKey, (req, res) => {
  // 	= 	req.query.Proj_ID;
  var url =
    ApiServerURL + "v1/user/Unifiedringmyaccountwebapiinserttokenmaster";
  var form = { Proj_ID: projectId };
  var postdata = JSON.stringify(form, null, "\t");
  request.post({ url: url, form: postdata, headers: ApiHeader }, function (
    e,
    r,
    body
  ) {
    if (body != undefined) {
      body = jsonParser(body);
      if (body.errcode == 0) res.send(body.tokenlist.AccessTokenID);
    }
  });
});

function getaccess(projectId, callback) {
  var url =
    ApiServerURL + "v1/user/Unifiedringmyaccountwebapiinserttokenmaster";
  var form = { Proj_ID: projectId };
  var postdata = JSON.stringify(form, null, "\t");
  request.post({ url: url, form: postdata, headers: ApiHeader }, function (
    e,
    r,
    body
  ) {
    if (body != undefined) {
      body = jsonParser(body);
      if (body.errcode == 0) {
        getAccesstokenkey = body.tokenlist.AccessTokenID;
        try {
          callback(getAccesstokenkey);
        } catch (e) {}
      }
    } else {
      callback("XXAccesstokenXX");
    }
  });
}

function centralizationToken(callback) {
  var url = "https://meetingapp.mundio.com/api/RequestToken";
  var formdata = {
    SecretId: "dW5pZmllZHJpbmdhcHA=",
    SecretPassword: "YWJjMTIz",
  };
  var headersOpt = { "Content-Type": "application/json" };

  request.post({ url: url, form: formdata, headers: headersOpt }, function (
    e,
    r,
    body
  ) {
    if (body != undefined) {
      body = jsonParser(body);
      if (body.Message == "Success") {
        AccesstokenCentralization = body.AccessToken;
        ApiMongoHeader = {
          authorization: "Bearer " + body.AccessToken,
          "Content-Type": "application/json",
        };
        callback(AccesstokenCentralization);
      }
    } else {
      callback("XXAccesstokenXX");
    }
  });
}

app.post(api.login, function (req, res) {
  var data = req.body;
  var url = data.linkUrl;
  url = url.replace("XXAccesstokenXX", getAccesstokenkey);

  var form = {
    login_user_name: data.login_user_name,
    login_password: data.login_password,
    login_source: data.login_source,
    login_device_id: data.login_device_id,
    login_ipaddress: data.login_ipaddress,
  };
  postdata = JSON.stringify(form, null, "\t");

  request.post({ url: url, form: postdata }, function (e, r, body) {
    if (body != undefined) {
      body = jsonParser(body);
      var ext = body[0].ext;
      if (ext != "" || ext != undefined) createDB("uring_v4_" + ext);
      res.send(body);
    } else res.send("failure");
  });
});

app.get(api.thumb, (req, res) => {
  var url = req.query.linkUrl;
  var form = { filename: req.query.filename };

  var postdata = JSON.stringify(form, null, "\t");

  request.post({ url: url, form: postdata }, function (e, r, body) {
    if (body != undefined) res.send(body);
    else res.send("failure");
  });
});

app.get("/apiCalling", (req, res) => {
  var type = req.query.Stype;
  var url = req.query.linkUrl;
  if (getAccesstokenkey != undefined && getAccesstokenkey != "")
    url = url.replace("XXAccesstokenXX", getAccesstokenkey);

  var postdata = "";
  switch (type) {
    case api.contact:
      var form = {
        login_user_name: req.query.login_user_name,
        timestamp: req.query.timestamp,
      };
      postdata = JSON.stringify(form, null, "\t");
      break;
    case api.teamcontact:
      var form = {
        company_id: req.query.company_id,
        extension: req.query.extension,
        team_id: req.query.team_id,
      };
      postdata = JSON.stringify(form, null, "\t");
      break;
    case api.forgetPassword:
      var form = {
        email: req.query.email,
        new_pwd: "",
        type: 1,
        called_by: "APP",
        log_id: "",
      };
      postdata = JSON.stringify(form, null, "\t");
      break;
    case api.setStatus:
      var form = {
        domain_id: req.query.domain_id,
        extension: req.query.extension,
        status_indicator: req.query.status_indicator,
        status_msg: req.query.status_msg,
        type: req.query.type,
      };
      postdata = JSON.stringify(form, null, "\t");
      break;
    case api.getStatus:
      var form = {
        domain_id: req.query.domain_id,
        extension: req.query.extension,
      };
      postdata = JSON.stringify(form, null, "\t");
      break;
    case api.getBoundId:
      var form = {
        company_id: req.query.company_id,
        domain_id: req.query.domain_id,
        number_type: req.query.number_type,
        type: req.query.type,
        extn: req.query.extn,
      };
      postdata = JSON.stringify(form, null, "\t");
      break;
    case api.voiceMail:
      var form = {
        domain_id: req.query.domain_id,
        extension: req.query.extension,
      };
      postdata = JSON.stringify(form, null, "\t");
      break;
    case api.record:
      var form = {
        domain_id: req.query.domain_id,
        company_id: req.query.company_id,
        extn: req.query.extn,
        from_date: req.query.from_date,
        todate: req.query.todate,
        search_type: req.query.search_type,
      };
      postdata = JSON.stringify(form, null, "\t");
      break;
    case api.FavContact:
      var form = {
        dir_user_id: req.query.dir_user_id,
        company_id: req.query.company_id,
        mobileno: req.query.mobileno,
        status: req.query.status,
      };
      postdata = JSON.stringify(form, null, "\t");
      break;
    case api.FavTeamContact:
      var form = {
        team_id: req.query.team_id,
        input: req.query.input,
        status: req.query.status,
      };
      postdata = JSON.stringify(form, null, "\t");
      break;
    case api.setMute:
      var form = {
        dir_user_id: req.query.dir_user_id,
        company_id: req.query.company_id,
        mobileno: req.query.mobileno,
        status: req.query.status,
        type: req.query.type,
      };
      postdata = JSON.stringify(form, null, "\t");
      break;
    case api.InviteUser:
      var form = {
        company_id: req.query.company_id,
        extn: req.query.extn,
        Username: "Guest User",
        invite_list: [
          {
            invitedPersonname: req.query.invitedPersonname,
            invitedPersonEmail: req.query.invitedPersonEmail,
          },
        ],
      };
      postdata = JSON.stringify(form, null, "\t");
      break;
    case api.getProfile:
      var form = {
        company_id: req.query.company_id,
        extension_number: req.query.extension_number,
        orderid: req.query.orderid,
      };
      postdata = JSON.stringify(form, null, "\t");
      break;
    case api.getProfileImg:
      var form = {
        company_Id: req.query.company_Id,
        extn: req.query.extn,
        photo_info: "",
        Delete_image: "false",
        get_image: "true",
      };
      postdata = JSON.stringify(form, null, "\t");
      break;
    case api.setProfilePass:
      var form = {
        company_Id: req.query.company_Id,
        domain_id: req.query.domain_id,
        extension: req.query.extension,
        email: "",
        login_user_name: req.query.login_user_name,
        login_password: req.query.login_password,
      };
      postdata = JSON.stringify(form, null, "\t");
      break;
    case api.getPreference:
      var form = {
        company_id: req.query.company_id,
        extn: req.query.extn,
      };
      postdata = JSON.stringify(form, null, "\t");
      break;
    case api.setPreference:
      var form = {
        company_id: req.query.company_id,
        extn: req.query.extn,
        audio_info: req.query.audio_info,
      };
      postdata = JSON.stringify(form, null, "\t");
      break;
    case api.getStoreRetention:
      var form = { company_id: req.query.company_id };
      postdata = JSON.stringify(form, null, "\t");
      break;
    case api.getAdmin:
      var form = {
        company_id: req.query.company_id,
        type: req.query.type,
      };
      postdata = JSON.stringify(form, null, "\t");
      break;
    case api.adminAddRemove:
      var form = {
        company_id: req.query.company_id,
        email: req.query.email,
        type: req.query.type,
      };
      postdata = JSON.stringify(form, null, "\t");
      break;
    case api.adminCAddRemove:
      if (req.query.adminmode == "set") {
        var form = {
          company_id: req.query.company_id,
          allow_invite: req.query.allow_invite,
          allow_without_signup: req.query.allow_without_signup,
          giphy_sharing: req.query.giphy_sharing,
        };
        postdata = JSON.stringify(form, null, "\t");
      } else {
        var form = { company_id: req.query.company_id };
        postdata = JSON.stringify(form, null, "\t");
      }
      break;
    case api.addCompliance:
      var form = {
        company_id: req.query.company_id,
        email: req.query.email,
        type: req.query.type,
      };
      postdata = JSON.stringify(form, null, "\t");
      break;
    case api.getCompliance:
      var form = {
        company_id: req.query.company_id,
        type: req.query.type,
      };
      postdata = JSON.stringify(form, null, "\t");
      break;
    case api.adminFileShare:
      var form = {
        company_id: req.query.company_id,
        integration_gallery: req.query.integration_gallery,
        upload_mobile_computer: req.query.upload_mobile_computer,
        google_drive: req.query.google_drive,
        dropbox: req.query.dropbox,
        box: req.query.box,
        onedrive: req.query.onedrive,
        evernote: req.query.evernote,
        type: req.query.type,
      };
      postdata = JSON.stringify(form, null, "\t");
      break;
    case api.adminRetention:
      var form = {
        company_id: req.query.company_id,
        days: req.query.days,
        retention_type: req.query.retention_type,
      };
      postdata = JSON.stringify(form, null, "\t");
      break;
    case api.getRetention:
      var form = {
        company_id: req.query.company_id,
        from_date: req.query.from_date,
        to_date: req.query.to_date,
      };
      postdata = JSON.stringify(form, null, "\t");
      break;
    case api.setRetention:
      var form = {
        company_id: req.query.company_id,
        user_from: req.query.user_from,
        user_to: req.query.user_to,
        file_type: req.query.file_type,
        file_desc: req.query.file_desc,
      };
      postdata = JSON.stringify(form, null, "\t");
      break;
    case api.chkMsgRemove:
      var form = { company_id: req.query.company_id };
      postdata = JSON.stringify(form, null, "\t");
      break;
    case api.displayPic:
      var form = {
        company_id: req.query.company_id,
        extn: req.query.extn,
        photo_info: req.query.photo_info,
        Delete_image: req.query.Delete_image,
        get_image: req.query.get_image,
      };
      postdata = JSON.stringify(form, null, "\t");
      break;
    case api.deleteVoiceMail:
      var form = {
        company_id: req.query.company_id,
        extn: req.query.extn,
        photo_info: req.query.photo_info,
        Delete_image: req.query.Delete_image,
        get_image: req.query.get_image,
      };
      postdata = JSON.stringify(form, null, "\t");
      break;
  }

  console.log("url is", url);
  console.log("postdata is", postdata);

  request.post({ url: url, form: postdata }, function (e, r, body) {
    if (body != undefined) {
      body = jsonParser(body);
      if (body.Message) {
        getaccess(projectId, function (data) {
          var urlNew = req.query.linkUrl;
          urlNew = urlNew.replace("XXAccesstokenXX", getAccesstokenkey);
          request.post({ url: urlNew, form: postdata }, function (e, r, body) {
            if (body != undefined) {
              body = jsonParser(body);
              res.send(body);
            }
          });
        });
      } else {
        res.send(body);
      }
    } else res.send("failure");
  });
});

app.get("/teamApi", function (req, res) {
  var url = "";
  var formdata = "";
  switch (req.query.stype) {
    case api.GTeamMem:
      formdata = {
        team_id: req.query.team_id,
        company_id: req.query.company_id,
        extension: req.query.extension,
      };
      url =
        "https://urmyaccount.mundio.com/v1/user/" +
        getAccesstokenkey +
        "/Urappgetteaminfo";
      break;
    case api.createTeam:
      formdata = {
        company_id: req.query.company_id,
        team_id: req.query.team_id,
        team_name: req.query.team_name,
        team_type: req.query.team_type,
        description: req.query.description,
        created_by: req.query.created_by,
        processtype: req.query.processtype,
        except_guest: req.query.except_guest,
        post_msg: req.query.post_msg,
        mention: req.query.mention,
        integration: req.query.integration,
        pin_post: req.query.pin_post,
        add_members: req.query.add_members,
        team_guid: req.query.team_guid,
        photo_info: req.query.photo_info,
        Delete_image: req.query.Delete_image,
        get_image: req.query.get_image,
        archived: req.query.archived,
      };
      url =
        "https://urmyaccount.mundio.com/v1/user/" +
        getAccesstokenkey +
        "/Urappcreateteaminfo";
      break;
    case api.TeamAddmem:
      formdata = {
        team_id: req.query.team_id,
        extension: req.query.extension,
        processtype: req.query.processtype,
      };
      url =
        "https://urmyaccount.mundio.com/v1/user/" +
        getAccesstokenkey +
        "/Urappcreateteammemberinfo";
      break;
    case api.archiveTeam:
      formdata = {
        company_id: req.query.company_id,
        team: req.query.team,
        close_conversation: req.query.close_conversation,
      };
      url =
        "https://urmyaccount.mundio.com/v1/user/" +
        getAccesstokenkey +
        "/Urappteamcloseconversation";
      break;
    case api.leaveTeam:
      formdata = {
        company_id: req.query.company_id,
        extension: req.query.extension,
        team: req.query.team,
      };
      url =
        "https://urmyaccount.mundio.com/v1/user/" +
        getAccesstokenkey +
        "/Urappleaveteam";
      break;
    case api.deleteTeam:
      formdata = {
        company_id: req.query.company_id,
        team: req.query.team,
      };
      url =
        "https://urmyaccount.mundio.com/v1/user/" +
        getAccesstokenkey +
        "/Urappdeleteteam";
      break;
  }
  formdata = JSON.stringify(formdata, null, "\t");
  request.post({ url: url, form: formdata }, function (e, r, body) {
    if (body != undefined) {
      body = jsonParser(body);
      if (body.Message) {
        getaccess(projectId, function (data) {
          var urlNew =
            "https://urmyaccount.mundio.com/v1/user/" + getAccesstokenkey;
          if (req.query.stype == api.GTeamMem) urlNew += "/Urappgetteaminfo";
          else if (req.query.stype == api.createTeam)
            urlNew += "/Urappcreateteaminfo";
          else if (req.query.stype == api.TeamAddmem)
            urlNew += "/Urappcreateteammemberinfo";
          else if (req.query.stype == api.archiveTeam)
            urlNew += "/Urappteamcloseconversation";
          else if (req.query.stype == api.leaveTeam)
            urlNew += "/Urappleaveteam";
          else urlNew += "/Urappdeleteteam";

          request.post({ url: urlNew, form: formdata }, function (e, r, body) {
            if (body != undefined) {
              body = jsonParser(body);
              res.send(body);
            }
          });
        });
      } else {
        res.send(body);
      }
    } else res.send("failure");
  });
});

app.get("/GetMongoData", function (req, res) {
  var url = "";
  var formdata = "";
  switch (req.query.stype) {
    case api.getNote:
      formdata = {
        SENDER: req.query.SENDER,
      };
      url = "https://meetingapp.mundio.com/api/GetNote";
      break;
    case api.createNote:
      formdata = {
        DESCRIPTION: req.query.DESCRIPTION,
        UID: req.query.UID,
        SUMMARY: req.query.SUMMARY,
        DTSTART: req.query.DTSTART,
        SENDER: req.query.SENDER,
        MSGID: req.query.MSGID,
        RECEIVER: req.query.RECEIVER,
        OWNERID: req.query.OWNERID,
        GROUPID: req.query.GROUPID,
        COMPANY_ID: req.query.COMPANY_ID,
      };
      url = "https://meetingapp.mundio.com/api/Note";
      break;
    case api.deleteNote:
      formdata = {
        UID: req.query.UID,
      };
      url = "https://meetingapp.mundio.com/api/DeleteNotebyUID";
      break;
    case api.getEvent:
      formdata = {
        OWNERID: req.query.OWNERID,
      };
      url = "https://meetingapp.mundio.com/api/EventbyUID";
      break;
    case api.createEvent:
      formdata = {
        LASTMODIFIED: req.query.LASTMODIFIED,
        LOCATION: req.query.LOCATION,
        DUETIME: req.query.DUETIME,
        COMPANY_ID: req.query.COMPANY_ID,
        RRULE: req.query.RRULE,
        DTSTART: req.query.DTSTART,
        STATUS: req.query.STATUS,
        FMTTYPE: req.query.FMTTYPE,
        MSGID: req.query.MSGID,
        SENDER: req.query.SENDER,
        TRIGGER: req.query.TRIGGER,
        THREAD_ID: req.query.THREAD_ID,
        OWNERID: req.query.OWNERID,
        CONV_ID: req.query.CONV_ID,
        DESCRIPTION: req.query.DESCRIPTION,
        ASSIGNEECOMPLETED: req.query.ASSIGNEECOMPLETED,
        ACTION: req.query.ACTION,
        DTEND: req.query.DTEND,
        ATTENDEE: req.query.ATTENDEE,
        SUMMARY: req.query.SUMMARY,
        SIPID: req.query.SIPID,
        COMPLETEDWHEN: req.query.COMPLETEDWHEN,
        UID: req.query.UID,
        COMPLETEPERCENTAGE: req.query.COMPLETEPERCENTAGE,
        SECTION: req.query.SECTION,
        RECEIVER: req.query.RECEIVER,
        GROUPID: req.query.GROUPID,
      };
      url = "https://meetingapp.mundio.com/api/Event";
      break;
    case api.deleteEvent:
      formdata = {
        UID: req.query.UID,
      };
      url = "https://meetingapp.mundio.com/api/DeleteEventbyUID";
      break;
    case api.getTask:
      formdata = {
        SIPID: req.query.SIPID,
      };
      url = "https://meetingapp.mundio.com/api/GetTask";
      break;
    case api.setTask:
      formdata = {
        SUMMARY: req.query.SUMMARY,
        DESCRIPTION: req.query.DESCRIPTION,
        UID: req.query.UID,
        CATEGORY_COLOR: req.query.CATEGORY_COLOR,
        LASTMODIFIED: req.query.LASTMODIFIED,
        COMPLETEDWHEN: req.query.COMPLETEDWHEN,
        FMTTYPE: req.query.FMTTYPE,
        ATTENDEE: req.query.ATTENDEE,
        DTSTART: req.query.DTSTART,
        DTEND: req.query.DTEND,
        STATUS: req.query.STATUS,
        ACTION: req.query.ACTION,
        TRIGGER: req.query.TRIGGER,
        TRIGGER: req.query.TRIGGER,
        OWNERID: req.query.OWNERID,
        CONV_ID: req.query.CONV_ID,
        SENDER: req.query.SENDERID,
        RECEIVER: req.query.RECEIVERID,
        SIPID: req.query.SIPID,
        DURATION: req.query.DURATION,
        /* REPEATTYPE : req.query.REPEATTYPE,
							REPEATTIME : req.query.REPEATTIME,
							REPEATWHEN : req.query.REPEATWHEN, */
        SECTION: req.query.SECTION,
        MSGID: req.query.MSGID,
        THREAD_ID: req.query.THREAD_ID,
        COMPLETEPERCENTAGE: req.query.COMPLETEPERCENTAGE,
        ASSIGNEECOMPLETED: req.query.ASSIGNEECOMPLETED,
        DUETIME: req.query.DUETIME,
        GROUPID: req.query.GROUPID,
        COMPANY_ID: req.query.COMPANY_ID,
        LOCATION: req.query.LOCATION,
        RRULE: req.query.RRULE,
      };

      url = "https://meetingapp.mundio.com/api/Tasks";
      break;
    case api.deleteTask:
      formdata = {
        UID: req.query.UID,
      };
      url = "https://meetingapp.mundio.com/api/DeleteTaskbyUID";
      break;
  }

  console.log("url is :", url);
  console.log("post is :", formdata);
  if (AccesstokenCentralization == "") {
    centralizationToken(function (data) {
      request.post(
        { url: url, form: formdata, headers: ApiMongoHeader },
        function (error, response, body) {
          if (body != undefined) {
            body = jsonParser(body);
          } else res.send("failure");
        }
      );
    });
  } else {
    request.post(
      { url: url, form: formdata, headers: ApiMongoHeader },
      function (error, response, body) {
        console.log(" 2nd time response code is ", response.statusCode);
        if (response.statusCode == 401) {
          centralizationToken(function (data) {
            request.post(
              { url: url, form: formdata, headers: ApiMongoHeader },
              function (error, response, body) {
                console.log(
                  " regen header response code is ",
                  response.statusCode
                );
                if (body != undefined) {
                  body = jsonParser(body);
                  res.send(body);
                } else res.send("failure");
              }
            );
          });
        } else {
          if (body != undefined) {
            body = jsonParser(body);
            res.send(body);
          } else res.send("failure");
        }
      }
    );
  }
});

app.post("/postlink", function (req, res) {
  var data = req.body;
  var Url = data.URL;
  var x = new XMLHttpRequest();
  x.open("GET", "https://cors-anywhere.herokuapp.com/" + Url + "/");
  x.setRequestHeader("X-Requested-With", "XMLHttpRequest");
  x.onload = function () {
    try {
      res.send(JSON.stringify(x.responseText));
    } catch (err) {
      res.send([{ result: -100 }]);
    }
  };
  x.onloadend = function () {
    if (x.status == 404) {
      res.send([{ result: -100 }]);
    }
  };
  x.send();
});

app.get(api.getNote, function (req, res) {
  console.log("get notes detail");
  var url = "https://meetingapp.mundio.com/api/Note";
  var form = {
    Sender: req.query.Sender,
  };
  postdata = JSON.stringify(form, null, "\t");
  console.log("postdata", postdata);
  console.log("url", url);
  request.post({ url: url, form: postdata }, function (e, r, body) {
    if (body != undefined) {
      body = jsonParser(body);
    }
  });
});

app.post(api.roomDetail, function (req, res) {
  var url = "https://im01.unifiedring.co.uk/ejabberd/occupants.php";
  var data = req.body;
  var form = { Room: data.Room };
  var postdata = JSON.stringify(form, null, "\t");
  request.post({ url: url, form: postdata }, function (e, r, body) {
    if (body != undefined) res.send(body);
    else res.send("failure");
  });
});

app.post("/emergencyAdd", function (req, res) {
  var url =
    ApiServerURL + "v1/user/" + getAccesstokenkey + "/Adduremergencyaddress";
  var data = req.body;
  var form = {
    company_id: data.company_id,
    customer_name: data.customer_name,
    address1: data.address1,
    address2: data.address2,
    city: data.city,
    postcode: data.postcode,
    country: data.country,
    sip_id: data.sip_id,
    extn_no: data.extn_no,
  };
  var postdata = JSON.stringify(form, null, "\t");
  request.post({ url: url, form: postdata }, function (e, r, body) {
    if (body != undefined) {
      body = jsonParser(body);
      res.send(body);
    }
  });
});

app.post("/emergencyGet", function (req, res) {
  var url =
    ApiServerURL + "v1/user/" + getAccesstokenkey + "/Geturemergencyaddress";
  var data = req.body;
  var form = {
    sip_id: data.sip_id,
    extn_no: data.extn_no,
  };
  var postdata = JSON.stringify(form, null, "\t");
  request.post({ url: url, form: postdata }, function (e, r, body) {
    if (body != undefined) {
      body = jsonParser(body);
      res.send(body);
    }
  });
});

app.post("/emergencyMod", function (req, res) {
  var url =
    ApiServerURL + "v1/user/" + getAccesstokenkey + "/Modifyuremergencyaddress";
  var data = req.body;
  var form = {
    company_id: data.company_id,
    customer_name: data.customer_name,
    address1: data.address1,
    address2: data.address2,
    city: data.city,
    postcode: data.postcode,
    country: data.country,
    sip_id: data.sip_id,
    extn_no: data.extn_no,
  };
  var postdata = JSON.stringify(form, null, "\t");
  request.post({ url: url, form: postdata }, function (e, r, body) {
    if (body != undefined) {
      body = jsonParser(body);
      res.send(body);
    }
  });
});

app.post("/announcement", function (req, res) {
  console.log("calling teamAnnouncement");
  //var url 			= 	"https://im01.unifiedring.co.uk/ejabberd/broadcast.php";
  var url = "https://chat.unifiedring.co.uk/v1/broadcast.php";
  var data = req.body;
  var form = {
    Room: data.Room,
    To: data.To,
    Message: data.Message,
  };
  var postdata = JSON.stringify(form, null, "\t");
  console.log("url", url);
  console.log("postdata", postdata);
  request.post({ url: url, form: postdata }, function (e, r, body) {
    if (body != undefined) res.send(body);
    else res.send("failure");
  });
});

app.post("/uploadphoto", function (req, res) {
  var url = ApiServerURL + "v1/user/" + getAccesstokenkey + "/Urdisplaypicture";
  var data = req.body;
  var form = {
    company_id: data.company_id,
    extn: data.extn,
    photo_info: data.photo_info,
    Delete_image: data.Delete_image,
    get_image: data.get_image,
  };
  postdata = JSON.stringify(form, null, "\t");
  request.post({ url: url, form: postdata }, function (e, r, body) {
    if (body != undefined) {
      body = jsonParser(body);
      if (body.Message) {
        getaccess(projectId, function (data) {
          var urlNew =
            ApiServerURL + "v1/user/" + getAccesstokenkey + "/Urdisplaypicture";
          request.post({ url: urlNew, form: postdata }, function (e, r, body) {
            if (body != undefined) {
              res.send(body);
            }
          });
        });
        /*setTimeout(function(){ 
					var urlNew = ApiServerURL + "v1/user/"+getAccesstokenkey+"/Urdisplaypicture";
					request.post({ url: urlNew, form: postdata }, function (e, r, body) {
						if(body != undefined) 
						{
							res.send(body);
						}
					})
				}, 2000);*/
      } else {
        //console.log("body",body);
        res.send(body);
      }
    } else res.send("failure");
  });
});
app.post("/formdata1", function (req, res) {
  console.log("dfafdffdsa" + req.body.file);
});
app.post("/getFileUrl", function (req, res) {
  var url = ApiServerURL + "v1/user/" + getAccesstokenkey + "/UrUploadFiles/";
  console.log("url is", url);

  if (!req.files || Object.keys(req.files).length === 0) {
    console.log("error getting file");
    return res.status(400).send("No files were uploaded.");
  }

  // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
  let sampleFile = req.files.sampleFile;
  console.log("sampleFile", sampleFile);
  // Use the mv() method to place the file somewhere on your server
  sampleFile.mv(url, function (err) {
    if (err) {
      console.log("err", err);
      return res.status(500).send(err);
    }
    console.log("File uploaded");
    res.send("File uploaded!");
  });

  //var file = req.files;
  //console.log("file is",file);

  /*var data = req.body;
	request.post({ url: url, form: postdata }, function (e, r, body) {
		console.log("body is",body);
		res.send(body);
	})*/

  /*var temp 	=	 req.body;
	console.log("file",temp);
	var data =	req.file;
	console.log(data);
	
	new fomidable.IncomingForm().parse(req).on('field', (name, field) => {
      console.log('Field', name, field)
    })
    .on('file', (name, file) => {
      console.log('Uploaded file', name, file)
	  request.post({ url: url, form: file }, function (e, r, body) {
			console.log("body is",body);
			if(body != undefined) 
			{
				body = jsonParser(body);
			}
		});
    })*/

  //console.log("data is",data);

  /*var data 	=	 req.body;
	console.log("data is",data);
	console.log(url);
	
	new fomidable.IncomingForm().parse(req).on('field', (name, field) => {
      console.log('Field', name, field)
    })
    .on('file', (name, file) => {
      console.log('Uploaded file', name, file)
	  request.post({ url: url, form: file }, function (e, r, body) {
			console.log("body is",body);
			if(body != undefined) 
			{
				body = jsonParser(body);
			}
		});
    })
	*/
  /*var url = req.query.fileUrl;
	var name = req.query.filename;
	var type = req.query.fileType;
	console.log("url",url);
	console.log("name",name);
	console.log("type",type);*/

  /*
	var data = req.body;
	var url = data.fileUrl;
	var name = data.filename;
	var type = data.fileType;
	console.log("url",url);
	console.log("name",name);
	console.log("type",type);
	
	var formData = {
	  name: 'file1',
	  file: {
		value:  fs.createReadStream(url),
		options: {
		  filename: name,
		  contentType: type
		}
	  }
	};
	request.post({url:url, formData: formData}, 
	  function cb(err, httpResponse, body) {
		if (err) {
		  return console.error('upload failed:', err);
		}
		console.log('Upload successful!  Server responded with:', body);
	  }
	);
	*/

  /*console.log("data is",data1);
	
		request.post({ url: url, form: data }, function (e, r, body) {
			console.log("body is",body);
			if(body != undefined) 
			{
				body = jsonParser(body);
			}
		});
	*/
});

app.post(api.fileGenrate, function (req, res) {
  var url = ApiServerURL + "v1/user/" + getAccesstokenkey + "/UrUploadFiles/";
  console.log("url is", url);
  var data = req.body;
  //var data = req.files;
  console.log("data is", data);

  var url =
    "C:/Users/b.ezhumalai/Downloads/c37fbdeced27473ea4e62ae2b3fef19a1574846868716_task.ics";
  var data1 = fs.createReadStream(url);
  console.log("data1", data1);

  var temp = req.body;
  console.log("file", temp);
  var data = req.file;
  console.log(data);

  new fomidable.IncomingForm()
    .parse(req)
    .on("field", (name, field) => {
      console.log("Field", name, field);
    })
    .on("file", (name, file) => {
      console.log("Uploaded file", name, file);
      request.post({ url: url, form: file }, function (e, r, body) {
        //console.log("body is",body);
        if (body != undefined) {
          body = jsonParser(body);
        }
      });
    });

  var type = 12;
  //var type = data.type;
  var fileName = data.fileName;
  var descr = data.descr;

  if (type == "note") {
    console.log("inside note");

    var formData = {
      name: fileName,
      file: {
        value: descr,
        options: {
          filename: fileName,
          contentType: "text/calendar",
        },
      },
    };
    request.post({ url: url, formData: formData }, function cb(
      err,
      httpResponse,
      body
    ) {
      if (err) {
        return console.error("upload failed:", err);
      }
      console.log("Upload successful!  Server responded with:", body);
    });

    /*var blob = new Blob([descr], {type: "text/calendar"});
		blob.lastModifiedDate = new Date();
		blob.name = fileName;
		var file = blob;
		console.log("file is",file);
		
		var formData = {
			name: 'file1',
			file: {
			  value: file,
			  options: {
				filename: fileName,
				contentType: "text/calendar"
			  }
			}
		  };
		  request.post({url:url, formData: formData}, 
			function cb(err, httpResponse, body) {
			  if (err) {
				return console.error('upload failed:', err);
			  }
			  console.log('Upload successful!  Server responded with:', body);
			}
		  );
*/

    /*var blob = new Blob([descr], {type: "text/calendar"});
		blob.lastModifiedDate = new Date();
		blob.name = fileName;
		var file = blob;
		console.log("file",file);
		var data = new FormData();
		var request = new XMLHttpRequest();
		data.append('file', file);
		request.addEventListener('load', function(e) {
			var fileurl = request.response;
			console.log("fileurl",fileurl);
		});
		request.upload.addEventListener('progress', function(e) {
			var percent_complete = (e.loaded / e.total)*100;
		});
		request.responseType = 'json';
		request.open('post', url); 
		request.send(data);
		*/

    /*console.log("fileGenrate calling...");
			var request = new XMLHttpRequest();
			request.addEventListener('load', function(e) {
				console.log("load",request.response);
				var fileurl = request.response;
				res.send(fileurl);		
			});
			request.upload.addEventListener('progress', function(e) {
				var percent_complete = (e.loaded / e.total)*100;
			});
			request.responseType = 'json';
			request.open('post', url); 
			request.send(fdata);*/

    /*console.log("inside note");
		var data = descr;
		var b = new Blob([data], {type: 'text/calendar'});
		u =  URL.createObjectURL(b);
		x = new XMLHttpRequest();
		x.open('GET', u, false); //although sync, you're not fetching over internet
		x.send();
		URL.revokeObjectURL(u);
		setTimeout(function () {
			var blob = null;
			blob = x.responseText;
			fileName = fileName + '.ics';
			var mimeType = "text/calendar";
			var file = new File([blob], fileName,{type:mimeType});
			var formData = new FormData();
			var name = (file.name).replace(/ /g,'');
			formData.append('file', file, name);
			var data = new FormData();
			var request = new XMLHttpRequest();
			data.append('file', file);
			request.addEventListener('load', function(e) {
				console.log("load",request.response);
				var fileurl = request.response;
				res.send(fileurl);		
			});
			request.upload.addEventListener('progress', function(e) {
				var percent_complete = (e.loaded / e.total)*100;
			});
			request.responseType = 'json';
			request.open('post', url); 
			request.send(data);
		},1000);*/
  }
});

app.post(api.addTeamParticipant, function (req, res) {
  var url = "https://im01.unifiedring.co.uk/ejabberd/invite.php";
  var data = req.body;
  var form = {
    room: data.room,
    reason: data.reason,
    password: data.password,
    users: data.users,
  };
  postdata = JSON.stringify(form, null, "\t");
  var apiTeamHeader = {
    authorization:
      "Basic OGFrMzdnSlVZcTJoUno6MGRpdWQ3NjVqZzk0YnNpODRqZmdqMHczamZoNzgyMmo=",
  };
  request.post({ url: url, form: postdata, headers: apiTeamHeader }, function (
    e,
    r,
    body
  ) {
    if (body != undefined) res.send(body);
    else res.send("failure");
  });
});

/*
app.post(api.addTeamParticipant,function(req,res){
                
	var url 			= 	"https://im01.unifiedring.co.uk/ejabberd/invite.php";
	var data = req.body;
	var form = {
			room			: 	data.room,
			reason			: 	data.reason,
			password		: 	data.password,
			users			: 	data.users,
		};
		postdata 	= 	JSON.stringify(form, null, '\t');
		var apiTeamHeader = {
			"authorization": "Basic OGFrMzdnSlVZcTJoUno6MGRpdWQ3NjVqZzk0YnNpODRqZmdqMHczamZoNzgyMmo=",
		};
	
	request.post({ url: url, form: postdata, headers: apiTeamHeader }, function (e, r, body) {
		
		if(body != undefined)	res.send(body);
		else	res.send("failure");
	});
})
*/
app.post(api.deleteTeamParticipant, function (req, res) {
  var url = "https://im01.unifiedring.co.uk/ejabberd/leave.php";
  var data = req.body;
  var form = {
    Message: data.Message,
    To: data.To,
    Room: data.Room,
    Leaving: data.Leaving,
  };
  postdata = JSON.stringify(form, null, "\t");
  request.post({ url: url, form: postdata }, function (e, r, body) {
    if (body != undefined) res.send(body);
    else res.send("failure");
  });
});

app.post(api.teamAnnouncement, function (req, res) {
  console.log("calling teamAnnouncement");
  //var url 			= 	"https://im01.unifiedring.co.uk/ejabberd/broadcast.php";
  var url = "https://chat.unifiedring.co.uk/v1/broadcast.php";
  var data = req.body;
  var form = {
    Room: data.Room,
    To: data.To,
    Message: data.Message,
  };
  postdata = JSON.stringify(form, null, "\t");
  console.log("url", url);
  console.log("postdata", postdata);
  request.post({ url: url, form: postdata }, function (e, r, body) {
    if (body != undefined) res.send(body);
    else res.send("failure");
  });
});

const googleFileClientId =
  "241894072484-lkhg5i556mcovif9kf4sncu59moctrsa.apps.googleusercontent.com";
const googleFileClientSecret = "Eaoe93Q_KUCReSSK2qps9ogA";
const googleFileScopes = "https://www.googleapis.com/auth/drive";
const { OAuth2Client } = require("google-auth-library");

app.get(api.googleShare, (req, res) => {
  var url = getGoogledriveAuthenticationUrl(
    googleFileScopes,
    googleFileClientId,
    googleFileClientSecret
  );
  res.send(url);
});

app.get(api.dropShare, function (req, res) {
  var url =
    "https://www.dropbox.com/1/oauth2/authorize?client_id=hwxg0lbyso6tx39&response_type=token&redirect_uri=http://localhost&state=8eFwZuD1D-AAAAAAAAAAMb9Ts7QfhEbgdlJLEDruycqhwLnZCb75eVT3bR97jtyf";
  res.send(url);
});

app.get(api.boxShare, function (req, res) {
  var url = "https://account.box.com/login";
  res.send(url);
});

app.get(api.evernoteShare, function (req, res) {
  var url = "https://www.evernote.com/Login.action?targetUrl=%2FHome.action";
  res.send(url);
});

app.get(api.oneDriveShare, function (req, res) {
  var scopes = "files.readwrite.all offline_access";
  var clientId = "8YpHhWzGap0l3Lzl-q?wN1TtjsWPHJ*-";
  //var url ='https://accounts.google.com/o/oauth2/v2/auth?scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive&response_type=code&client_id=241894072484-lkhg5i556mcovif9kf4sncu59moctrsa.apps.googleusercontent.com&redirect_uri=urn%3Aietf%3Awg%3Aoauth%3A2.0%3Aoob';
  var url =
    "https://login.live.com/oauth20_authorize.srf?client_id=1e5eef18-331b-4090-98ef-5183d6c8bad4&scope=files.readwrite.all offline_access&response_type=code&redirect_uri=http://localhost";
  res.send(url);
});

function getAccessToken(oAuth2Client) {
  const SCOPES = ["https://www.googleapis.com/auth/drive.metadata.readonly"];
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question("Enter the code from that page here: ", (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error("Error retrieving access token", err);
      oAuth2Client.setCredentials(token);
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log("Token stored to", TOKEN_PATH);
      });
    });
  });
}

function getGoogleDriveAuthorizationCode(scopes, clientId, clientSecret) {
  const url = getGoogledriveAuthenticationUrl(scopes, clientId, clientSecret);
  return authorizeApp(url);
}

function getGoogledriveAuthenticationUrl(scopes, clientId, clientSecret) {
  oauth = new OAuth2Client(clientId, clientSecret, "urn:ietf:wg:oauth:2.0:oob");
  return oauth.generateAuthUrl({ scope: scopes });
}

function authorizeApp(url) {
  let win;

  return new Promise(function (resolve, reject) {
    var win = window.open(url);
    wins.setMenuBarVisibility(false);
    wins.loadURL(url);

    wins.on("closed", function () {
      reject(new Error("User closed  the window"));
    });

    wins.on("page-title-updated", function () {
      setImmediate(function () {
        const title = wins.getTitle();
        if (title.startsWith("Denied")) {
          reject(new Error(title.split(/[ =]/)[2]));
          wins.removeAllListeners("closed");
          wins.close();
        } else if (title.startsWith("Success")) {
          resolve(title.split(/[ =]/)[2]);
          wins.removeAllListeners("closed");
          wins.close();
        }
      });
    });
  });
}

function getMsAuthenticationUrl(scopes, clientId, clientSecret) {
  var MicrosoftredirectUri = "http://localhost";
  var MsauthEndpoint =
    "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?";
  var param = require("jquery-param");
  var authState = guid();
  var authNonce = guid();
  var authParams = {
    response_type: "id_token token",
    client_id: clientId,
    redirect_uri: MicrosoftredirectUri,
    scope: scopes,
    state: authState,
    nonce: authNonce,
    response_mode: "fragment",
  };

  return MsauthEndpoint + param(authParams);
}

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return (
    s4() +
    s4() +
    "-" +
    s4() +
    "-" +
    s4() +
    "-" +
    s4() +
    "-" +
    s4() +
    s4() +
    s4()
  );
}

function jsonParser(jsonData) {
  try {
    return JSON.parse(jsonData);
  } catch (err) {
    return [{ result: -100 }];
  }
}

function createDB(key) {
  couchExternal.createDatabase(key).then(
    () => {
      console.log("created");
    },
    (err) => {
      console.log(err);
    }
  );
}
