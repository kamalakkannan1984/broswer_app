/**
 * MVP design pattern 
 * Presenter first design patttern 
 * View and Model initanate from Presenter 
 * @param  {true}} {this.loginWindow=loginTemplate({login
 */

// linkTemplate for load the login template
 // Alert for show success and error message
import linkTemplate from '../../../Template/Links/link.hbs';
//This class is the first process for all the application follow. 
export default class LinkView {

    constructor()
    {
        this.linkWindow = linkTemplate();
    }

    //initLink method used to append the link template in the index.html 
    initLink() {
        $('.link-screen').empty().append(this.linkWindow);
    }

	// displaying sorted link in note view
	displayLink(data)
	{
		console.log("final view data is",data);
	}
}