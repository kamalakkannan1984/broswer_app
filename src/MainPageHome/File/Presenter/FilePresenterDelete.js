/**
 * Presenter first pattern 
 * Note view and model connected here 
 * Alert is the common method for all the alert 
 * store all other common method are in common folder common file 
 * Validation seperate method 

 */
import FileView from '../View/FileViewDelete';
import _storage from '../../Storage/CouchDb';
import Alert from '../../../Utils/Alert';
import GlobalData from '../../Storage/GlobalData';
export default class FilePresenterDelete {
  
    constructor()
    {
        this.View = new FileView(); // Create the object for View
        this.View.initFile(); // init login for append the login template method    
    }
    
    delete_file(msg_id)
    {
        let id = "db-2451_files";
		var temp = [];
		temp.id = id;
		let __Model = new _storage();
		__Model.get_Data(temp).then((response)=> {
            console.log(response);
			if( (response.status != "404") && (response.name != "not_found") )
			{
				let storage = new GlobalData();
                let L_data = response.data || []
                let index = L_data.findIndex(item => (item.msid == msg_id) );
				if(index != -1)
				{
					L_data.splice(index ,1);
					let input = {
						_id: id,
					   _rev: response._rev,
					   data:L_data
				   };
				   __Model.store_data(input).then((response)=> {
					   if(response.ok == true)
					   {
                            storage.FilesData = L_data;
					   }
					   else{
							new Alert('#AlertBoxWin',"Try again" );
					   }			
				   }).catch(e => console.log("get File err: " + e.message));
				}
			}
			else{
				new Alert('#AlertBoxWin',"Try again" );
			}
		})
    }
}
   

