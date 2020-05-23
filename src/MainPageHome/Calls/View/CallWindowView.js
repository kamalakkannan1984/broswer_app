/**
 * MVP design pattern
 * Presenter first design patttern
 * View and Model initanate from Presenter
 * @param  {true}} {this.loginWindow=loginTemplate({login
 */

import contactTemplate from "../../../Template/mainpage/Calls/contacts.hbs";
import dialpadTemplate from "../../../Template/mainpage/dialpad.hbs";
import dropdownTemplate from "../../../Template/mainpage/dropdown.hbs";
import headerBarTemplate from "../../../Template/mainpage/header-bar.hbs";

import Alert from "../../../Utils/Alert";
import TaskPresenter from "../../Task/Presenter/TaskPresenter";
import HomeView from "../../DashBoard/View/HomeView";
import { xmpp } from "../../Common/constant";
import {
  showWindow,
  FilterContact,
  loadFavContact,
  sortarray,
  dropDownContactList,
  weekAndDay,
  showDialingWindow,
  directNumber,
} from "../../Common/common";
import CreateTask from "../../CreateTask/Presenter/NewtaskPresenter";
import RRulePresenter from "../../RRule/Presenter/RRulePresenter";
import TaskFileUpload from "../../CreateTask/Presenter/TaskFileUpload";
import GlobalData from "../../Storage/GlobalData";
import $ from "jquery";

//import CallPresenter from "../../Calls/Presenter/CallPresenter";
//This class is the first process for all the application follow.
export default class CallView {
  constructor(data) {
    this.ChatDomain = xmpp.domain;
  }

  //initLogin method used to append the loging template in the index.html
  getView(data) {
    let that = this;
    console.log("contactview", data);
    const headerData = { iscallHeader: true };
    this.headerBarTemplate = headerBarTemplate(headerData);
    this.contactWindow = contactTemplate(data);
    $("#headerPartial").html(this.headerBarTemplate);
    $("#contactlist-sec").html(this.contactWindow);

    $(".con-li")
      .unbind()
      .on("click", function (event) {
        console.log($(this).attr("bid"));
        if ($(".vsliderighthead").length > 0) closeNav();
        showDialingWindow($(this).attr("bid"));
      });

    $("#filter-contact a")
      .unbind()
      .click(function (e) {
        e.preventDefault();

        if ($(this).attr("data-value") == "Favourite") {
          $(".contact-span").text($(this).attr("data-value"));
          let favData = loadFavContact();
          sortarray(favData);
        } else if ($(this).attr("data-value") == "All") {
          $(".contact-span").text($(this).attr("data-value"));
          FilterContact();
        }
      });

    $("#con-search")
      .unbind()
      .keyup(function () {
        FilterContact();
      });

    $(".icon_task_inactive")
      .unbind()
      .click(function (e) {
        if ($("#innerchat-win").attr("bid")) {
          let RP = new TaskPresenter(
            false,
            $("#innerchat-win").attr("bid") + "@" + xmpp.domain
          );
          RP.init();
        }
      });

    $("#inputassigneeto_name")
      .unbind()
      .keyup(function () {
        dropDownContactList(this.value);
      });

    $(".first-half").hide();
    $(".second-half").hide();
    $(".toggle-first").show();

    $(".toggle-first")
      .unbind()
      .click(function () {
        $(".first-half").toggle("slide");
        $(".full-slid").toggle();
        $(".second-half").hide("slide");
        $("#overlay").toggle();
        $(".col-sm-1.main-left4 ul li a.toggle-first").toggleClass("active");
      });
    $(".toggle-seocnd")
      .unbind()
      .click(function () {
        $("#taskname_id").val("");
        $("#enddate").val("");
        $("#Duetime_sec").val("");
        $("#startdate").val("");
        $("#Description").val();
        $("#Section_id").val();
        $("#completetype option:selected").val();
        $(".everweek, .addconlist").hide();
        $(".taskLst").html("");
        document.getElementById("selectpopup").value = "norepeat";
        document.getElementById("completetype").value = "100%";
        $("input[name='weekdaysd']:checkbox").prop("checked", false);
        if ($("#innerchat-win").attr("bid")) {
          console.log(
            "newtask",
            $("#innerchat-win").attr("bid") + "@" + xmpp.domain
          );
          let NT = new CreateTask(
            $("#innerchat-win").attr("bid") + "@" + xmpp.domain
          );
          NT.init();
        }
        $(".second-half").toggle("slide");
      });

    $(".display-empty")
      .unbind()
      .click(function () {
        $(".all-sel").show();
      });

    $("#startdate, #enddate, #repeatday-date, #drepeatsec").datepicker({
      format: "mm/dd/yyyy",
    });

    /* $('#datepicker2').datepicker({
        format: "dd/mm/yyyy"})
       $('#datepicker3').datepicker({
        format: "dd/mm/yyyy"});
       $('#datepicker4').datepicker({
        format: "dd/mm/yyyy"}); */
    // ***************** DATE PICKER JS ENDS HERE

    $(function () {
      $("#Duetime_sec").timepicker({ timeFormat: "h:i A" });
    });
    $("select#tasklist")
      .unbind()
      .change(function () {
        $(this)
          .find("option:selected")
          .each(function () {
            var optionValue = $(this).attr("value");
            if (optionValue) {
              $(".shbx")
                .not("." + optionValue)
                .hide();
              $("." + optionValue).show();
            } else {
              $(".shbx").hide();
            }
          });
      })
      .change();

    $("select#selectpopup")
      .unbind()
      .change(function () {
        $(this)
          .find("option:selected")
          .each(function () {
            var optionValue = $(this).attr("value");
            if (optionValue) {
              $(".shbx")
                .not("." + optionValue)
                .hide();
              $("." + optionValue).show();
            } else {
              $(".shbx").hide();
            }

            console.log("opval", optionValue);
            if (optionValue == "custompopup") {
              $("#custompopup").modal("show");
            } else if (optionValue == "everweek") {
              let RR = new RRulePresenter();

              RR.init();
            }
          });
      })
      .change();

    $("#monthdate").text(new Date().getDate());
    var DaysString = weekAndDay();

    $("#monthdays").text(DaysString);

    $("select#selectrepeat")
      .unbind()
      .change(function () {
        $(this)
          .find("option:selected")
          .each(function () {
            var optionValue = $(this).attr("value");
            if (optionValue) {
              $(".shbx")
                .not("." + optionValue)
                .hide();
              $("." + optionValue).show();
            } else {
              $(".shbx").hide();
            }
          });
      })
      .change();

    /* $('#selectpopup').unbind().change(function() {
        
        var opval = $(this).val();
        console.log("opval", opval)
        if(opval =="custompopup"){
            $('#custompopup').modal("show");
        }
        else if(opval =="everweek")
        {
            let RR = new RRulePresenter();
      
            RR.init(); 
        }
    }); */
    // ***************** OPEN POPUP BASED ON SELECT  OPTION

    // ***************** OPEN POPUP BASED ON SELECT  OPTION
    $("#repeatforever")
      .unbind()
      .click(function () {
        var opval = $(this).val();
        console.log("on");
        $("#selectprtuntilpop").modal("show");
        /* if(opval=="selectprtuntilpop"){
            
        } */
      });

    $(".weekday")
      .unbind()
      .change(function () {
        let RR = new RRulePresenter();

        RR.init();
      });

    $("#custom_rule_btn, #d-repeatsec")
      .unbind()
      .click(function () {
        let RR = new RRulePresenter();

        RR.init();
      });

    $("#task-file")
      .unbind()
      .change(function (files) {
        console.log("calling");
        var size = files.target.files.length;

        console.log("array", GlobalData.array_taskfile);
        let filearray = GlobalData.array_taskfile || [];
        for (var i = 0; i < size; i++) {
          var file = files.target.files[i];
          filearray.push(file.name);
        }
        GlobalData.array_taskfile = filearray;

        let TU = new TaskFileUpload();
        TU.init(files);
      });
  }

