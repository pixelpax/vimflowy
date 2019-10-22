
var scripts = [ 
    "state.js",
    "TimeTagCounter.js",
    "easyMotion.js",
    "cursorMovement.js",
    "vimflowyFunctionLibrary.js",
    "keybindings.js",
    "transparentKeybindings.js",
    "vimflowy.js"
    ];

for (var i=0; i < scripts.length; i++) 
{
    var s = document.createElement('script');
    s.src = chrome.extension.getURL(scripts[i]);
    s.onload = function() {
        this.parentNode.removeChild(this);
    };
    (document.head||document.documentElement).appendChild(s);
    console.log("appending: ", s);
}
