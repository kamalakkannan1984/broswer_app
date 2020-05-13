import {
    setPresence
} from '../../ServerConnection/JSXCConnection';

import available_statusTemplage from '../../../Template/mainpage/profile/availablestatus.hbs';

import {openBrowserWin} from './help';
import {BrowserSignOut} from './signout';
let availabeData = {};
export default class avaialbleshare {
    constructor(profilesuper)
    {
        availabeData = {
            availablestatus: {
                chat: {
                    status: 'Available',
                    color: '',
                    tick: false,
                },
                away: {
                    status: 'Busy',
                    color: 'orange-clr',
                    tick: false,
                },
                dnd: {
                    status: 'Do not distrub',
                    color: 'red-clr',
                    tick: false,
                },
                xa: {
                    status: 'Invisible',
                    color: 'gray-clr',
                    tick: false,
                }
            },
            currentstatus: {
                status: 'Available',
                color: '',
                tick: false,
            }
        }
this.profile=profilesuper;

    }

    loadAvailableStatus(){
        
        this.profile.find('li.praentavailable').eq(0).empty().append($(available_statusTemplage(availabeData)));
        //alert( "this.profile.find('li.praentavailable').eq(0)");
        let that = this;
        Object.keys(availabeData.availablestatus).forEach(function (key) {

            that.profile.find("." + key).eq(0).on('click', function (event) {
                alert(key);
                that.setpresence(key);
                //         ``
            })
        });


        $(".user-prof-pop").click(function () {
            // that.setpresence ('chat');
            $(".user-pop-con-sec").slideToggle();
        });

        $('.signOut').click(function() {	BrowserSignOut(that.setpresence);	})
        $('.helpPage').click(function()	{	openBrowserWin('https://unifiedring.co.uk/resources');	})
        
        $("#ParentWindow").on("click", ".proappInfo", function()	
		{	
		
			$("#appinfo").modal('show');
		});
    }


    setpresence(input) {
        if (availabeData && availabeData.availablestatus.hasOwnProperty(input)) {
            let selectstatus = availabeData.availablestatus[input];
            //dotscolors
            $('.dotscolors').attr('class', 'dotscolors ' + input + 'clr');
            $('.right-sid-arw').attr('class', 'icon_single_tick right-sid-arw blue-clr font-600');
            $('.currentstaus').attr('class', 'dotscolors-cir currentstaus ' + selectstatus.color)
            $('#status').text(selectstatus.status);


            if (jsxc.xmpp.conn)
                setPresence(input)
        }

    }
}