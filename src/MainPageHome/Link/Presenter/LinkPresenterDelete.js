/**
 * Presenter first pattern 
 * Note view and model connected here 
 * Alert is the common method for all the alert 
 * store all other common method are in common folder common file 
 * Validation seperate method 
 */
import LinkDel from '../View/LinkDelete';
import _storage from '../../Storage/CouchDb';
import Alert from '../../../Utils/Alert';
import GlobalData from '../../Storage/GlobalData';

export default class LinkPresenterDelete {
  
    constructor()
    {
		let that = this;  
    }
	
	delView()
	{
		let View = new LinkDel(); 	// Create the object for View
        View.initLink(); 			// init login for append the login template method  
	}

	delete_Link(msid)
	{
		let id = "db-2451_links";
		var temp = [];
		temp.id = id;
		let __Model = new _storage();
		__Model.get_Data(temp).then((response)=> {
			if( (response.status != "404") && (response.name != "not_found") )
			{
				let storage = new GlobalData();
				let L_data = response.MyData || [];
				let index = L_data.findIndex(item => (item.msgid == msid) );
				if(index != -1)
				{
					L_data.splice(index ,1);
					let input = {
						_id: id,
					   _rev: response._rev,
					   MyData:L_data
				   };
				   __Model.store_data(input).then((response)=> {
					   if(response.ok == true)
					   {
							storage.LinksData = L_data;
					   }
					   else{
							new Alert('#AlertBoxWin',"Try again" );
					   }			
				   }).catch(e => console.log("get Link err: " + e.message));
				}
			}
			else{
				new Alert('#AlertBoxWin',"Try again" );
			}
		})
	}
}
   

