/**
 * MVP design pattern 
 * Presenter first design patttern 
 * View and Model initanate from Presenter 
 * @param  {true}} {this.loginWindow=loginTemplate({login
 */

import eventTemplate from '../../../Template/Events/event.hbs'; 

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


  // displaying sorted notes in note view
  displayEvent(data)
  {
    console.log("final view data is",data);
  }

}