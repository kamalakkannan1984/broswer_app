
window.addEventListener('new-window', (e) => {
	 
    const protocol = require('url').parse(e.url).protocol
    if (protocol === 'http:' || protocol === 'https:') {
      //shell.openExternal(e.url)
      let win = new BrowserWindow({width: 800, height: 600})
      win.loadURL(e.url);
    }
}); 	

var FillupInvitation = function(){
	
    window.invitation 	= 	[];
    var toinvite 		= 	'';
	
	$("#invitemode").show();
	
    $('.groupinvites:checked').each(function(t,i){

		var t 	= 	i.value;	
		var groupchatname 	= 	$("#groupchat_name").val();
        if ($('#invitemode').val() == 'chat'){
            if (window.LastChatWindow == undefined || window.LastChatWindow.indexOf('conference')<0){
                window.LastChatWindow = groupchatname+"@"+window.ConferenceDomain;
            }
            var z = $msg({
                to: t + '@' +jsxc.xmpp.conn.domain, from: jsxc.xmpp.conn.jid
             }).c('x', {
                xmlns: 'jabber:x:conference', 
                jid: groupchatname+"@"+window.ConferenceDomain
             });
			 
             window.invitation.push(z);
            var d = $('.sip' + t).parent().find('.jsxc_name').html()
            toinvite = toinvite + d + '<'  + t + '>';
        } else {
            window.invitation.push(t);
        }
		
		if ($('#invitemode').val() == 'chat')
		{
			$("#create_group").show();
			$("#inviteall").hide();
			$("#invitemode").show();
		}
		else
		{
			$("#create_group").hide();
			$("#inviteall").show();
			$("#invitemode").show();

		}		
    })

    $("#inviteall").unbind();

    $("#inviteall").click(function(){
			
		if ($('#invitemode').val() == 'chat')
		{
			$("#GroupChatnamepopup").modal();
			$("#groupchat_name").val("");
		}
		else if ($('#invitemode').val() == 'video')
		{
			if (window.invitation.length>0){
				ShowLocalVideo();	
				$(".groupinvites").hide();
			}
		}
		else 
		{
			
			for(i=0;i<window.invitation.length;i++){
				CallNow(window.invitation[i],"audio")
				$(".groupinvites").hide();
			}
		}	
    });
		
	$("#invitemode").on('change', function(e){
		$('.groupinvites').removeAttr('checked');
		if($('#invitemode').val() == "chat")
		{	
			$(".groupinvites").hide();
			$("#create_group").hide();
			$("#inviteall").show();
			$("#invitemode").show();
		}
		else if($('#invitemode').val() == "audio" || $('#invitemode').val() == "video")
		{
			$(".groupinvites").show();
			$("#create_group").hide();
			$("#inviteall").show();
			$("#invitemode").show();
		}
		else
		{
			$(".groupinvites").hide();
			$("#create_group").hide();
			$("#inviteall").hide();
			$("#invitemode").show();
		}	
	})
		
	$("#create_group").click(function(){
		
		var roomname = $("#groupchat_name").val();
			if( (roomname == "") || (roomname == undefined) )
			{
				showAlert("Warning","Invalid TeamName");
				return;				
			}

           for(i=0;i<window.invitation.length;i++){
               jsxc.xmpp.conn.send(window.invitation[i]);
           }
			var self = jsxc.muc;
				
			var room = generateTaskID();
			//room :::rrrrrrrrrrrr@conference.im03.vectone.com:: nickname : 1: password : null: subject : undefined: bookmark : false: autojoin : false
            self.join(room, jsxc.xmpp.conn.jid, null, roomname, undefined, true, true);
			
			var bl = jsxc.storage.getUserItem('buddylist');
            if (bl.indexOf(room) < 0) {
               bl.push(room); // (INFO) push returns the new length
			   
               jsxc.storage.setUserItem('buddylist', bl);
				SaveChatRegister(room);							
			   
			}
			
			GetBuddies();
			$("#create_group").hide();
			$("#inviteall").show();
			$(".groupinvites").checked = false;
			$(".groupinvites").hide();
     });
		
	$("#confirm_name_group").click(function(){
		
		$(".groupinvites").show();
		//$("#inviteall").addClass('namecreated');
		
	});	
}


