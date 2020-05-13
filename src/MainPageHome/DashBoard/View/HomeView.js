/****
 * Home View for the entire site home page 
 * In this view we have multiple view 
 */
import homeWindow from '../../../Template/mainpage/dashboard.hbs';
import $ from 'jquery';
 export default class HomeView {
     constructor(){
    
            this.HomeWindow = homeWindow({copyinfodata:{version:"v0.0.5",copyrightyear:2020}});
  
    }
    get getView(){
        
        return $(this.HomeWindow).clone();
    }
    init()
    {
        

        
    }
 }