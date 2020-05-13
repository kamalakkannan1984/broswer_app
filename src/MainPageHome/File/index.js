import FilePrsenter  from './Presenter/FilePrsenter';
/**
 * Presenter first design pattern 
 * Connector for the all the remaining pattern 
 * This file used to initiate the FilePrsenter and presenter initiate the view 
 * @param  {} {let FV=new FilePrsenter(
 * @param  {} ;FV.init(
 */
export default class File{

    constructor() {
        let FV = new FilePrsenter (); 
        FV.init();
    }

};
