import homePage from './MainPageHome';

import $ from 'jquery';
import {loggedUser} from './MainPageHome/Profile/Model/ProfileModel';
import {xmpp} from './MainPageHome/Common/constant';
import {jsxcconnection} from './MainPageHome/ServerConnection/JSXCConnection'
$(document).ready(function(){
  
  if (sessionStorage.getItem('login') )
  {
    jsxcconnection().then(new homePage());
  

      

  }
  else
{
 window.location = "index.html"; 
}
}); 

