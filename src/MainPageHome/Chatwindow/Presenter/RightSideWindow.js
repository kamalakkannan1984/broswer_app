import RightWindowView from '../View/RightWindowView';
import TaskPresenter from '../../Task/Presenter/TaskPresenter'
import GlobalData from '../../Storage/GlobalData';
import {xmpp} from '../../Common/constant'
import {GetContactDetails, getTaskcountByUser} from '../../Common/common'

export default class RightSideWindow {
 
    constructor(sipid)
    {
      
        this.id = sipid;
    
    }
    /* 
    *** init function initiate on load event 
    */
    init=()=>{
           console.log("right window view", this.id);
        let data = GetContactDetails(this.id);
        console.log("before", data);
        let RW = new RightWindowView(data)
        RW.initChat();

        getTaskcountByUser(this.id+"@"+xmpp.domain);
        /* if(GlobalData.TaskData)
        {

        }
        else
        {
            let TP = new TaskPresenter(data)
            TP.init();
        } */

       
           
        
    }

        
        
   


  
    }