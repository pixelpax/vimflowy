
var scripts = [ 
    "keybindings.js",
    "transparentKeybindings.js",
    "vimflowy.js"
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
