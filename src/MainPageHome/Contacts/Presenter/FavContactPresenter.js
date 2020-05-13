/**
 * Presenter first pattern 
 * ContactView and model connected here 


 */

import SetFavContact from '../Model/SetFavContact';
import GlobalData from '../../Storage/GlobalData';
import {xmpp} from '../../Common/constant'
import {GetContactDetails} from '../../Common/common'
import {loadFavContact, sortarray} from '../../Common/common'


export default class FavConPresenter {
 
    constructor(bid)
    {
        this.id = bid
    
    }
    /* 
    *** init function initiate on load event 
    */
    init=()=>{
           
        let that=this; // this stored in that for function scope 
        that.callSetFav()   
                 
    }

        
        
    callSetFav(){
        
            let c_details = GetContactDetails(this.id)
            let bid = this.id;
            if(!c_details) return;

            let status;
            let ext = c_details.ext;

            if(c_details.is_favourite == 1)
            status = 0;
            else
            status = 1;

            let __Model = new SetFavContact();
            console.log("ext ..."+ ext + "" +status);
            __Model.setFav(ext, status).then((response)=>
            {
                
                    
                console.log("response ...", response);
                if( (response[0].errcode == 0) ) 
                {

                    GlobalData.BuddyList.forEach(function(number, i) { 
                        console.log( GlobalData.BuddyList[i].sip_login_id);

                        if(GlobalData.BuddyList[i].sip_login_id == bid)
                        {
                            GlobalData.BuddyList[i].is_favourite = status;
                            
                            if(status == 1)
                            {
                                
                                $(".favicon").removeClass('icon_favourite_inactive');
                                $(".favicon").addClass('icon_favourite_active').addClass('cyellow');
                                
                            }
                            else
                            {

                                $(".favicon").addClass('icon_favourite_inactive');
                                $(".favicon").removeClass('icon_favourite_active').removeClass('cyellow');
                
                            }

                            
                            
                            return;
                        }


                        
                    });

                    if($(".contact-span").text() == "Favourite")
                    {
                        let favData = loadFavContact();
                        sortarray(favData);
                    }
                        
                   
                }
                else
                {

                   

                    
                } 
           
            
         
            }).catch(e => console.error("Login Module Critical failure: " + e.message));
                 
        }


        
     
    }
   

