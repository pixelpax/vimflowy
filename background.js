
chrome.tabs.onCreated.addListener(injectCSSToWorkflowy);
chrome.tabs.onUpdated.addListener(function(tabId, info, tab) 
{
	console.log("onUpdated status: " + info.status);
    if (info.status == 'complete') 
		injectCSSToWorkflowy(tab);
});

const isWorkFlowy = url => /https:\/\/(beta\.|dev\.)?workflowy\.com(\/$|\/#)/.test(url);

chrome.webNavigation.onCommitted.addListener(function(navDetails) 
{
	console.log("navDetails: " + navDetails);
	console.log("navDetails url: " + navDetails.url);
	console.log("navDetails transition: " + navDetails.transitionType);

    if (!navDetails.url || isWorkFlowy(navDetails.url) == false) 
		return;

	injectCSS(navDetails.tabId);
});

function injectCSSToWorkflowy(tab)
{
	console.log("tab url: " + tab.url);

    if (!tab.url || isWorkFlowy(tab.url) == false) 
		return;

	injectCSS(tab.id);
}

function injectCSS(tabId) 
{
		console.log("inserting CSS");
        chrome.tabs.insertCSS(tabId, 
		{
			// runAt: "document_start",
			file: "WorkflowySolarized_Dark.css"
        });

    // var currentVimflowyTheme = localStorage.getItem("vimflowyTheme");
    // chrome.storage.local.get(['vimflowyTheme'], function(result) {
	// 	console.log("vimflowyTheme is: " + result.key);
	// 	console.log("vimflowyTheme is: " + result);
	// 	console.log("vimflowyTheme is: " + result.vimflowyTheme);
	// });

	// if(currentVimflowyTheme != 'none')
	// 	console.log("injecting CSS: " + currentVimflowyTheme);
}
