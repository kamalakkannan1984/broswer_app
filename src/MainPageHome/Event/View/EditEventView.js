/**
 * MVP design pattern 
 * Presenter first design patttern 
 * View and Model initanate from Presenter 
 * @param  {true}} {this.loginWindow=loginTemplate({login
 */


import eventTemplate from '../../../Template/Events/event.hbs'; 
import Alert from '../../../Utils/Alert';

//This class is the first process for all the application follow. 
export default class EventView {

  constructor()
  {
    this.eventWindow = eventTemplate();
  }

  //initevent method used to append the loging template in the index.html 
  initEvent() 
  {
    $('.evnt-screen').empty().append(this.eventWindow);
    //this.LoginWindow = GetDom('.note-screen');
  }
  
  inputFields() {
    return {
      summary:"aaaa",
      description:"bbb",
      location:"mumbai",
      sdate: new Date().getTime() / 1000,
      edate: new Date().getTime() / 1000,
      msgid:"1587102084856:msg",
      bid:"2350@im01.unifiedring.co.uk",
      rRule:"dnr",
      uid:"1587101952889"
    }
  }
}