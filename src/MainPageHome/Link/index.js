import LinkPrsenter  from './Presenter/LinkPrsenter';
/**
 * Presenter first design pattern 
 * Connector for the all the remaining pattern 
 * This file used to initiate the LinkPrsenter and presenter initiate the view 
 * @param  {} {let LV =new LinkPrsenter(
 * @param  {} ;LV.init(
 */
export default class Link{

    constructor() {
         let LV = new LinkPrsenter (); 
         LV.init();
    }

};
