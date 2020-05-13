import {device_id} from './../Common/Common';
import {APIServicesURLs} from '../../Utils/common';
export default class LoginService {
	constructor()
	{
	let _that =this;
	}
	loginprocess(username,password) {
		$('.loadersimg').css("display","block");
			let local_ipaddress=undefined;
			local_ipaddress= 	local_ipaddress || "192.168.14.114";
			
      return new Promise((resolve, reject) => {
          $.get('/getAccesstoken', function(data) {
          $.ajax({
					method: "POST",
					url: "/Login",
					data: { 
						login_user_name: username,
						login_password: password,
						login_source: 'web',
						login_device_id: device_id,
						login_ipaddress: local_ipaddress,
						linkUrl: APIServicesURLs.loginLinkurl
					  }
				 	})
			   	.done(function( response ) {
					resolve(response);
			 	 });
                
            }).fail(function(err){
				alert('Some error API Services',err);
			});
        });
   }

 
   




}
