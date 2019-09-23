Vimflowy: Vim shortcuts for Workflowy
=====================================

Keybindings
-----------

Disclaimer: normal mode blocks unsupported keystrokes which haven't been modified by alt, ctrl, or meta. So for example it will block `<Shift>d` but allow `<Ctrl>d` or `<alt>d` to pass through. 

* Normal mode
    - `j`: Move down one item
    - `k`: Move up one item
    - `h`: Move cursor left
    - `l`: Move cursor right
    - `i`: Insert before currently selected character
    - `a`: Insert after currently selected character
    - `/`: Start search 
    - `o`: Create a new bullet below current line and go into insert mode
    - `O`: Create a new bullet above current line and go into insert mode
    - `e`: move to end of word 
    - `w`: move forward one word 
    - `b`: move backwards 1 word 
    - `0`,`B`,`^`: Move cursor to the first character of the line
    - `E`,`$`: Move cursor to the last character on the line
    - `gg`: Go to top most root item on page 
    - `g`: Go to root item of the currently focused list
    - `G`: Go to the bottom most root item on the current page
    - `I`: Insert at the beginning of the line
    - `A`: Insert after the end of the line
    - `x`: remove character under cursor 
    - `d$`, `D`: cut from cursor location to the very end of line 
    - `u`: Undo
    - `y`,`Y`: yank (copy) focused items (and children)
    - `p`: paste yanked items below focused item 
    - `P`: paste yanked items above focused item
    - `<Ctrl>r`: Redo
    - `<alt>l`: Zoom in on focused node 1 step and retain focus on that node 
    - `<alt>h`: Zoom out of focused node 1 step and retain focus on that node 
    - `dd`: yank and delete the current item(s)
    - `dw`: cut from cursor location to next word
    - `de`: cut from cursor location to the end of the current word
    - `<Alt>J`: Move the current line down
    - `<Alt>K`: Move the current line up
    - `<ctrl>h`: zoom out (identical behaviour as WF zoom out - but instant) 
    - `<ctrl>l`: zoom in  (identical behaviour as WF zoom in  - but instant) 
    - `V`,`v`: Enter visual mode 
    - `Tab`,`>`,`<alt>L`: indent item(s)
    - `<shift>Tab`,`<`,`<alt>H`: outdent item(s)
    - `<Alt>Enter`: will open the first URL found in the focusedItems name or note 
    - `Space`: toggle expand/collapse on focusedItem 
    - `<ctrl>Space`: toggle expand/collapse on all items under currentItemRoot 
    - `Enter`: Zoom in on focused node - and place current item in memory 
    - `Backspace`: zoom in on item which was place in memory when using 'Enter'
    - `<alt>§`: toggle time counter. (use #1d, #2h, #30m tags for it to count) 
    - `§`: sort completed items according to time and place them at the bottom 
    - `<Ctrl>k`,`<Ctrl>~`: Use Workflowys JumpToItemMenu 
    - `<ctrl>Enter`: Toggle Completed on seletion 
* insert mode
    - `<Esc>`,`<jk>` : Enter Normal mode
    - `<Ctrl>k`,`<Ctrl>~`: Use Workflowys JumpToItemMenu 
* visual mode
    - `Tab`,`>`: indent item(s)
    - `<shift>Tab`,`<`: outdent item(s)
    - `V`,`v`,`<Esc>`: Enter normal mode 
    - `y`, `Y`: yank (copy) selected items and enter normal mode 
    - `d`: yank, delete selected items and enter normal mode 
    - `<Alt>J`: Move the current selection down 
    - `<Alt>K`: Move the current selection up 
    - `<ctrl>Enter`: Toggle Completed on seletion 
    - `u`: Undo
    - `<Ctrl>r`: Redo
    - `Space`: toggle expand/collapse on focusedItem 
    - `<ctrl>Space`: toggle expand/collapse on all items under currentItemRoot 
    - `<Ctrl>k`,`<Ctrl>~`: Use Workflowys JumpToItemMenu 

Mode indicator
--------------

In the bottom left corner there is a mode indicator that shows what mode you are in currently. 

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

Only tested on window 10 so far. Some keybindings might differ on MAC - so let me know if something isn't working!
