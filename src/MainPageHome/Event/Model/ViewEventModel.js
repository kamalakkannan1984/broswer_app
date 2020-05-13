export default class EventService {
	constructor()
	{
		let _that = this;
	}
	// get all event 
	get_events() {
		return new Promise((resolve, reject) => {
			$.ajax({
				type: "GET",
				crossDomain: true,
				dataType: "json",
				data: { 
					stype:"getallevent",
					OWNERID: "2451@im01.unifiedring.co.uk"    //jsxc.bid  need to pass jscx.bid
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
