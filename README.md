Vimflowy: Vim shortcuts for Workflowy
=====================================

Keybindings
-----------

Disclaimer: for now normal mode blocks unsupported keystrokes without alt/ctrl/shift/meta to prevent typing in normal mode, but not to block native chrome and workflowy shortcuts.

* Normal mode
    - `j`: Move down one item
    - `k`: Move up one item
    - `h`: Move cursor left
    - `l`: Move cursor right
    - `i`: Enter Insert mode
    - `/`: Focus the search box
    - `?`: Focus the search box
* insert mode
    - `<Esc>`: Enter Normal mode
* workflowy manipulation
    - `<Alt>l`: Zoom into current list item
    - `<Alt>h`: Zoom out of current list

Usage tips
----------

If you're using [cvim](https://chrome.google.com/webstore/detail/cvim/ihlenndgcmojhcghmfjfneahoeklbjjh) (or any other Chrome extensions that install modal keybindings), make sure you add `http*://*.workflowy.com/*`to the excluded URLs.

It also works if you run Workflowy in Chromium's app mode: i.e. `chromium --app="https://workflowy.com"` (the extension is loaded underneath).

Installation
------------

* for chrome
  1. Clone this repo (or your fork) somewhere on your filesystem. 
  2. go to `chrome://extensions/`
  3. click 'Load unpacked extension...' button right below 'Extensions' header in the top left corner of the page
  4. point at the vimflowy repo directory
  5. ...
  6. profit

Tested on
---------

These are environment specs that this thing was used on and was usable. If you ever use it on a different environment, feel free to create a PR with your spec in this list :)

Please add items in this format: '<output of `lsb_release -a`>, Chrome <Version info from `chrome://settings/help`>'

* Ubuntu 16.04.3 LTS, Chrome Version 61.0.3163.91 (Official Build) (64-bit)
