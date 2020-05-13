/**
 * Presenter first pattern 
 * Note view and model connected here 
 * Alert is the common method for all the alert 
 * store all other common method are in common folder common file 
 * Validation seperate method 
 */
import FileView from '../View/FileView';
import _storage from '../../Storage/CouchDb';
import GlobalData from '../../Storage/GlobalData';

export default class FilePresenterView {
  
    constructor()
    {
        this.View = new FileView();   // Create the object for View
        this.View.initFile();		 // init login for append the login template method    
    }
    
    init=()=>
    {
        let that  =  this;
		setTimeout(function(){
			var temp = [];
			temp.id = "db-2451_files";

			let __Model = new _storage();
			__Model.get_Data(temp).then((response)=> {
                let storage = new GlobalData();
				if( (response.status != "404") && (response.name != "not_found") )
				{
					var result = response.data || [];
					storage.FilesData = result;
					that.get_File_History(storage.FilesData);
				}
				else{
					var array = [];
					storage.FilesData = array;
					that.get_File_History(storage.FilesData);
				}
			}).catch(e => console.log("get Link err: " + e.message));
		},2000)
    }

    get_File_History(data)
    {
		console.log("data",data);
        let _model = new FileView();
		let returnVal = this.file_Count("2244@im01.unifiedring.co.uk", "data")  // need to bid  here
        _model.displayFile(returnVal);
    }

    file_Count(bid, check)
	{
		let check_file = new GlobalData();
		let _getData = check_file.FilesData;
		if(check == "data")
			return _getData.filter(e => 
				(e.bid == bid) )
		else
			return _getData.filter(e => 
				(e.bid == bid) ).length;
	}

	get_Particualar_File(File_Id)
	{
		let check_file = new GlobalData();
		let _getData = check_file.FilesData;
		return _getData.find(e => (e.msgid == File_Id));
	}
}
   

