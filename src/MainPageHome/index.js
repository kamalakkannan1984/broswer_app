import HomePrsenter from "./DashBoard/Presenter/HomePresenter";
import CallPresenter from "./Calls/Presenter/CallPresenter";
/**
 * Presenter first design pattern
 * Connector for the all the remaining pattern
 * This file used to initiate the Loginpresenter and presenter initiate the view
 * @param  {} {letLV=newLoginPrsenter(
 * @param  {} ;LV.init(s
 */
export default class Home {
  constructor() {
    let HV = new HomePrsenter();
    let CP = new CallPresenter();
  }
}
