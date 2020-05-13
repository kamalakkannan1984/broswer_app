/**
 * Remember Password check the localstorage already stored or not
 * If already stored means get the item and return to view
 * @param  {} {varlogin=localStorage.getItem("remember"
 * @param  {} ||[];if(login.length>0
 * @param  {} {login=JSON.parse(login
 * @param  {} ;if(login.check
 * @param  {} {return(login
 */
export function RemPassword(){
	var login = localStorage.getItem("remember") || [];
	if(login.length > 0)
	{
		login = JSON.parse(login);
		if(login.check)
		{
            return(login);
			
		}
        return undefined;
	}
    return undefined;
}