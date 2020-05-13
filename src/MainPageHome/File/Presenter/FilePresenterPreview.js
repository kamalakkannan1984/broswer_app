/**
 * Presenter first pattern 
 * Note view and model connected here 
 * Alert is the common method for all the alert 
 * store all other common method are in common folder common file 
 * Validation seperate method 

 */
import FileView from '../View/FileViewPreview';
export default class FilePresenterPreview {
  
    constructor()
    {
        let that = this;
    }
    
    file_Preview(url, filename)
    {
        let _preview = new FileView();
        _preview.initPreview(url, filename);
    }
    
}
   

