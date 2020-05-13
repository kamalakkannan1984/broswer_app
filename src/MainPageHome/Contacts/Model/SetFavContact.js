import {APIServicesURLs} from '../../../Utils/common';


export default class GetContacts {
	constructor()
	{
	let _that =this;
	}
   
    setFav(ext, status)
   {
	   console.log("get contact list");
	//this.LoggedDetails = localStorage.getItem("login");

	this.LoggedDetails = JSON.parse(localStorage.getItem('login'));

	  
	   return new Promise((resolve, reject) => {
		
		$.ajax({
			method: "GET",
			url: "/apiCalling",
			data: { 
				Stype: "setFav",
				linkUrl: APIServicesURLs.favcontact,
				dir_user_id: this.LoggedDetails.dir_user_id,
                company_id:this.LoggedDetails.company_id,
                mobileno:ext,
                status:status
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



