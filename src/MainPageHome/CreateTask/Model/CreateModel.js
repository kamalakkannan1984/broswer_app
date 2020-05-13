import {APIServicesURLs} from '../../../Utils/common';
export default class CreateModel {
	constructor()
	{
		let _that =this;
	}
   
   addTasktoAPI(taskdata)
   {
	   console.log(taskdata)
	/* {'UID': id, 'SUMMARY' : Taskname, 'DTSTART' :starttime, 'DTEND' : endtime,  'DURATION':Duedate, 'SECTION': $("#Section_id").val(), 'DESCRIPTION':$("#Description").val(), 'SENDER': loggeduser.sip_userid+"@"+xmpp.domain, 'OWNERID':loggeduser.sip_userid+"@"+xmpp.domain,'RECEIVER': this.User, 'COMPLETEDWHEN' : $("#completetype option:selected" ).val(), 'STATUS':false,  'COMPLETEPERCENTAGE':"0%", 'ATTENDEE':AssigneeJid, 'THREAD_ID': id, 'LASTMODIFIED' :	new Date().getTime(), 'FMTTYPE':Files, 'ACTION':"", 'TRIGGER':"", 'SIPID':loggeduser.sip_userid+"@"+xmpp.domain, 'CONV_ID':this.User, 'ASSIGNEECOMPLETED':"", 'RRULE':g_RRule, 'LOCATION':"", 'GROUPID':Groupid, 'DUETIME':$("#Duetime_sec").val(), 'COMPANY_ID':loggeduser.company_id, 'MSGID':""}; */
	
	taskdata.stype = "setTask"
	taskdata.SENDERID = taskdata.SENDER
	taskdata.RECEIVERID =taskdata.RECEIVER
	  console.log(taskdata)
	 
	   return new Promise((resolve, reject) => {

		$.ajax({
			method: "GET",
			url: "/GetMongoData",
			data:taskdata
			 })
		   .done(function( response ) {
			resolve(response);
		  }).fail(function(err){
			alert('Some error API Services',err);
		});


			
		});
	   
   
   }
   




}	