var loadFavContact = function(text)
{	
	if (window.Debug)	console.log("loadFavContact calling");
	//var gImg 		= 	"images/list-name.png";
	var gImg 		= 	"images/avatar_profile_pic.svg";
	var masterdata 	= 	"";
	for(var i=0; i<contacsarray.length; i++)
	{
		var data	= 	contacsarray[i];
		if(data.is_favourite == 0)	continue;
		
		var winData 	= 	jsxc.storage.getUserItem('window', data.sip_login_id+jidSuffix);
		var count 		= 	(winData && winData.unread) || 0;
		count 			= 	(count === true) ? 0 : count;
		
		if( (text != "") && (text != undefined))
		{	
			if ( (!data.caller_id) || (!data.ext) ) continue;
			if( (data.caller_id.toUpperCase().indexOf(text) == -1) && ((data.ext.toString()).indexOf(text) == -1) && ((data.email_id.toUpperCase()).indexOf(text) == -1) )			continue;
		}
		var favName = data.caller_id;
		if(favName.length > 16)
				favName = favName.substring(0,16)+"...";
			
		var moderatestatus = "";
		if(data.user_status == "Available")	moderatestatus = "images/green-active.svg";
		else if(data.user_status == "Busy")	moderatestatus = "images/grey.png";
		else if(data.user_status == "Do not disturb")	moderatestatus = "images/red.png";
		else if(data.user_status == "Invisible")	moderatestatus = "images/yellow.png";	
		
		var img = gImg;
		if(data.ImageURL != null)	img = data.ImageURL;
		
		var slide = data.sip_login_id + "-slide";
		var statusIcn 	=	data.sip_login_id + "-status";
		if(count != 0 )
		{
			masterdata +='<li class="newChatWind" id="'+data.sip_login_id+'_lst" onclick=openChatWin("'+data.sip_login_id+'")><a href="#"><div class="name-images"><img src='+img+' class="list-name-img"/>';
			if(moderatestatus == "")
				masterdata +='<img src="images/green-active.svg" class="dotactives  '+statusIcn+'" style="visibility:hidden"/>';
			else
				masterdata +='<img src='+moderatestatus+' class="dotactives '+statusIcn+'"/>';
			masterdata +='</div><span class="'+slide+'">'+favName+'<b class="inmsg">'+count+'</b></span></a></li>';
		}
		else
		{
			masterdata +='<li class="newChatWind" id="'+data.sip_login_id+'_lst" onclick=openChatWin("'+data.sip_login_id+'")><a href="#"><div class="name-images"><img src='+img+' class="list-name-img"/>';
			if(moderatestatus == "")
				masterdata +='<img src="images/green-active.svg" class="dotactives '+statusIcn+'" style="visibility:hidden"/>';
			else
				masterdata +='<img src='+moderatestatus+' class="dotactives '+statusIcn+'"/>';
			masterdata +='</div><span class="'+slide+'">'+favName+'</span></a></li>';
		}
	}
	if(window.Teamcontacsarray != undefined)
	{
		for(var i=0; i<Teamcontacsarray.length; i++)
		{
			if(Teamcontacsarray[i].is_favourite == 1)
			{
				var data	= 	Teamcontacsarray[i];
				if(data.team_guid == null)	return;
				var winData 	= 	jsxc.storage.getUserItem('window', data.team_guid + "@"+window.ConferenceDomain);
				var count 		= 	(winData && winData.unread) || 0;
				count 			= 	(count === true) ? 0 : count;
				
				if( (text != "") && (text != undefined))
				{	
					if( (data.caller_id.toUpperCase().indexOf(text) == -1) )	continue;
				}
				var favName = data.caller_id;
				if(favName.length > 16)
						favName = favName.substring(0,16)+"...";
					
				var moderatestatus = "images/green-active.svg";
				var img = gImg;
				
				var slide = data.team_guid + "-slide";
				var statusIcn 	=	data.team_guid + "-status";
	
				masterdata +='<li class="newChatWind" id="'+data.team_guid+'_lst" onclick=openTeamWin("'+data.team_guid+ "@"+window.ConferenceDomain+'")><a href="#"><div class="name-images"><img src='+img+' class="list-name-img"/>';
				masterdata +='<img src="images/green-active.svg" class="dotactives '+statusIcn+'" style="visibility:hidden"/>';
	
				if(count != 0 )
					masterdata +='</div><span class="'+slide+'">'+favName+'<b class="inmsg">'+count+'</b></span></a></li>';
				else
					masterdata +='</div><span class="'+slide+'">'+favName+'</span></a></li>';
			}
		}
	}

	$('.favContacts li').remove();
	if(masterdata != "")
		$('.favContacts').append(masterdata);
}
var loadContact = function(text)
{
	var temp 	= 	[];
	var sipid 	= 	jsxc.bid;
	if((sipid != null) && (sipid != undefined))
		sipid = sipid.split("@")[0];
	else
		sipid = loggeduser.sip_userid;
	
	temp.id = "db-"+sipid+"_chatRegister";
	temp.text = text;
	couchDbGetItem(getcontactload, temp);
}

