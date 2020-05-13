/**
 * Presenter first pattern 
 * Note view and model connected here 
 * Alert is the common method for all the alert 
 * store all other common method are in common folder common file 
 * Validation seperate method 
 */
import LinkView from '../View/LinkView';
import _storage from '../../Storage/CouchDb';
import GlobalData from '../../Storage/GlobalData';

export default class LinkPresenterView {
  
    constructor()
    {
        let View = new LinkView(); 	// Create the object for View
		View.initLink(); 			// init login for append the login template method   
	}
		
	init=()=>{
		let that  =  this;
		//setTimeout(function(){
			var temp = [];
			temp.id = "db-2451_links";

			let __Model = new _storage();
			__Model.get_Data(temp).then((response)=> {
				let storage = new GlobalData();
				if( (response.status != "404") && (response.name != "not_found") )
				{
					console.log(response.MyData)
					var result = response.MyData || [];
					storage.LinksData = result;
					that.get_Link_History();
				}
				else{
					var array = [];
					storage.LinksData = array;
					that.get_Link_History();
				}
			}).catch(e => console.log("get Link err: " + e.message));
		//},2000)
	}

	get_Link_History=()=>
	{
		let _model = new LinkView();
		let returnVal = this.link_Count("2350@im01.unifiedring.co.uk", "data")  // need to bid  here
		_model.displayLink(returnVal);
	}
	
	link_Count(bid, check)
	{
		let check_link = new GlobalData();
		let _getData = check_link.LinksData;
		if(check == "data")
			return _getData.filter(e => 
				(e.bid == bid) )
		else
			return _getData.filter(e => 
				(e.bid == bid) ).length;
	}

	get_Particualar_Link(Link_Id)
	{
		let check_link = new GlobalData();
		let _getData = check_link.LinksData;
		return _getData.find(e => (e.msgid == Link_Id));
	}

}
   

