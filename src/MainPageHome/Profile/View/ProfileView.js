import profileTemplate from "../../../Template/mainpage/profile/profile.hbs";
import availablestatus from "./availableshare";
import HOmeView from "../../DashBoard/View/HomeView";
import GlobalData from "../../Storage/GlobalData";
import CallPresenter from "../../Calls/Presenter/CallPresenter";
export default class ProfileView extends HOmeView {
  constructor(data) {
    super();
    this.profileWindow = profileTemplate(data);
    this.newdata = new GlobalData();
  }

  init() {
    console.log(JSON.stringify(this.newdata.ContactData));

    let homeview = super.getView;

    this.profile = $(homeview.find("#profile"));
    this.profile.append($(this.profileWindow));

    $("#ParentWindow").append(homeview);

    new availablestatus(this.profile).loadAvailableStatus();

    $("#edit-user-icon").click(function () {
      $(".user-main-banner-edit-sec ").addClass("user-show");
      $(".user-main-banner-sec").addClass("user-hide");
    });

    $("#cancel-user-btn,#update-user-btn").click(function () {
      $(".user-main-banner-edit-sec ").removeClass("user-show");
      $(".user-main-banner-sec").removeClass("user-hide");
    });

    $(".loadersimg").hide();
    this.openCallWindow();
  }

  openCallWindow() {
    $("#callWindowOpen").on("click", function (event) {
      const callPresenter = new CallPresenter();
      callPresenter.init();
    });
  }
}
