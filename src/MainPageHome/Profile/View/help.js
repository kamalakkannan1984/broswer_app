
export function openBrowserWin(url)
{
	if(!url.includes("http"))
			url = "https://"+url;
	
	window.open(url);
}