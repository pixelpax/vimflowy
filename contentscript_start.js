
var scripts = [ 
    "state.js",
    "TimeTagCounter.js",
    "easyMotion.js",
    "cursorMovement.js",
    "vimflowyFunctionLibrary.js"
    ];

for (var i=0; i < scripts.length; i++) 
{
    var s = document.createElement('script');
    s.src = chrome.extension.getURL(scripts[i]);
    (document.head||document.documentElement).appendChild(s);
    s.onload = function() {
        this.parentNode.removeChild(this);
    };
}
