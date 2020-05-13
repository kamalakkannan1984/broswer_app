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
import NewTaskView from '../View/NewTaskView';
import CreateModel from '../Model/CreateModel';

export default class NewtaskPresenter {
  
    constructor(toUser)
    {
        
       /*  const setting = {tasksetting:{title:{  
            id: 'taskname_id', 
            type: 'text',
            name: 'task-name',
            display: "placeholder='Title'",
            maxlength:'64'
          },
          assignee:{
              id: 'inputassigneeto_name', 
              type: 'text',
              name: 'Assignee',
              display: "placeholder='Assignee'",
              maxlength:'64'
            },
            startdate:{
                id: 'expand-js-date', 
                type: 'date',
                name: 'Assignee',
                display: "placeholder='MM/DD/YYYY'",
                maxlength:'64'
              },
              enddate:{
                id: 'expanddue-js-date', 
                type: 'date',
                name: 'Assignee',
                display: "placeholder='MM/DD/YYYY'",
                maxlength:'64'
              }
        }} */
        this.View = new NewTaskView(toUser); // Create the object for View
         // create the object for model 
        this.View.initTask(); // init login for append the login template method 
        
    }
    /* 
    *** init function initiate on load event 
    */
    init=()=>{
        let that=this; // this stored in that for function scope 
        console.log("Taskinit calling");
        this.View.sendTaskDetails(function(inputdata){
            (that.createTask(inputdata));
        });
    }

        
    createTask(inputdata){
        let __NModel = new CreateModel();
        console.log("inputdata", inputdata);
        
        __NModel.addTasktoAPI(inputdata).then((response)=>
        {
           
            
     
        console.log("response", response)
     
        }).catch(e => console.error("Login Module Critical failure: " + e.message));

    }


  
    }
   

