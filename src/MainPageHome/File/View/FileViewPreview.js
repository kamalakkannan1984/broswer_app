/**
 * MVP design pattern 
 * Presenter first design patttern 
 * View and Model initanate from Presenter 
 * @param  {true}} {this.loginWindow=loginTemplate({login
 */

import fileTemplate from '../../../Template/Files/filepreview.hbs';
//This class is the first process for all the application follow. 
export default class FileViewPreview {

constructor()
{
  this.fileWindow = fileTemplate();  
}

//initFile method used to append the loging template in the index.html 
  initPreview(url, filename) {
      $('.file-screen').empty().append(this.fileWindow);
  }
}