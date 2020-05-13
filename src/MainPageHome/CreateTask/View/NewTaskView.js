/**
 * MVP design pattern 
 * Presenter first design patttern 
 * View and Model initanate from Presenter 
 * @param  {true}} {this.loginWindow=loginTemplate({login
 */

// Following method in helpers function for dom manupulation 
// eventlisterner method used to add the event listerner. 
// TaskTemplate for load the login template
   
import {GetDom} from '../../../helpers/domManpulation';
import inputbox from '../../../Template/Login/inputbox.hbs';
import NewtaskTemplate from '../../../Template/mainpage/newtask.hbs';
import Alert from '../../../Utils/Alert';
import {dateFormat, generateGUID, isEmpty} from '../../../Utils/common';
import {xmpp} from '../../Common/constant'
import HOmeView from '../../DashBoard/View/HomeView'
import GlobalData from '../../Storage/GlobalData'
import {getTaskUploadURL} from '../../Common/common'

//This class is the first process for all the application follow. 
export default class NewTaskView extends HOmeView{

constructor(toUser)
{
    super();
    //this.taskWindow = NewtaskTemplate(setting);
    this.User = toUser;//toUser;
    
}

//initLogin method used to append the loging template in the index.html 
 initNewTask() {


 }


 
/*
** API Sucess call back function 

*/

sendTaskDetails(handler) {
   let that = this;  
     $("#SubmitTask").unbind().on("click",function(event){
     
         
       that.inputHandler(handler); 

       $("#taskname_id").val("");
       $("#enddate").val("");
     $("#Duetime_sec").val("");
        $("#startdate").val("");
        $("#Description").val();
        $("#Section_id").val();
        $("#completetype option:selected" ).val();
        $(".everweek, .addconlist").hide();
        $(".taskLst").html("");
        document.getElementById('selectpopup').value = "norepeat";
        document.getElementById('completetype').value = "100%";
        $("input[name='weekdaysd']:checkbox").prop('checked',false);
  });
 }// Call prsenterHandler for the api calls

 inputFields() {
    console.log("calling");

    let AssigneeJid			= 	"";
	$( ".taskAvatarimg" ).each(function( index ) {
			var Cid 		= 	$( this ).attr("bid");
			var Cname 		= 	$( this ).text();

	
			if(AssigneeJid =="")
			AssigneeJid = Cid;
			else
				AssigneeJid = AssigneeJid+","+Cid;
			
	});

   let Taskname			= 	$("#taskname_id").val();
   let enddate 	      = 	$("#enddate").val();
	let Duedate				= 	$("#Duetime_sec").val();
   let starttime			= 	$("#startdate").val();

   
	let endtime;
	let id 					= 	generateGUID();
	if(!Taskname)	return {};		

   console.log()
	if(starttime)
	{	
		starttime 	= 	starttime.replace(/-/g,'/')
console.log(starttime);
      starttime	= 	new Date(starttime);
      console.log(starttime);
      starttime 	= 	dateFormat(starttime);
      console.log(starttime);
      starttime	= 	new Date(starttime).getTime()/1000
      console.log(starttime);
	}	
	
	if(enddate)
	{	
		endtime 	= 	enddate.replace(/-/g,'/');
		endtime		= 	endtime+" "+Duedate;
		
		
		endtime	= 	new Date(endtime).getTime()/1000;		
	}
   
   let Groupid = null;

   let isTeam = (this.User.split('@')[1]).split('.')[0];

   if(isTeam ==  "conference")
      Groupid = this.User;
      
      let loggeduser = JSON.parse(localStorage.getItem('login'));


let Files  = getTaskUploadURL();

console.log(Files);


   return {'UID': id, 'SUMMARY' : Taskname, 'DTSTART' :starttime, 'DTEND' : endtime,  'DURATION':Duedate, 'SECTION': $("#Section_id").val(), 'DESCRIPTION':$("#Description").val(), 'SENDER': loggeduser.sip_userid+"@"+xmpp.domain, 'OWNERID':loggeduser.sip_userid+"@"+xmpp.domain,'RECEIVER': this.User, 'COMPLETEDWHEN' : $("#completetype option:selected" ).val(), 'STATUS':false,  'COMPLETEPERCENTAGE':"0%", 'ATTENDEE':AssigneeJid, 'THREAD_ID': id, 'LASTMODIFIED' :	new Date().getTime(), 'FMTTYPE':Files, 'ACTION':"", 'TRIGGER':"", 'SIPID':loggeduser.sip_userid+"@"+xmpp.domain, 'CONV_ID':this.User, 'ASSIGNEECOMPLETED':"", 'RRULE':GlobalData.gRRULE, 'LOCATION':"", 'GROUPID':Groupid, 'DUETIME':$("#Duetime_sec").val(), 'COMPANY_ID':loggeduser.company_id, 'MSGID':""};

   console.log("json data", jsondata)

 
}

 inputHandler(handler)
 {
  
  let inputdata = this.inputFields();
  console.log("handler", inputdata);
   let ValidInputfields = this.ValidateInputvalues(inputdata);
  

  if(ValidInputfields)
       handler(inputdata)
   else
      console.log("filed") 
      //new Alert('#AlertBoxWin',"Please enter all mandatory details." );

 }
 



 ValidateInputvalues(input){
  
   if(isEmpty(input))  return false;

      if (!input.SUMMARY || !input.DTSTART || !input.DTEND)
            return false;
     else
       return true;
 }



}