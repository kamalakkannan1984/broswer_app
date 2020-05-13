/**
 * MVP design pattern 
 * Presenter first design patttern 
 * View and Model initanate from Presenter 
 * @param  {true}} {this.loginWindow=loginTemplate({login
 */

// linkTemplate for load the login template
 // Alert for show success and error message
import linkTemplate from '../../../Template/Links/linkDel.hbs';
import Alert from '../../../Utils/Alert';
//This class is the first process for all the application follow. 
export default class LinkDelete {

    constructor()
    {
        this.linkWindow = linkTemplate();
    }

    //initLink method used to append the link template in the index.html 
    initLink() {
        $('.link-screen').empty().append(this.linkWindow);
    }


}