export default class noteService {
	
	constructor()
	{
		let _that = this;
	}
	// get all notes 
	get_notes() {
		return new Promise((resolve, reject) => {
			$.ajax({
				type: "GET",
				crossDomain: true,
				dataType: "json", 
				data: { 
					stype:"getallnotes",
					SENDER: "2451@im01.unifiedring.co.uk"    //jsxc.bid  need to pass jscx.bid
				},
				url: "/GetMongoData",
				async: false,
			})
			.done(function( response ) {
				resolve(response);
			});
		});
	}
	
	//create and update both having same function.
	
	create_notes(p_Data)
	{
		return new Promise((resolve, reject) => {
			$.ajax({
				type: "GET",
				crossDomain: true,
				dataType: "json",
				data: p_Data,
				url: "/GetMongoData",
				async: false,
			})
			.done(function( response ) {
				resolve(response);
			});
		})
	}
	
	// delete particuler notes using note id
	delete_notes(note_id)
	{
		return new Promise((resolve, reject) => {
			$.ajax({
				type: "GET",
				crossDomain: true,
				dataType: "json",
				data: { 
					stype:"removenotes",
					UID : note_id
				},
				url: "/GetMongoData",
				async: false,
			})
			.done(function( response ) {
				resolve(response);
			});
		});
	}
	
}