function loadTeamContact(text)
{
	if( (window.Teamcontacsarray != undefined)  && (window.Teamcontacsarray != ""))
	{
		var teamNameSort = Teamcontacsarray.sort(compareName);
		$('.teamLoad li').remove();
		for(var i= 0; i< teamNameSort.length; i++)
		{
			var item = teamNameSort[i]
			//if(item == undefined)	return;
			if(item.team_guid == null)	 continue;
			if( (text != "") && (text != undefined))
			{
				text = text.toUpperCase();
				if (item.caller_id.toUpperCase().indexOf(text) == -1)
					continue;
			}
			var teamName = item.caller_id;
			if(teamName.length > 15)
				teamName = teamName.substring(0,15)+"...";

			var slide = (item.team_guid)+ "-slide";
			var Name = (item.team_guid+"@"+window.ConferenceDomain).split(' ').join('#');
			var teamId = item.team_guid;
			if(teamId != null)
				teamId = teamId.split("@")[0]+"_lst";

			var selfTeam ='<li class="newChatWind" id="'+teamId+'" onclick=openTeamWin(\''+Name+'\')><a href="#"><div class="name-images"><img src="images/avatar_profile_pic.svg" class="list-name-img"/><img src="images/green-active.svg" class="dotactives" style="display:none"/></div><span class="'+slide+'">'+teamName+'</span></a></li>';

			$('.teamLoad').append(selfTeam);
		}
	}
	
}
function compareName( a, b )
{
	if ( a.caller_id.toUpperCase() < b.caller_id.toUpperCase() )	return -1;
	if ( a.caller_id.toUpperCase() > b.caller_id.toUpperCase() )	return 1;
	
	 return 0;
}

