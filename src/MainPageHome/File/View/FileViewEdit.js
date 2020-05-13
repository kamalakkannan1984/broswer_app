/**
 * MVP design pattern 
 * Presenter first design patttern 
 * View and Model initanate from Presenter 
 * @param  {true}} {this.loginWindow=loginTemplate({login
 */

import fileTemplate from '../../../Template/Files/fileedit.hbs';
import FilPresenterEdit from '../Presenter/FilePresenterEdit';
import Alert from '../../../Utils/Alert';
//This class is the first process for all the application follow. 
export default class FileViewEdit {

constructor()
{
  this.fileWindow = fileTemplate();  
}

//initFile method used to append the loging template in the index.html 
  initFile(fileName, msgid) {

    $('.login-screen').empty().append(this.fileWindow);
  }

  //aftereditedd to call save function
  //
  //let edited =  new FilPresenterEdit();
}