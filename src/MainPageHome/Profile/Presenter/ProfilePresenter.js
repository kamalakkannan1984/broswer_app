import ProfileView from '../View/ProfileView';
import {loggedUser} from '../Model/ProfileModel';
import GlobalData from '../../Storage/GlobalData';
export default class ProfilePresenter {
    constructor() {
        
        this.Loggeduser =JSON.parse(localStorage.getItem('login'));
        let {username,profileUrl,ext} = this.Loggeduser || {username:''};
        let newdata = new GlobalData();
        /***************************************************************
         * Following code used for global data store
         */
        newdata.ContactData=this.Loggeduser;
        console.log(JSON.stringify(newdata.ContactData));
        /*************************************************************
         * 
         */
        this.profileview = new ProfileView({'username':username,'profileurl':profileUrl, ext:ext});
        this.profileview.init();
   
       
    } 

    
 setpresence(input)
{
	
	var bid = jsxc.bid;
	jsxc.selfPresence(bid, input);		
}

 loadlocalimg()
{
	if((loggeduser.role_id != undefined) && (loggeduser.role_id == 1)) 
		$('.proAdmin').css("display","block");
	var name = loggeduser.username;
	if(name.length > 28)
		name = name.substring(0,28)+"...";
	$("#ownavator_text").find("h3").html(name.trim());

	setTimeout(function()
	{
		var img =	jsxc.storage.getUserItem('avatar','own') || "images/avatar_profile_pic.svg";
		$("#ownavator").attr("src",img);
		if(window.isPageLoaded) window.isPageLoaded();
		var presence = jsxc.storage.getUserItem('presence') || "chat";
		switch(presence)
		{
			/*case 'chat':
				$('#ownavatorStatus').attr("src","images/green-active.svg");
				break;*/
			case 'away':
				$('#ownavatorStatus').attr("src","images/yellow.png");
				break;
			case 'dnd':
				$('#ownavatorStatus').attr("src","images/red.png");
				break;
			case 'xa':
				$('#ownavatorStatus').attr("src","images/grey.png");
				break;
			default:
				$('#ownavatorStatus').attr("src","images/green-active.svg");
				break;
		}
		setpresence(presence);
		if(img == "images/avatar_profile_pic.svg")
		{
			setTimeout(function()
			{
				var img =	jsxc.storage.getUserItem('avatar','own') || "images/avatar_profile_pic.svg";
				$("#ownavator").attr("src",img);
			},5000);
		}
	},5000)
}


}