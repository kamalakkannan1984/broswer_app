import $ from 'jquery';
export default class AlertModel {
    constructor(id,msg)
    {
       $(id).find(".modal-title").text("Alert");
				$(id).find(".modal-body p").text(msg);
				$(id).modal('show');
    }
}