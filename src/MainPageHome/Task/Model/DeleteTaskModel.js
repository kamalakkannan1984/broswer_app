import {APIServicesURLs} from '../../../Utils/common';
export default class DeleteTaskModel {
	constructor()
	{
	let _that =this;
	}
   
   deleteTask()
   {
	  
	   return new Promise((resolve, reject) => {

		$.ajax({
			method: "GET",
			url: "/GetMongoData",
			data: { 
				stype: "DeleteTaskbyUID",
				linkUrl: APIServicesURLs.deleteTask,
				SIPID: jsxc.bid
				
			  }
			 })
		   .done(function( response ) {
			resolve(response);
		  }).fail(function(err){
			alert('Some error API Services',err);
		});


			
		});
	   
   
   }
   




}



