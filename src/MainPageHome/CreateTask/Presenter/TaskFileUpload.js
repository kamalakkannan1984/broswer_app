

import UploadModel from '../Model/UploadModel';

import GlobalData from '../../Storage/GlobalData'


export default class UploadPresenter {
  
    constructor(toUser)
    {
      this.id = toUser;
        
       
        
    }
    /* 
    *** init function initiate on load event 
    */
    init=(files)=>{
        let that=this; // this stored in that for function scope 

        console.log("init", files);
        that.taskFileUpload(files)
    }

    taskFileUpload (files){
       
            var size 	= 	files.target.files.length;

            for (var i =0; i<size; i++)
            {
                var file = files.target.files[i]; 
                this.uploadTaskFileTimeInterval(file, i);
            }        
        }
        
        uploadTaskFileTimeInterval (file, k){
            let that=this;
            setTimeout(function(){
                that.callUploadModel(file);
            }, k*200);
        }
        

    callUploadModel(file){
        let __NModel = new UploadModel();
        console.log("inputdata", file);
        let that = this;
        __NModel.uploadTaskFiletoAPI(file).then((response)=>
        {
        console.log(response);
        var localTasklist = GlobalData.taskfileListArray || [];
        if(response[0].errcode == 0)
        {
            let reg = new Object();
					reg.FileName = response[0].FileName;
                    reg.URL = response[0].FileURL;
                    localTasklist.push(reg)
                    GlobalData.taskfileListArray = localTasklist;
        }
     
        }).catch(e => console.error("Login Module Critical failure: " + e.message));

    }


  
    }
   

