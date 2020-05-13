export function EventListerner(sourceid, componentid, eventname,handler)
 {

    //  let element=document.querySelector(sourceid);
     
    //  element.querySelector(componentid).removeEventListener(eventname, (event)=>handler(event));
    //  element.querySelector(componentid).addEventListener(eventname, (event)=>handler(event));
   $(sourceid).on(eventname, componentid, (event)=>handler(event));
}