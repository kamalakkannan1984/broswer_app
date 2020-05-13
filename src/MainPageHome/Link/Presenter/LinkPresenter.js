/**
 * Presenter first pattern 
 * Note view and model connected here 
 * Alert is the common method for all the alert 
 * store all other common method are in common folder common file 
 * Validation seperate method 
 */
import LinkView from '../View/LinkView';
import LinkModel from '../Model/LinkModel';
import GlobalData from '../../Storage/GlobalData';
import _storage from '../../Storage/CouchDb';
export default class LinkPresenter {
  
    constructor()
    {
        let View = new LinkView(); // Create the object for View
        View.initLogin(); // init login for append the login template method    
    }
	init=()=>{
		console.log("dd");
		//let check_link = new GlobalData();
		//console.log(check_link.linksData.length);
		//if(check_link.linksData.length != 0)
		//{
			var temp = [];
			temp.id = "db-2451_links";

			let __Model = new _storage();
			__Model.get_Data(temp).then((response)=> {
				console.log("res",response)
				if( (!response[0].Message) && (!response[0].Code) && (response[0].result != -100) )
				{
					//check_link.linksData = response;
					this.get_Link_History(response);
				}
				else{
					var array = [];
					this.get_Link_History(array);
				}
			}).catch(e => console.log("get notes: " + e.message));
		//}
	}
	
	get_Link_History(data)
	{
		console.log("data is ",data);
		let _model = new LinkView();
		_model.displayLink();
	}
}
   

