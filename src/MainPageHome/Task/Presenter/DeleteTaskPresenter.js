/**
 * Presenter first pattern 
 * Login view and model connected here 
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

import DeleteModel from '../Model/DeleteTaskModel';

export default class DeleteTaskPresenter {
  
    constructor(tid)
    {
        
       this.tid = tid; 
    }
    /* 
    *** init function initiate on load event 
    */
    init=()=>{
        let that=this; // this stored in that for function scope 
        
        deleteTask();
    }

        
    deleteTask(){
        let __Model = new DeleteModel();
        __Model.deleteTask(this.tid).then((response)=>
        {
           
            
     
        
     
        }).catch(e => console.error("Login Module Critical failure: " + e.message));

    }


  
    }
   

