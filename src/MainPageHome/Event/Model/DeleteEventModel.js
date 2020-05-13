export default class EventService {
	constructor()
	{
		let _that = this;
	}

	// delete particuler notes using event id
	delete_event(event_id)
	{
		return new Promise((resolve, reject) => {
			$.ajax({
				type: "GET",
				crossDomain: true,
				dataType: "json",
				data: { 
					stype:"removeevent",
					UID : event_id
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
