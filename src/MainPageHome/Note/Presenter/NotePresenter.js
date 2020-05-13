/**
 * Presenter first pattern 
 * Note view and model connected here 
 * Alert is the common method for all the alert 
 * store all other common method are in common folder common file 
 * Validation seperate method 
 */
import NoteView from '../View/NoteView';
import NoteModel from '../Model/NoteModel';
import GlobalData from '../../Storage/GlobalData';
import Alert from '../../../Utils/Alert'
export default class NotePresenter {
  
    constructor()
    {
        let View = new NoteView(); // Create the object for View
        View.initNote(); // init login for append the login template method   
	}
	
	init=()=>{
		let check_note = new GlobalData();
		if(check_note.notesData.length != 0)
		{
			let __Model = new NoteModel();
			__Model.get_notes().then((response)=> {
				if( (!response[0].Message) && (!response[0].Code) && (response[0].result != -100) )
				{
					check_note.notesData = response;
					this.get_Note_History(response);
				}
				else{
					var array = [];
					this.get_Note_History(array);
				}
			}).catch(e => console.log("get notes: " + e.message));
		}
		else{
			this.get_Note_History(check_note.notesData);
		}
	}

	get_Note_History (data)
	{      
		let View = new NoteView();
		View.displayNote(data);
		//let data1 = this.note_Count("2350@im01.unifiedring.co.uk");
		//console.log(data1);
		//let data1 = this.get_Particualar_Note("8bgihvaj-");
		//console.log(data1);
		//this.update_Note("aaa--","bbb--","6iwirozn");
		//this.delete_Note("7ajy7y6s", "1584508213503:msg", "2244@im01.unifiedring.co.uk");
		//this.create_Note("testing", "notes", "7ajy7y6s", "1660@im01.unifiedring.co.uk", "1584508213503:msg", new Date().getTime() / 1000)
	}

	delete_Note(note_Id, msgid, bid)
	{
		let __Model = new NoteModel();
        __Model.delete_notes(note_Id).then((response)=> {
			if(response.Message == "Success")
			{
				let _newdata = new GlobalData();
				var temp = _newdata.notesData || [];
				let index = temp.findIndex(item => (item.UID == note_Id) );
				if(index != -1)
				{
					temp.splice(index ,1);
					_newdata.notesData = temp;
					this.get_Note_History(temp);
				}
			}
			else{
				new Alert('#AlertBoxWin',"Try again" );
			}
		}).catch(e => console.error("delete notes: " + e.message));
	}
	
	create_Note(summary, description, noteId, sendTo, msid, sdate)
	{
		var Ntemp = {};
		var date =  sdate || new Date().getTime() / 1000 ;
		Ntemp.stype = "createnote"
		Ntemp.DTSTART   = date;
		Ntemp.SENDER = "2451@im01.unifiedring.co.uk"    //jsxc.bid  need to pass jscx.bid
		Ntemp.OWNERID = "2451@im01.unifiedring.co.uk"    //jsxc.bid  need to pass jscx.bid
		Ntemp.UID = noteId;
		Ntemp.SUMMARY = summary;
		Ntemp.DESCRIPTION = description;
		if(sendTo == undefined)
		{
			Ntemp.MSGID	=	null;
			Ntemp.RECEIVER 	= null;
			Ntemp.GROUPID  = null;
		}
		else
		{
			Ntemp.MSGID		=	msid;
			Ntemp.RECEIVER 	= 	(sendTo.includes("@conference")) ? null :  sendTo;
			Ntemp.GROUPID  = (sendTo.includes("@conference")) ? sendTo :  null;
		}
		Ntemp.COMPANY_ID = 1698;    //loggeduser.company_id;

		let __Model = new NoteModel();
        __Model.create_notes(Ntemp).then((response)=> {
			if(response.Message == "Success")
			{
				let _newdata = new GlobalData();
				var n_temp = _newdata.notesData || [];
				// store data into notes global variable
				var temp = {};
				temp.Id = "";
				temp.DESCRIPTION = description;
				temp.SUMMARY = summary;
				temp.UID = noteId;
				temp.DTSTART = date;
				temp.SENDER = "2451@im01.unifiedring.co.uk"    //jsxc.bid  need to pass jscx.bid
				temp.MSGID = msid || null;
				if(sendTo != undefined)
				{
					temp.RECEIVER = (sendTo.includes("@conference")) ? null : sendTo;
					temp.GROUPID = (sendTo.includes("@conference")) ? sendTo : null;
				}
				else{
					temp.RECEIVER 	= null;
					temp.GROUPID  = null;
				}
				temp.COMPANY_ID = 1698;    //loggeduser.company_id;
				n_temp.push(temp);
				newdata.notesData = n_temp;
			}
			else{
				new Alert('#AlertBoxWin',"Try again" );
			}
		}).catch(e => console.error("delete notes: " + e.message));
		
	}
	
	update_Note(summary, description, note_Id)
	{
		let _newdata = new GlobalData();
		var N_temp = _newdata.notesData || [];
		let data = N_temp.find(item => (item.UID == note_Id) );
		if(data != undefined)
		{
			let date = new Date().getTime() / 1000 ;
			var temp = {};
			temp.stype = "createnote";
			temp.DESCRIPTION = description;
			temp.UID = note_Id;
			temp.SUMMARY = summary;
			temp.DTSTART = date;
			temp.SENDER = data.SENDER;
			temp.MSGID = data.MSGID;
			temp.RECEIVER = data.RECEIVER;
			temp.GROUPID = data.GROUPID;
			temp.OWNERID = data.OWNERID;
			temp.COMPANY_ID = data.COMPANY_ID;
			let __Model = new NoteModel();
			__Model.create_notes(temp).then((response)=> {
				if(response.Message == "Success")
				{ 
					let _newdata = new GlobalData();
					var temp = _newdata.notesData || [];
					let index = temp.findIndex(item => (item.UID == note_Id) );
					if(index != -1)
					{
						temp[index].SUMMARY = summary;
						temp[index].DESCRIPTION = description;
						_newdata.notesData = temp;
						this.get_Note_History(temp);
					}
				}
				else{
					new Alert('#AlertBoxWin',"Try again" );
				}
			}).catch(e => console.error("delete notes: " + e.message));
		}
	}
	note_Count(bid, check)
	{
		let check_note = new GlobalData();
		let _getData = check_note.notesData;
		if(check == "data")
			return _getData.filter(e => 
				(e.SENDER == bid) ||
				(e.RECEIVER == bid) ||
				(e.GROUPID == bid));
		else
			return _getData.filter(e => 
				(e.SENDER == bid) ||
				(e.RECEIVER == bid) ||
				(e.GROUPID == bid)).length;

	}
	get_Particualar_Note(note_Id)
	{
		let check_note = new GlobalData();
		let _getData = check_note.notesData;
		return _getData.find(e => (e.UID == note_Id));
	}
}
   

