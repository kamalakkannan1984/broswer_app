import {APIServicesURLs} from '../../../Utils/common';
export default class CreateModel {
	constructor()
	{
		let _that =this;
	}
   
    uploadTaskFiletoAPI(file)
   {
      
    let formData 		= 	new FormData();
	formData.append('file', file);
	 
	   return new Promise((resolve, reject) => {

		$.ajax({
			type: "post",
			crossDomain: true,
			processData: false,
			contentType: false,
			data:formData,
			url: "/taskFileUpload",
			async: false,
			 })
		   .done(function( response ) {
			resolve(response);
		  }).fail(function(err){
			alert('Some error API Services',err);
		});


			
		});
	   
   
   }
 
}	
