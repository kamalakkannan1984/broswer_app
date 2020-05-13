
   

import ruleTemplate from '../../../Template/mainpage/rrule.hbs';
import RRulePresenter from '../Presenter/RRulePresenter';
import Alert from '../../../Utils/Alert';
import HOmeView from '../../DashBoard/View/HomeView'
//This class is the first process for all the application follow. 
export default class RRuleView {

constructor()
{
    super();
   // this.rruleWindow = ruleTemplate();
    
}

//initLogin method used to append the loging template in the index.html 
 init() {
   /* this.rrule=$(super.getView.find('#quickmenu'));
   this.rrule.append(this.rruleWindow);  
   $('#ParentWindow').html(this.rruleWindow);
   let that = this;
   
   $("#repeatIntervalValue, #repeat_option, #repeatday-date, #rruleEndSessionsCount").change(function() {
    //r.rruleGenerate();
    //let RR = new RRulePresenter();
    
    that.customRRuleGenerate();
    
  });
  
  
    $(".endsection input[type=radio][name='rruleEndAction']").change(function() {
    //r.rruleGenerate();
   // let RR = new RRulePresenter();
    this.customRRuleGenerate();
  }); */
  let that = this;
  that.customRRuleGenerate();
 }


 weekAndDay(date) 
    {
        var days = ['Sunday','Monday','Tuesday','Wednesday',
                    'Thursday','Friday','Saturday'],
            prefixes = ['First', 'Second', 'Third', 'Fourth', 'Fifth'];
        return prefixes[Math.floor(date.getDate() / 7)] + ' ' + days[date.getDay()];
    }
    
    rruleGetByWeekDay (value) {
        var days = [rrule.RRule.SU, rrule.RRule.MO, rrule.RRule.TU, rrule.RRule.WE, rrule.RRule.TH, rrule.RRule.FR, rrule.RRule.SA];
        return value.split(',').map(function(index) {
            return days[index];
        });  
    }

 weekAndDay() 
{
	var date = new Date();
    console.log(date);
    var days = ['Sunday','Monday','Tuesday','Wednesday',
                'Thursday','Friday','Saturday'],
        prefixes = ['First', 'Second', 'Third', 'Fourth', 'Fifth'];
    return prefixes[Math.floor(date.getDate() / 7)] + ' ' + days[date.getDay()];
}


getWeekNum  (){

	var date = new Date();

	date = Math.floor(date.getDate() / 7) + 1

	return date;
	console.log(date);
}


getWeekDays () {

	var date = new Date();
	var days = [rrule.RRule.SU, rrule.RRule.MO, rrule.RRule.TU, rrule.RRule.WE, rrule.RRule.TH, rrule.RRule.FR, rrule.RRule.SA];
    
    return days[date.getDay()];
}
        
    customRRuleGenerate() {

        let that = this;
        var repeatIntervalType = $('#repeat_option');
        var repeatIntervalValue = $('#repeatIntervalValue');
        var rruleWeeklyButtons = $("input[name='weekdays']:checked");
        var rruleMonthlyPanel =     $('.rrule-monthly');
        var rruleEndAction       = $("input[name='rruleEndAction']:checked");
        var rruleEndSessionsCount = $('#rruleEndSessionsCount'); 
      
    
        var $this = ""//this;
        var $options = {};
        console.log(repeatIntervalType.val())
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
                        $options.bysetpos = that.getWeekNum();//$this.
                        $options.byweekday = that.getWeekDays();//
                    break;
                }
            break;
            case 'weekly':
                $options.freq = rrule.RRule.WEEKLY;
                var $weekDays = [];
               
                $.each(rruleWeeklyButtons, function(){            
                    $weekDays.push($(this).val());
                });

                if ($weekDays.length > 0) {
                    $options.byweekday = that.rruleGetByWeekDay($weekDays.join(','));
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
       // g_CustomRRule = rule.toString();

       console.log(rule.toString())
      
    }


 



}