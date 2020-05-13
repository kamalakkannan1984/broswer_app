

export function GenerateGUID()
	{
		var d 		= 	new Date().getTime();	
		if(window.performance && typeof window.performance.now === "function")
			d 		+= 	performance.now(); //use high-precision timer if available
		
		var uuid = 'xxxxxxxx_xxxx_xxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) 
		{
			var r 	= 	(d + Math.random()*16)%16 | 0;
			d 		=	 Math.floor(d/16);
			return (c=='x' ? r : (r&0x3|0x8)).toString(16);
		});
		
		return uuid;
	}

	export function encryptCodes(content,passcode) {
		var result = []; var passLen = passcode.length ;
		for(var i = 0  ; i < content.length ; i++) {
			var passOffset = i%passLen ;
			var calAscii = (content.charCodeAt(i)+passcode.charCodeAt(passOffset));
			result.push(calAscii);
		}
		
		return JSON.stringify(result) ;
	}
	export function decryptCodes (content, passcode) {
		var result = [];var str = '';
		var codesArr = JSON.parse(content);var passLen = passcode.length ;
		for(var i = 0  ; i < codesArr.length ; i++) {
			var passOffset = i%passLen ;
			var calAscii = (codesArr[i]-passcode.charCodeAt(passOffset));
			result.push(calAscii) ;
		}
		for(var i = 0 ; i < result.length ; i++) {
			var ch = String.fromCharCode(result[i]); str += ch ;
		}
		
		return str ;
	}
	
	export function ejabbordRegister(sipid, sippwd)
	{
		//$('.loadersimg').css("display","block");
		var settings = {
			xmpp: {
			  url: '/http-bind/',
			  domain: window.ChatDomain,
			  resource: 'example',
			  overwrite: true
			}
		};
		if(window.loggedSuccess) window.loggedSuccess();
	
		
    }
    
    export function Devicecheck() 
	{

		  var module = {
			options: [],
			header: [navigator.platform, navigator.userAgent, navigator.appVersion, navigator.vendor, window.opera],
			dataos: [{
			  name: 'Windows Phone',
			  value: 'Windows Phone',
			  version: 'OS'
			}, {
			  name: 'Windows',
			  value: 'Win',
			  version: 'NT'
			}, {
			  name: 'iPhone',
			  value: 'iPhone',
			  version: 'OS'
			}, {
			  name: 'iPad',
			  value: 'iPad',
			  version: 'OS'
			}, {
			  name: 'Kindle',
			  value: 'Silk',
			  version: 'Silk'
			}, {
			  name: 'Android',
			  value: 'Android',
			  version: 'Android'
			}, {
			  name: 'PlayBook',
			  value: 'PlayBook',
			  version: 'OS'
			}, {
			  name: 'BlackBerry',
			  value: 'BlackBerry',
			  version: '/'
			}, {
			  name: 'Macintosh',
			  value: 'Mac',
			  version: 'OS X'
			}, {
			  name: 'Linux',
			  value: 'Linux',
			  version: 'rv'
			}, {
			  name: 'Palm',
			  value: 'Palm',
			  version: 'PalmOS'
			}],
			databrowser: [{
			  name: 'Chrome',
			  value: 'Chrome',
			  version: 'Chrome'
			}, {
			  name: 'Firefox',
			  value: 'Firefox',
			  version: 'Firefox'
			}, {
			  name: 'Safari',
			  value: 'Safari',
			  version: 'Version'
			}, {
			  name: 'Internet Explorer',
			  value: 'MSIE',
			  version: 'MSIE'
			}, {
			  name: 'Opera',
			  value: 'Opera',
			  version: 'Opera'
			}, {
			  name: 'BlackBerry',
			  value: 'CLDC',
			  version: 'CLDC'
			}, {
			  name: 'Mozilla',
			  value: 'Mozilla',
			  version: 'Mozilla'
			}],
			init: function() {
			  var agent = this.header.join(' '),
				os = this.matchItem(agent, this.dataos),
				browser = this.matchItem(agent, this.databrowser);

			  return {
				os: os,
				browser: browser
			  };
			},
			matchItem: function(string, data) {
			  var i = 0,
				j = 0,
				html = '',
				regex,
				regexv,
				match,
				matches,
				version;

			  for (i = 0; i < data.length; i += 1) {
				regex = new RegExp(data[i].value, 'i');
				match = regex.test(string);
				if (match) {
				  regexv = new RegExp(data[i].version + '[- /:;]([\\d._]+)', 'i');
				  matches = string.match(regexv);
				  version = '';
				  if (matches) {
					if (matches[1]) {
					  matches = matches[1];
					}
				  }
				  if (matches) {
					matches = matches.split(/[._]+/);
					for (j = 0; j < matches.length; j += 1) {
					  if (j === 0) {
						version += matches[j] + '.';
					  } else {
						version += matches[j];
					  }
					}
				  } else {
					version = '0';
				  }
				  return {
					name: data[i].name,
					version: parseFloat(version)
				  };
				}
			  }
			  return {
				name: 'unknown',
				version: 0
			  };
			}
		  };
		  var e = module.init();
         
          return e.os.name;
    }
    
	export let device_id = Devicecheck() +"_"+GenerateGUID();
	


	