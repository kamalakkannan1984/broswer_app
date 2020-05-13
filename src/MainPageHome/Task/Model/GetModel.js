import {APIServicesURLs} from '../../../Utils/common';
export default class GetModel {
	constructor()
	{
	let _that =this;
	}
   
   getTasklist()
   {
	  console.log("getTasklist ll")
	   return new Promise((resolve, reject) => {

		$.ajax({
			method: "GET",
			url: "/GetMongoData",
			data: { 
				stype: "getTask",
				linkUrl: APIServicesURLs.getTask,
				SIPID: "2152@im01.unifiedring.co.uk"
				
			  }
			 })
		   .done(function( response ) {
			   console.log(response)
			resolve(response);
		  }).fail(function(err){
			alert('Some error API Services',err);
		});


			
		});
	   
   
   }
   




}



