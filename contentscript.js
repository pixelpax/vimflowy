
var scripts = [ 
    // "jquery.js",
    "state.js",
    "search.js",
    "TimeTagCounter.js",
    "cursorMovement.js",
    "vimflowy.js" 
    ];

for (var i=0; i < scripts.length; i++) {
    var s = document.createElement('script');
    s.src = chrome.extension.getURL(scripts[i]);
    s.onload = function() {
        this.parentNode.removeChild(this);
    };
    (document.head||document.documentElement).appendChild(s);
    console.log("appending: ", s);
}

//TEMP
chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    if (msg.text === 'are_you_there_content_script?') {
      sendResponse({status: "yes"});
    }
});