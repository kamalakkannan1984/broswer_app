import EventPrsenter  from './Presenter/EventPrsenter';
/**
 * Presenter first design pattern 
 * Connector for the all the remaining pattern 
 * This file used to initiate the EventPrsenter and presenter initiate the view 
 * @param  {} {let EV=new EventPrsenter(
 * @param  {} ;EV.init(
 */
export default class Notes{

    constructor() {
        let EV = new EventPrsenter (); 
        EV.init();
    }

};
