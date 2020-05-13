import HomeView from '../View/HomeView';
import ProfilePresenter from '../../Profile/Presenter/ProfilePresenter';
import ContactPresenter from '../../Contacts/Presenter/ContactPresenter';
import _storage from '../../Storage/CouchDb';
export default class HomePresenter  extends HomeView{
    constructor(){
        super();
       
        //this.View = new HomeView();
        //this.View.init();
        new ProfilePresenter();
        super.init();
        this.contact = new ContactPresenter();
        this.contact.init();
        this.initiate_CouchDb();
    }
    
    initiate_CouchDb()
    {
        console.log("initiate  couchdb");
        let storage = new _storage
        storage.init_couchdb(290);
    }
}