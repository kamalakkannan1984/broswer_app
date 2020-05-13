/**
 * Presenter first pattern 
 * Note view and model connected here 
 * Alert is the common method for all the alert 
 * store all other common method are in common folder common file 
 * Validation seperate method 

 */
import DeleteEventView from '../View/DeleteEventView';
import _D_EventModel from '../Model/DeleteEventModel';
import GlobalData from '../../Storage/GlobalData';
import Alert from '../../../Utils/Alert';
export default class DeleteEventPresenter {
  
    constructor()
    {
        let View = new DeleteEventView(); // Create the object for View
        //View.initEvent(); // init login for append the login template method    
    }
	
	delete_Event(event_Id)
	{
		let _model = new _D_EventModel();
		_model.delete_event(event_Id).then((response)=> {
			if(response.Message == "Success")
			{
				let _newdata = new GlobalData();
				var eventList = _newdata.EventData || [];	
				let index = eventList.findIndex(item => (item.UID == event_Id) );
				if(index != -1)
				{
					eventList.splice(index ,1);
					_newdata.EventData = eventList;
					console.log("final del aft",_newdata.EventData)
				}	
			}
			else{
				new Alert('#AlertBoxWin',"Try again" );
			}
		}).catch(e => console.log("get event: " + e.message));
	}
}