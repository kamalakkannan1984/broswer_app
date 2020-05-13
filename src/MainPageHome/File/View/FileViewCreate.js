/**
 * MVP design pattern 
 * Presenter first design patttern 
 * View and Model initanate from Presenter 
 * @param  {true}} {this.loginWindow=loginTemplate({login
 */

import fileTemplate from '../../../Template/Files/file.hbs';
import Alert from '../../../Utils/Alert';
//This class is the first process for all the application follow. 
export default class FileView {

constructor()
{
  this.fileWindow = fileTemplate();  
}

//initFile method used to append the loging template in the index.html 
  initFile() {

      $('.login-screen').empty().append(this.fileWindow);
  }
}