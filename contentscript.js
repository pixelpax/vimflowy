var scripts = [ 
    "state.js",
    "search.js",
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
}
