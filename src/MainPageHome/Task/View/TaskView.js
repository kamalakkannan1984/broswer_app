/**
 * MVP design pattern 
 * Presenter first design patttern 
 * View and Model initanate from Presenter 
 * @param  {true}} {this.loginWindow=loginTemplate({login
 */

// Following method in helpers function for dom manupulation 
// eventlisterner method used to add the event listerner. 
// TaskTemplate for load the login template
   

import taskTemplate from '../../../Template/mainpage/task.hbs';
import CreateTask from '../../CreateTask/Presenter/NewtaskPresenter';
import Alert from '../../../Utils/Alert';
import DeleteTask from '../Presenter/DeleteTaskPresenter';
import HOmeView from '../../DashBoard/View/HomeView'
//This class is the first process for all the application follow. 
export default class TaskView extends HOmeView{

constructor(data)
{
    super();
    this.taskWindow = taskTemplate(data);
    
}

//initLogin method used to append the loging template in the index.html 
 initTask() {
  
   $('#task-list-sec').html(this.taskWindow);

   /* $(".first-half").hide();
   $(".second-half").hide();
   $(".toggle-first").show();

   $('.toggle-first').click(function () {
       $(".first-half").toggle("slide");
        $(".full-slid").toggle();
       $(".second-half").hide("slide");
       $("#overlay").toggle();
       $(".col-sm-1.main-left4 ul li a.toggle-first").toggleClass("active");
 });
 $('.toggle-seocnd').click(function () {
         $(".second-half").toggle("slide");
     });

     $('.display-empty').click(function () {
       $(".all-sel").show();
   }); */

   $('.newtask_btn').on("click",function(event){
      let CT = new CreateTask();
      CT.init();
    })


    $('.Delete_btn').on("click",function(event){
      let DT = new DeleteTask(tid);
      DT.init();
    })


 }


 
/*
** API Sucess call back function 
*/
apisucess(value){
                 if (!value)
                 {
                    
                    $('.loadersimg').hide(300); // Preload hide
                    new Alert('#AlertBoxWin',"Your username or password is wrong!");                

                 }
                 else
                 {
                  if(window.loggedSuccess) window.loggedSuccess();
                  
                 window.location = "mainWindow.html"; 
                 }

}
// Call prsenterHandler for the api calls
 CallPresenterHandler(handler)
 {
  
  let ValidInputfields = this.ValidUserPwd(this.inputFields.username);
  
  console.log(ValidInputfields);
  if(ValidInputfields)
  {
                event.preventDefault();
                const source = $(this);
                $(source).find('.submit').button('reset');
                $(source).find('.alert').hide();

                 //call check login method for API model 
                handler(this.inputFields)
                
  }
  else{
   new Alert('#AlertBoxWin',"Enter valid mail id or direct number" );
  } 

 }
// VAlidate the username and password valid or not 
 ValidUserPwd(username){
  
  if (isValidEmailAddress(username) == false && !Number.isInteger(parseInt(username)))
		{
            // validation if username is number (direct number)
            
     		return Number.isInteger(parseInt(username))?true:false;
    }
    else
    {
      
      return true;
    }
}

}