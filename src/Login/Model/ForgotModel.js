import {APIServicesURLs} from '../../Utils/common';
export function getMyAccAPIAccesstokenforLogin(resetemail)
{
          return new Promise((resolve, reject) => {


	$.get('/getAccesstoken', function(data) {
		var weburl = APIServicesURLs.forgotLinkurl;
		var url = '/apiCalling?Stype=ForgetPass&email='+resetemail+'&linkUrl='+weburl+'';
		$.get(url, function(response){resolve(response)}); 	
	});
          });
}		
