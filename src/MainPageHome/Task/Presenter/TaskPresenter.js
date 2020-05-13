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
import TaskView from '../View/TaskView';
import GetModel from '../Model/GetModel';
import GlobalData from '../../Storage/GlobalData';
import {getAssineeNameList, convertGMTtoLocalEnddate, groupingTasks} from '../../Common/common'

export default class TaskPresenter {
 
    constructor(isCount, Userid)
    {
         this.isCount = isCount;
         this.Userid = Userid;
    }
    /* 
    *** init function initiate on load event 
    */
    init=()=>{
            
        let that=this; // this stored in that for function scope 
        that.getTaskdata()   
                 
    }

        
        
        getTaskdata(){
           
            let __Model = new GetModel();
            __Model.getTasklist().then((response)=>
            {
               
                if( (response.Code != 1008) && (response != "failure") ) 
                {
                    if(response[0].result == -100)
                    {
                        //this.View.apisucess(false, response);
                        let taskResponse = {task:false, data:response}
                        this.View = new TaskView(taskResponse); // Create the object for View
         
                        this.View.initTask();
                        return;
                    }
                   // this.View.apisucess(true, response);
                        console.log("get", [response])
                        GlobalData.TaskData = response;
                        console.log("get", this.isUser)
                       
                     
                        let  userTaskData = this.getTaskcountByUser(this.Userid)
                        
console.log("this.isCount", this.isCount);
                        if(!this.isCount)
                        {

                            
                            userTaskData.forEach(function(number, i) { 
                                console.log( response[i].SUMMARY);
                                response[i].ATTENDEE = getAssineeNameList(number.ATTENDEE);
                                response[i].DTEND = convertGMTtoLocalEnddate(number.DTEND*1000);

                                
                            });
                            var grouping =  groupingTasks(userTaskData);

                            let taskResponse = {task:true, data:grouping}

                        
                         
                            console.log("taskResponse", taskResponse)
                           this.View = new TaskView(taskResponse); // Create the object for View
             
                           this.View.initTask(); 
                        }
                        
                           
                           
                      
                        
                   
                }
                else
                {
                   /*  let taskResponse = {task:false, data:response}
                        this.View = new TaskView(taskResponse); // Create the object for View
         
                        this.View.initTask(); */
                   // this.View.apisucess(false, response);
                }
           
            
         
            }).catch(e => console.error("Login Module Critical failure: " + e.message));
                 
        }


        getTaskcountByUser(id){

            console.log("filterdData", id);
    var filterdData = GlobalData.TaskData.filter(data => data.RECEIVER == id || data.SENDER == id ||  data.OWNERID == id)
    console.log("filterdData", filterdData);
    console.log("filterdData", filterdData.length);
    $("#tsk_cnt").text(filterdData.length)
    return filterdData;
          
        }
       
    }
   

