

export const ApiServerURL= 	'https://urmyaccount.mundio.com/';
export const MongoDBURL    = 'https://meetingapp.mundio.com/api/'	

export const APIServicesURLs = {
    loginLinkurl:ApiServerURL + "v1/user/XXAccesstokenXX/urmaloginvalidation",
    forgotLinkurl:ApiServerURL + "v1/user/XXAccesstokenXX/Urapploginforgotpwd",
    contact:ApiServerURL + "v2/user/XXAccesstokenXX/urmaworkcontactget",
    favcontact:ApiServerURL + "v1/user/XXAccesstokenXX/Urmaappfavouritecontactsave",
    getTask:MongoDBURL+"GetTask",
    setTask:MongoDBURL+"setTask"
}

export function dateFormat(inputdate)
{
	var monthNames 	= ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct","Nov", "Dec"];
	var dayNames 	= ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
	var date 		= new Date( inputdate );
	var day 		= date.getDate();
	var monthIndex 	= date.getMonth();
	var year 		= date.getFullYear();
	var time 		= formatAMPM(date);
	
	var month		= monthIndex+1;
	
	var formatted_date =date.getFullYear()+"-"+(month<10?'0':'') + month+"-"+(date.getDate()<10?'0':'') + date.getDate()+" "+(date.getHours()<10?'0':'') + date.getHours()+":"+(date.getMinutes()<10?'0':'') + date.getMinutes();
	return formatted_date;
} 

export function generateGUID() 
{
	var length 	= 8;
	return Math.round((Math.pow(36, length + 1) - Math.random() * Math.pow(36, length))).toString(36).slice(1);
}
export function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

export function customRRuleGenerate () {


	var repeatIntervalType = $('#repeat_option');
	var repeatIntervalValue = $('#repeatIntervalValue');
	var rruleWeeklyButtons = $('.rrule-weekly li');
	var rruleMonthlyPanel = $('.rrule-monthly');
  
    var rruleEndAction       = $("input[name='rruleEndAction']:checked");
    var rruleEndSessionsCount = $('#rruleEndSessionsCount'); 
  

    var $this = ""//this;
    var $options = {};
    
    switch (repeatIntervalType.val()) {
        case 'yearly':
			$options.freq = rrule.RRule.YEARLY;
			$options.bymonth = new Date().getMonth()+1//$this.
			$options.bymonthday = new Date().getDate()//$this.
        break;
        case 'monthly':
            $options.freq = rrule.RRule.MONTHLY;
            switch (rruleMonthlyPanel.find('input:radio:checked').val()) {
                case '1':
                    $options.bymonthday = new Date().getDate();
                break;
                case '2':
                    $options.bysetpos = getWeekNum();//$this.
                    $options.byweekday = getWeekDays();//
                break;
            }
        break;
        case 'weekly':
            $options.freq = rrule.RRule.WEEKLY;
            var $weekDays = [];
            $.each(rruleWeeklyButtons, function(index) {
                if ($(this).hasClass('active')) {
                    $weekDays.push($(this).data('value'));
                }
            });
            if ($weekDays.length > 0) {
                $options.byweekday = rruleGetByWeekDay($weekDays.join(','));
            }
        break;
        case 'daily':
            $options.freq = rrule.RRule.DAILY;
        break;
       
    }
    
   
        $options.interval = (repeatIntervalValue.val() >= 1 ? repeatIntervalValue.val() : 1);
  
    
    switch (rruleEndAction.val()) {
        case 'never':
        
        break;
        case 'after':
            if (rruleEndSessionsCount.val() >= 1) {
                $options.count = rruleEndSessionsCount.val();
            }
        break;
        case 'date':
			var date = $("#repeatday-date").val();
			if(date)
			{
				date 	= 	date.replace(/-/g,'/');
				date	= 	new Date(date)
				//date.setDate( date.getDate() - 1 )

				console.log("Date Change", date);
				$options.until = date;
			}	
           
        break;
    }
    
	var rule = new rrule.RRule($options);

	return rule.toString();
	g_CustomRRule = rule.toString();
  
}

export function rruleGenerate (e) {


	var repeatIntervalType 			= $('#repeat_sec');
    var repeatIntervalValue 		= $('#repeat_sec_opt1');
    var ending_times 				= $('#repeat_sec_opt2');
    var repeatIntervalPanel 		= $('.repeat-interval-panel');
   
    var $this 		= e;
	var $options 	= {};
	
	var dateYearly = new Date();
			var monthIndex = dateYearly.getMonth();
			var dayIndex = dateYearly.getDate();

     switch (repeatIntervalType.val()) {
        case 'Every year':
			$options.freq = rrule.RRule.YEARLY;
			$options.bymonth = monthIndex+1;
			$options.bymonthday = dayIndex;
        break;
        case 'Every month':
			$options.freq = rrule.RRule.MONTHLY;
			$options.bymonthday = dayIndex;
        break;
        case 'Every week':
 			$options.freq = rrule.RRule.WEEKLY;
			$options.byweekday = rrule.RRule.SU;
        break;
        case 'Every day':
			$options.freq = rrule.RRule.DAILY;
        break;
        case 'hourly':
            $options.freq = rrule.RRule.HOURLY;
        break;
    } 
console.log(repeatIntervalValue.val());

	switch (repeatIntervalValue.val()) {
        case 'forever':
         
        break;
        case 'endingafter':
             if (ending_times.val() >= 1) {
                $options.count = ending_times.val();
            } 
        break;
        case 'endingon':
			var date = $("#rrule_ondate").val();
			if(date)
			{
				date 	= 	date.replace(/-/g,'/')
				date 	= 	getFormatforEventsdate(date);
				date = convertGMTtoLocalEnddate(date)
				date	= 	new Date(date)
				date.setDate( date.getDate() - 1 )
				$options.until = date;
			}	
        break;
	}
	
	$options.interval = 1;

   var rule = new rrule.RRule($options);
   
   g_RRule = rule.toString();
   console.log(rule.toString())
 
}


function formatAMPM(date)
{
	var hours 	= date.getHours();
	var minutes = date.getMinutes();
	var ampm 	= hours >= 12 ? 'PM' : 'AM';
	
	hours 		= hours % 12;
	hours 		= hours ? hours : 12; // the hour '0' should be '12'
	minutes 	= minutes < 10 ? '0'+minutes : minutes;
	
	var strTime = hours + ':' + minutes + ' ' + ampm;
	
	return strTime;
}