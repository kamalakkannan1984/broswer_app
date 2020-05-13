/**
 * MVP design pattern 
 * Presenter first design patttern 
 * View and Model initanate from Presenter 
 * @param  {true}} {this.noteWindow=noteTemplate({login
 */

// Following method in helpers function for dom manupulation 
// eventlisterner method used to add the event listerner. 
// noteTemplate for load the login template

import noteTemplate from '../../../Template/Notes/note.hbs'; 
import Alert from '../../../Utils/Alert';
//This class is the first process for all the application follow. 
export default class NoteView {

	constructor()
	{
		this.noteWindow = noteTemplate(); 
	}

	//initNote method used to append the loging template in the index.html 
	initNote() 
	{
		$('.note-screen').empty().append(this.noteWindow);
		//this.LoginWindow = GetDom('.note-screen');
	}
	inputFields() {
		return {
			summary:$('#textNotetitle').val().trim(),
			description:($('.Editor-editor').html()).replace(/\&nbsp;/g, '').trim()
		}
	}
	
	// displaying sorted notes in note view
	displayNote(data)
	{
		console.log("final view data is",data);
	}
}