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
    - `d$`, `dr`: cut from cursor location to the very end of line 
    - `u`: Undo
    - `y`,`Y`: yank (copy) focused item (and children)
    - `p`: paste yanked item below focused item 
    - `P`: paste yanked item above focused item
    - `<Ctrl>r`: Redo
    - `<Ctrl>l`: Zoom in on focused node 1 step and retain focus on that node 
    - `<Ctrl>h`: Zoom out of focused node 1 step and retain focus on that node 
    - `V`:  Add current item to Selection
    - `K`:  add below item to Selection 
    - `J`:  add above item to Selection
    - `dd`: delete the current bullet(s)
    - `dw`: cut from cursor location to next word
    - `de`: cut from cursor location to the end of the current word
    - `<Alt>J`: Move the current line down
    - `<Alt>K`: Move the current line up
    - `<Alt>h`: zoom out (identical to WF zoom out) 
    - `<Alt>l`: zoom in  (identical to WF zoom in) 
    - `<Alt>Enter`: will open the first URL found in the focusedItems name or note 
    - `Space`: toggle expande/collapse on focusedItem 
    - `<ctrl>Space`: toggle expand/collapse on all items under currentItemRoot 
    - `Enter`: Zoom in on focused node - and place current item in memory 
    - `Backspace`: zoom in on item which was place in memory when using 'Enter'
    - `§`: toggle time counter. (use #1d, #2h, #30m tags for it to count) 
    - `<Ctrl>k`,`<Ctrl>~`: Use Workflowys JumpToItemMenu 
    - `V`,`v`: Enter visual mode 
    - `Tab`,`>`: indent item(s)
    - `<shift>Tab`,`<`: outdent item(s)
* insert mode
    - `<Esc>`,`<jk>` : Enter Normal mode
    - `<Ctrl>k`,`<Ctrl>~`: Use Workflowys JumpToItemMenu 
* visual mode
    - `Tab`,`>`: indent item(s)
    - `<shift>Tab`,`<`: outdent item(s)
    - `V`,`v`,`<Esc>`: Enter normal mode 
    - `y`, `Y`: yank (copy) selected and enter normal mode 
    - `d`: delete selected items and enter normal mode 
    - `<Alt>J`: Move the current selection down 
    - `<Alt>K`: Move the current selection up 
    - `u`: Undo
    - `Space`: toggle expande/collapse on focusedItem 
    - `<ctrl>Space`: toggle expand/collapse on all items under currentItemRoot 
    - `<Ctrl>r`: Redo
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
