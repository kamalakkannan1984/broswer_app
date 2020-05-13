export default class EventService {
	constructor()
	{
		let _that = this;
	}
	
	//create and update both having same function.
	create_event(p_Data)
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
}