function getcontactload(returnVal, returnData, inputsParam)
{
	if(returnVal == "success")
	{
		$('.contactsLoad li').remove();
		var datas = returnData.MyData || [];
		datas.sort( sortDateTime );
		var contact = Object.values(datas);
		var contCount = 0;
		var teamCount = 0;
		var gImg = 	"images/avatar_profile_pic.svg";
	
		$.each(contact, function (index, item) {
			if(jsxc.bid != null)
			{
				var key = "jsxc:"+jsxc.bid+":buddy:"+item.contact;
				//var data = localStorage.getItem(key);
				//if(data == null)
					//return;
				//data = JSON.parse(data);
				
				var winData 	= 	jsxc.storage.getUserItem('window', item.contact);
				var count 		= 	(winData && winData.unread) || 0;
				count 			= 	(count === true) ? 0 : count;
				
				if((item.contact).includes("@conference"))
				{	
					var item = GetTeamDetails(item.contact.split("@")[0]);
					if(item == undefined)	return;
					if(item.team_guid == null)	 return;
					if( (inputsParam.text != "") && (inputsParam.text != undefined))
					{
						if (item.caller_id.toUpperCase().indexOf(inputsParam.text) == -1)
							return;
					}
					var teamName = item.caller_id;
					if(teamName.length > 15)
						teamName = teamName.substring(0,15)+"...";

						var slide = (item.team_guid)+ "-slide";
						var Name = (item.team_guid+"@"+window.ConferenceDomain).split(' ').join('#');
						var teamId = item.team_guid;
						if(teamId != null)
							teamId = teamId.split("@")[0]+"_lst";
						var selfTeam = "";
						if(count != 0 )
						{
							selfTeam ='<li class="newChatWind" id="'+teamId+'" onclick=openTeamWin(\''+Name+'\')><a href="#"><div class="name-images"><img src='+gImg+' class="list-name-img"/><img src="images/green-active.svg" class="dotactives" style="display:none"/></div><span class="'+slide+'">'+teamName+'<b class="inmsg">'+count+'</b></span></a></li>';
						}
						else
						{
							selfTeam ='<li class="newChatWind" id="'+teamId+'" onclick=openTeamWin(\''+Name+'\')><a href="#"><div class="name-images"><img src='+gImg+' class="list-name-img"/><img src="images/green-active.svg" class="dotactives" style="display:none"/></div><span class="'+slide+'">'+teamName+'</span></a></li>';
						}
						//$('.teamLoad').append(selfTeam);
						$('.contactsLoad').append(selfTeam);
				}
				else
				{
					//if(contCount == 7)
					//	return;
					
					//contCount += 1;
					var dataext = GetContactDetails(item.contact.split("@")[0]);
					if( (dataext == "") || (dataext == undefined) )	return;
					if( (inputsParam.text != "") && (inputsParam.text != undefined))
					{
						if (!dataext.ext ) return;
						if ( (dataext.caller_id.toUpperCase().indexOf(inputsParam.text) == -1) && ((dataext.ext.toString()).indexOf(inputsParam.text) == -1) && (dataext.email_id.toUpperCase().indexOf(inputsParam.text) == -1))
							return;
					}

					if($('#'+dataext.sip_login_id+'_lst').length !=0)
						return;
					
					var conctName = dataext.caller_id;
					if(conctName.length > 15)
						conctName = conctName.substring(0,15)+"...";
							
					var moderatestatus = "";
					if(dataext.user_status == "Available")	moderatestatus = "images/green-active.svg";
					else if(dataext.user_status == "Busy")	moderatestatus = "images/grey.png";
					else if(dataext.user_status == "Do not disturb")	moderatestatus = "images/red.png";
					else if(dataext.user_status == "Invisible")	moderatestatus = "images/yellow.png";
					
					var img = gImg;
					if( (dataext.ImageURL != null) && (dataext.ImageURL != undefined) )
						img = dataext.ImageURL;

					var slide 		= 	dataext.sip_login_id + "-slide";
					var statusIcn 	=	dataext.sip_login_id + "-status";
					var selfcontact	=	"";
					if(count != 0 )
					{
						selfcontact ='<li class="newChatWind" id="'+dataext.sip_login_id+'_lst" onclick=openChatWin("'+dataext.sip_login_id+'")><a href="#"><div class="name-images"><img src='+img+' class="list-name-img"/>';
						if(moderatestatus == "")
							selfcontact +='<img src="images/green-active.svg" class="dotactives '+statusIcn+'" style="visibility:hidden"/>';
						else
							selfcontact +='<img src='+moderatestatus+' class="dotactives '+statusIcn+'"/>';
			
						selfcontact +='</div><span class="'+slide+'">'+conctName+'<b class="inmsg">'+count+'</b></span></a></li>';
					}
					else
					{
						selfcontact ='<li class="newChatWind" id="'+dataext.sip_login_id+'_lst" onclick=openChatWin("'+dataext.sip_login_id+'")><a href="#"><div class="name-images"><img src='+img+' class="list-name-img"/>';
						if(moderatestatus == "")
							selfcontact +='<img src="images/green-active.svg" class="dotactives  '+statusIcn+'" style="visibility:hidden" />';
						else
							selfcontact +='<img src='+moderatestatus+' class="dotactives '+statusIcn+'" />';
						selfcontact +='</div><span class="'+slide+'">'+conctName+'</span></a></li>';
					}		
					$('.contactsLoad').append(selfcontact);
				}
			}
		});
		
	}
}


var openTeamWin = function(id)
{
	id = id.replace(/#/gi, ' ');
	//getRoomDetails(id.split("@")[0]);
	openChatWin(id);
}
var openChatWin = function(id)
{
	if(id.includes("conference"))	{	openContactwindow(id);	}
	else
	{	
		id	+= jidSuffix;
		openContactwindow(id);	
	}
	window.LastChatWindow = id;
}

var GetBuddies = function(){
	if (window.Debug)	console.log("GetBuddies calling")
	loadFavContact('');
	loadContact('');
	loadTeamContact('');
	$('.loadersimg').hide(300);
}
var sortDateTime = function(a, b)
{
	if (a.msgtime > b.msgtime)	return -1;
	else if (a.msgtime == b.msgtime)	return 0;
	else	return 1;
}