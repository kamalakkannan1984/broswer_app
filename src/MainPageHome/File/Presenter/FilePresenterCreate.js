/**
 * Presenter first pattern 
 * Note view and model connected here 
 * Alert is the common method for all the alert 
 * store all other common method are in common folder common file 
 * Validation seperate method 

 */
import _storage from '../../Storage/CouchDb';
import Alert from '../../../Utils/Alert';
import GlobalData from '../../Storage/GlobalData';
export default class FilePresenterCreate {
  
    constructor()
    {
       let that = this; 
    }
    
    create_file =(input_param) =>
    {
        var id = "db-2451_files";
        var temp = [];
        temp.id = id;
        let __Model = new _storage();
        __Model.get_Data(temp).then((response)=> {
            let storage = new GlobalData();
            if( (response.status != "404") && (response.name != "not_found") )
            {
                var res_data  = response.data || [];
                res_data.push(input_param);
                let input = {
                    _id: id,
                   _rev: response._rev,
                   data:res_data
               };
                __Model.store_data(input).then((response)=> {
                    if(response.ok == true)
                    {
                         storage.FilesData = res_data;
                    }
                    else{
                         new Alert('#AlertBoxWin',"Try again" );
                    }			
                }).catch(e => console.log("get File err: " + e.message));
            }
            else{
                let input = {
                    _id: id,
                   data:input_param
                };
                __Model.store_data(input).then((response)=> {
                    if(response.ok == true)
                    {
                         storage.FilesData = input_param;
                    }
                    else{
                         new Alert('#AlertBoxWin',"Try again" );
                    }			
                }).catch(e => console.log("get File err: " + e.message));
            }
        }).catch(e => console.log("get Link err: " + e.message));
    }
}
   

