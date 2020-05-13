let loggedUser = null;
let instance = null;
let contactData = {};
let taskData={};
let eventData={};
let pinnedData={};
let bookmarkedData={};
let filesData={};
let linksData={};
let notesData={};
let localDb = "";
let remoteDb = "";
let contactArray;
let gRRULEdata;
let l_array_taskfile = [];
let l_taskfileListArray = [];
/* export const xmpp ={
    url: 'https://im01.unifiedring.co.uk:5281/http-bind/',//'https://chat.unifiedring.co.uk:5281/http-bind/',
    domain: "im01.unifiedring.co.uk", //'im01.unifiedring.co.uk',//window.ChatDomain,
    resource: 'example',
    overwrite: true
}; */
export default class GlobalData {
    constructor()
    {
        if (!instance) {
        instance =this;
       
        }
       
        return instance;

    }

    get  ContactData(){
        return (contactData)
    }

    set ContactData(data)
    {
        contactData=data;
    }

    get  TaskData(){
        return (taskData)
    }

    set TaskData(data)
    {
    taskData=data;
    }


    get EventData(){
        return eventData
    }

    set EventData(data)
    {
    eventData=data;
    }


    get PinnedData(){
        return pinnedData
    }

    set PinnedData(data)
    {
    pinnedData=data;
    }


    get PinnedData(){
        return pinnedData
    }

    set PinnedData(data)
    {
    pinnedData=data;
    }
    get BookmarkedData(){
        return bookmarkedData
    }

    set BookmarkedData(data)
    {
        bookmarkedData=data;
    }

    get FilesData(){
        return filesData
    }

    set FilesData(data)
    {
        filesData=data;
    }


    get LinksData(){
        return linksData
    }

    set LinksData(data)
    {
        linksData=data;
    }







    get notesData(){
        return notesData
    }

    set notesData(data)
    {
        notesData=data;
    }

  
    
    get LocalDb(){
        return localDb
    }

    set LocalDb(data)
    {
        localDb=data;
    }

    get RemoteDb(){
        return remoteDb
    }

    set RemoteDb(data)
    {
        remoteDb=data;
    }

    get BuddyList(){
        return contactArray;
    }

    set BuddyList(data){
        contactArray = data;
    }

    get gRRULE(){
        return gRRULEdata;
    }

    set gRRULE(data){
        gRRULEdata = data;
    }

    get array_taskfile(){
        return l_array_taskfile;
    }

    set array_taskfile(data){
        l_array_taskfile = data ;
    }

    get taskfileListArray(){
        return l_taskfileListArray
    }

    set taskfileListArray(data){
        l_taskfileListArray = data ;
    }

    
}
