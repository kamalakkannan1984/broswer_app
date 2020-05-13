/**
 * Presenter first pattern 
 * Note view and model connected here 
 * Alert is the common method for all the alert 
 * store all other common method are in common folder common file 
 * Validation seperate method 	
 */
import _storage from '../../Storage/CouchDb';
import GlobalData from '../../Storage/GlobalData';
import Alert from '../../../Utils/Alert';

export default class LinkPresenterCreate {
  
    constructor()
    {
       let that = this;
    }
	create_note=(input_param)=>{
		var id = "db-2451_links"
		var temp = [];
		temp.id = id;					//need to set current jsxc id

		let __Model = new _storage();
		__Model.get_Data(temp).then((response)=> {
			let storage = new GlobalData();
			if( (response.status != "404") && (response.name != "not_found") )
			{
				var link_Data = response.MyData || [];
				link_Data.push(input_param);
				let input = {
					_id: id,
				   _rev: response._rev,
				   MyData:link_Data
			   };
			   __Model.store_data(input).then((response)=> {
				   if(response.ok == true)
				   {
						storage.LinksData = link_Data;
				   }
				   else{
						new Alert('#AlertBoxWin',"Try again" );
				   }			
			   }).catch(e => console.log("get Link err: " + e.message));
			}
			else{
				let input = {
					_id: id,
				   MyData:input_param
			   };
			   __Model.store_data(input).then((response)=> {
					if(response.ok == true)
					{
						storage.LinksData = input_param;
					}
					else{
						new Alert('#AlertBoxWin',"Try again" );
					}
				}).catch(e => console.log("get Link err: " + e.message));
			}
		}).catch(e => console.log("get Link err: " + e.message));
	}
}
   

