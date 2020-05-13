/**
 * Presenter first pattern 
 * event view and model connected here 
 * Alert is the common method for all the alert 
 * store all other common method are in common folder common file 
 * Validation seperate method 
 */
import EventView from '../View/EventView';
import EventModel from '../Model/ViewEventModel';
import GlobalData from '../../Storage/GlobalData';
import Alert from '../../../Utils/Alert'

//import CreateEventPresenter from '../../Event/Presenter/CreateEventPresenter';
//import DeleteEventPresenter from '../../Event/Presenter/DeleteEventPresenter';
//import EditEventPresenter from '../../Event/Presenter/EditEventPresenter';

export default class ViewEventPresenter {
  
    constructor()
    {
        let View = new EventView(); // Create the object for View
        View.initEvent(); // init login for append the login template method    
    }
	init=()=>{
		let check_Event = new GlobalData();
		if(check_Event.EventData.length != 0)
		{
			let __Model = new EventModel();
			__Model.get_events().then((response)=> {
				if( (!response[0].Message) && (!response[0].Code) && (response[0].result != -100) )
				{
					check_Event.EventData = response;
					this.show_Event_History(response);
				}
				else{
					var array = [];
					this.show_Event_History(array);
				}
			}).catch(e => console.log("get notes: " + e.message));
        }
        else
        {
            this.show_Event_History(check_Event.EventData);
        }
    }
    
    show_Event_History (data)
	{      
		let View = new EventView();
		View.displayEvent(data);
		//var ddd = this.get_Particualar_Event("1587101952889");
		/*var ddd = this.event_Count("2350@im01.unifiedring.co.uk","data");
		console.log(ddd);
		let event = new CreateEventPresenter();
		event.create_Event();
		let event = new DeleteEventPresenter();
		event.delete_Event("1587102960841");
		let event = new EditEventPresenter();
		event.edit_Event();*/
	}
	
	event_Count(bid, check)
	{
		let _check_event = new GlobalData();
		let _getData = _check_event.EventData;
		if(check == "data")
			return _getData.filter(e => 
				(e.SENDER == bid) ||
				(e.RECEIVER == bid) ||
				(e.GROUPID == bid));
		else
			return _getData.filter(e => 
				(e.SENDER == bid) ||
				(e.RECEIVER == bid) ||
				(e.GROUPID == bid)).length;
	}

	get_Particualar_Event(event_Id)
	{
		let _check_event = new GlobalData();
		let _getData = _check_event.EventData;
		return _getData.find(e => (e.UID == event_Id));
	}
    
}
