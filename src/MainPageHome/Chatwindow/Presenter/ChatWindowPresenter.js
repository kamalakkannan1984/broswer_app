/**
 * Presenter first pattern 
 * ContactView and model connected here 


 */
import ChatWindowView from '../View/ChatWindowView';
import GlobalData from '../../Storage/GlobalData';
import {xmpp} from '../../Common/constant'


export default class ChatWindowPresenter {
 
    constructor(data)
    {
      
        
        this.ChatWindow = new ChatWindowView(data);

        this.ChatWindow.initChat();
        
    
    }
    /* 
    *** init function initiate on load event 
    */
    init=()=>{
           
      
                 
    }

        
        
   


  
    }
   

