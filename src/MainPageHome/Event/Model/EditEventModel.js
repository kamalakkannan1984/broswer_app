export default class EventService {
	constructor()
	{
		let _that = this;
	}
	// edit event
	edit_events(p_Data) {
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
				console.log(response)
				resolve(response);
			});
		})
	}

}
