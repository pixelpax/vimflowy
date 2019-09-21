    chrome.runtime.onInstalled.addListener(function() {
    chrome.storage.sync.set({color: '#3aa757'}, function() {
      console.log("The color is green.");
    });
  });
 
    chrome.runtime.onInstalled.addListener(function() {
         console.log("The color is green.");
  }); 

  chrome.tabs.onActivated.addListener(function(activeInfo){
  tabId = activeInfo.tabId

  // chrome.tabs.sendMessage(tabId, {text: "are_you_there_content_script?"}, function(msg) {
  //   msg = msg || {};
  //   if (msg.status != 'yes') {
  //     chrome.tabs.executeScript(tabId, {file: "contentscript.js"});
  //   }
  // });

}); 