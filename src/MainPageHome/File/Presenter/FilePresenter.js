/**
 * Presenter first pattern 
 * Note view and model connected here 
 * Alert is the common method for all the alert 
 * store all other common method are in common folder common file 
 * Validation seperate method 
 * @param  {} {this.View=newLoginView(
 * @param  {} ;this.Model=newLoginModel(
 * @param  {} ;this.View.initLogin(
 * @param  {} ;}init=(
 * @param  {} =>{letthat=this;letrem=RemPassword(
 * @param  {} ;rem&&this.View.RemPasswordView(rem
 * @param  {} ;this.View.addKeyPressUsername(function(event
 * @param  {event.which} {varkeycode=(event.keyCode?event.keyCode
 */
import NoteView from '../View/NoteView';
export default class NotePresenter {
  
    constructor()
    {
        this.View = new LoginView(); // Create the object for View
         // create the object for model 
        this.View.initLogin(); // init login for append the login template method    
    }
	
}
   

