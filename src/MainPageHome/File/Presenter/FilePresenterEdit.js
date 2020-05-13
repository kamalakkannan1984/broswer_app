/**
 * Presenter first pattern 
 * Note view and model connected here 
 * Alert is the common method for all the alert 
 * store all other common method are in common folder common file 
 * Validation seperate method 

 */
import _storage from '../../Storage/CouchDb';
import FileViewEdit from '../View/FileViewEdit';
import GlobalData from '../../Storage/GlobalData';

export default class FilePresenterEdit {
  
    constructor()
    {
        let that  = this;
    }

    editFileName =(FileName, msgId) =>
    {
        let edit = new FileViewEdit(); // Create the object for View
        edit.initFile();               // init login for append the login template method
    }
    
    editedFilename =(FileName, msgId) =>
    {
        let id = "db-2451_files";
		var temp = [];
		temp.id = id;
		let __Model = new _storage();
		__Model.get_Data(temp).then((response)=> {
			if( (response.status != "404") && (response.name != "not_found") )
			{
				let storage = new GlobalData();
				let L_data = response.data || [];
				let index = L_data.findIndex(item => (item.msid == msgId) );
				if(index != -1)
				{
					L_data[index].name = FileName;
					let input = {
						_id: id,
					   _rev: response._rev,
					   data:L_data
				   };
				   __Model.store_data(input).then((response)=> {
					   if(response.ok == true)
					   {
                            storage.FilesData = L_data;
                            console.log("final data",storage.FilesData);
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