  dialPadView(data) {
    var that = this;
    const dropdownListResponse = {
      isContact: true,
      contactarray: data,
    };
    that.dialpadTemplate = dialpadTemplate(dropdownListResponse);
    $("#chatsec").html(that.dialpadTemplate);
    that.dialpadTyping();
    that.clickToCall();
    that.searchTobind();
    that.searchContact(that, data);
  }
  /**
   * Number typing use to dialpad
   */
  dialpadTyping() {
    $(".number-dig").click(function () {
      addAnimationToButton(this);
      var currentValue = $(".phoneString input").val();
      var valueToAppend = $(this).attr("name");
      $(".phoneString input").val(currentValue + valueToAppend);
    });
  }

  /**
   * Click call button to call
   */
  clickToCall() {
    $(".callbtn").click(function () {
      addAnimationToButton(this);
      var currentValue = $(".phoneString input").val();
      if (currentValue.length === 3) {
        showDialingWindow(currentValue);
      } else if (currentValue.length >= 3) {
        directNumber(currentValue);
      } else {
        alert("Invalid numbr");
      }
    });
  }

  /**
   * Add amimation button when click the dialpad buttons
   * @param {thisButton} thisButton
   */
  addAnimationToButton(thisButton) {
    $(thisButton).removeClass("clicked");
    var _this = thisButton;
    setTimeout(function () {
      $(_this).addClass("clicked");
    }, 100);
  }

  /**
   * Search contact by name or number
   */
  searchContact(that, data) {
    $("#con-dial-search")
      .unbind()
      .keyup(function () {
        var inputVal = $(this).val();
        if (that.checkValidation(inputVal, this)) {
          that.filterList(that, data, inputVal);
        }
      });
  }

  checkValidation(inputVal, thisObj) {
    var numericReg = /^[a-z0-9]+$/gi;
    var charReg = /^[a-z]+$/gi;
    var numberReg = /^[0-9]+$/gi;
    if (!numericReg.test(inputVal)) {
      $(thisObj).val("");
    } else if (charReg.test(inputVal)) {
      return 1;
    } else if (numberReg.test(inputVal)) {
      return 1;
    } else {
      $(thisObj).val("");
    }
  }

  /**
   * dialpad search to bind number
   */
  searchTobind() {
    $(".search-call-bind")
      .unbind()
      .on("click", function (event) {
        const ext = $(this).attr("bid");
        showDialingWindow(ext);
      });
  }

  /**
   * Filter the dropdown list
   * @param {string} val
   */
  filterList(that, data, val) {
    var found_names = $.grep(data, function (v) {
      return v.caller_id.toLowerCase().match(val.toLowerCase()) || v.ext == val;
    });
    if (found_names.length > 0) {
      that.dropdownTemplate = dropdownTemplate(found_names);
      $(".dialpad-name-list").html(that.dropdownTemplate);
    } else {
      that.dropdownTemplate = dropdownTemplate(data);
      $(".dialpad-name-list").html(that.dropdownTemplate);
    }
    that.searchTobind();
  }
}
