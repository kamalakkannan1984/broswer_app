/**
 * Presenter first pattern 
 * Note view and model connected here 
 * Alert is the common method for all the alert 
 * store all other common method are in common folder common file 
 * Validation seperate method 

 */
import EditEventView from '../View/EditEventView';
import EditEventModel from '../Model/EditEventModel';
import GlobalData from '../../Storage/GlobalData';
import Alert from '../../../Utils/Alert'
export default class EditEventPresenter {
  
    constructor()
    {
        let View = new EditEventView(); // Create the object for View
        View.initEvent(); // init login for append the login template method    
    }
	
	edit_Event()
	{
		let _eventview = new EditEventView();
		var input_data = _eventview.inputFields();
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
		tempData.UID = input_data.uid;
		tempData.COMPLETEPERCENTAGE = '';
		tempData.SECTION ='';
		tempData.RECEIVER = (input_data.bid.includes("@conference")) ? '' : input_data.bid;
		tempData.GROUPID  = (input_data.bid.includes("@conference")) ? input_data.bid : '';
	
		let __Model = new EditEventModel();
		__Model.edit_events(tempData).then((response)=> {
			if(response.Message == "Success")
			{ 
				let _newdata = new GlobalData();
				var eventList = _newdata.EventData || [];
				let index = eventList.findIndex(item => (item.UID == input_data.uid) );
				if(index != -1)
				{
					eventList[index].SUMMARY = input_data.summary;
					eventList[index].DESCRIPTION = input_data.description;
					eventList[index].DTSTART =  input_data.sdate;
					eventList[index].DTEND =  input_data.edate; 
					eventList[index].LOCATION = input_data.location;
					eventList[index].RRULE = input_data.rRule;
					_newdata.EventData = eventList;
				}
			}
			else{
				new Alert('#AlertBoxWin',"Try again" );
			}
		}).catch(e => console.error("delete notes: " + e.message));
	}
}
   

