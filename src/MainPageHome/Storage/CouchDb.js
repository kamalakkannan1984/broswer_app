import PouchDB from 'pouchdb';
import GlobalData from './GlobalData';
export default class CouchService {
	
	constructor()
	{
		let _that = this;
	}
    // get all notes 
    
    init_couchdb(key)
    {
        let storage = new GlobalData();
        storage.localDb 		= 	new PouchDB('uring_v4_'+key);
        storage.remoteDb 	    = 	new PouchDB('https://admin:vicarage2000@im01.unifiedring.co.uk:6984/uring_v4_'+key, {skip_setup: true});
    
        storage.remoteDb.replicate.to(storage.localDb).on('complete', function () {
            console.log('Sync Done');
            storage.localDb.sync(storage.remoteDb, {live: true, retry: true, /* other sync options */});
          }).on('error', function (err) {
            console.log('sync error');
            storage.localDb.sync(storage.remoteDb, {live: true, retry: true, /* other sync options */});
        });     
    }

	get_Data(temp_data) {
        let storage = new GlobalData();
		return new Promise((resolve, reject) => {
            var input = temp_data;
            storage.localDb.get(input.id).then(function(result) {
                if(result != undefined)	resolve(result);
                else	resolve(result);
            }).catch(function (err) {
                resolve(err);
            });
        });
    }

    store_data(temp_data)
    {
        console.log("temp_data",temp_data);;
        let storage = new GlobalData();
        return new Promise((resolve, reject) => {
            storage.localDb.put(temp_data).then(function (response) {
                if(response != undefined)	resolve(response);
                else	resolve(response);
            }).catch(function (err) {
                resolve(err);
            });
        });
    }
}