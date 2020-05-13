/**
 * Presenter first pattern 
 * Note view and model connected here 
 * Alert is the common method for all the alert 
 * store all other common method are in common folder common file 
 * Validation seperate method 
*/
import CreateEventView from '../View/CreateEventView';
import _C_EventModel from '../Model/CreateEventModel';
import GlobalData from '../../Storage/GlobalData';
import Alert from '../../../Utils/Alert';
export default class CreateEventPresenter {
  
    constructor()
    {
		let View = new CreateEventView(); // Create the object for View
        View.initEvent(); 				  // init login for append the login template method  
    }
	
	create_Event() 
	{
		let _eventview = new CreateEventView();
		var input_data = _eventview.inputFields();
		var eventId = Math.round((Math.pow(36, 8 + 1) - Math.random() * Math.pow(36, 8))).toString(36).slice(1);
		var tempData = {};
		tempData.stype = "createevent";
		tempData.LASTMODIFIED = input_data.sdate;
		tempData.LOCATION = input_data.location;
		tempData.DUETIME = '';
		tempData.COMPANY_ID = 1659      					 //loggeduser.company_id;
		tempData.RRULE = input_data.rRule;
		tempData.DTSTART = input_data.sdate;
		tempData.STATUS = '';
		tempData.FMTTYPE = '';
		tempData.MSGID = input_data.msgid;
		tempData.SENDER = "2451@im01.unifiedring.co.uk"       //jsxc.bid;
		tempData.TRIGGER = '';
		tempData.THREAD_ID = '';
		tempData.OWNERID = "2451@im01.unifiedring.co.uk"       //jsxc.bid;
		tempData.CONV_ID = input_data.bid;
		tempData.DESCRIPTION = input_data.description;
		tempData.ASSIGNEECOMPLETED = '';
		tempData.ACTION = '';
		tempData.DTEND = input_data.edate;
		tempData.ATTENDEE = '';
		tempData.SUMMARY = input_data.summary;
		tempData.SIPID = "2451"         						 //jsxc.bid.split("@")[0];
		tempData.COMPLETEDWHEN = '';
		tempData.UID = eventId;
		tempData.COMPLETEPERCENTAGE = '';
		tempData.SECTION ='';
		tempData.RECEIVER = (input_data.bid.includes("@conference")) ? '' : input_data.bid;
		tempData.GROUPID  = (input_data.bid.includes("@conference")) ? input_data.bid : '';

		let _model = new _C_EventModel();
		_model.create_event(tempData).then((response)=> {

			if(response.Message == "Success")
			{
				let _newdata = new GlobalData();
				var eventList = _newdata.EventData || [];
				var temp = [];
				temp.Id =  "";
				temp.LASTMODIFIED = input_data.sdate;
				temp.LOCATION = input_data.location;
				temp.DUETIME = '';
				temp.COMPANY_ID = 1659      					 //loggeduser.company_id;
				temp.RRULE = input_data.rRule;
				temp.DTSTART = input_data.sdate;
				temp.STATUS = '';
				temp.FMTTYPE = '';
				temp.MSGID =  input_data.msgid;
				temp.SENDER =  "2451@im01.unifiedring.co.uk"       //jsxc.bid;
				temp.TRIGGER = '';
				temp.THREAD_ID = '';
				temp.OWNERID =  "2451@im01.unifiedring.co.uk"       //jsxc.bid;
				temp.CONV_ID = input_data.bid;
				temp.DESCRIPTION = input_data.description;;
				temp.ASSIGNEECOMPLETED = '';
				temp.ACTION = '';
				temp.DTEND = input_data.edate;
				temp.ATTENDEE = '';
				temp.SUMMARY = input_data.summary;
				temp.SIPID = "2451"         						 //jsxc.bid.split("@")[0];
				temp.COMPLETEDWHEN = '';
				temp.UID = eventId;
				temp.COMPLETEPERCENTAGE = '';
				temp.SECTION = '';
				temp.RECEIVER = (input_data.bid.includes("@conference")) ? '' : input_data.bid;
				temp.GROUPID  = (input_data.bid.includes("@conference")) ? input_data.bid : '';
				eventList.push(temp)
				_newdata.EventData = eventList;
			}
			else{
				new Alert('#AlertBoxWin',"Try again" );
			}
		}).catch(e => console.log("get notes: " + e.message));
	}
    
}
   

