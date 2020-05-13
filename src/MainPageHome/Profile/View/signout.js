export function BrowserSignOut(setpresence)
{
	var answer = window.confirm("Do You Want To Sign Out?")
	if (answer) {
		setpresence('unavailable');
		var login = localStorage.getItem("remember") || [];
		window.localStorage.clear();
		if(login.length > 0)
			localStorage.setItem("remember",login);

		if(window.loggedOut) window.loggedOut();

		window.location = "index.html"; 
	}
}