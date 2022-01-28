


Vimflowy: Vim shortcuts for Dynalist
=====================================

This extension adds (some) VIM keyboard shortcuts to Workflowy.com.

These keyboard shortcuts are similar, if not identical, in their behaviour to the ones that can be found in the text editor called VIM. All VIM behaviours are not supported yet. New shortcuts are continously added.

Keybindings
-----------

Vimflowy will block keystrokes which haven't been bound in all modes - except insert mode. However, keys that have been modified with ALT/CTRL/META (but not SHIFT) are allowed to passthrough. For example `<Shift>d` will be blocked but `<Ctrl>d` or `<alt>d` will be allowed to pass through. 

* Normal mode
    - `j`: Move down one item
    - `k`: Move up one item
    - `h`: Move cursor left
    - `l`: Move cursor right
    - `i`: Insert before currently selected character
    - `a`: Insert after currently selected character
    - `I`: Insert at the beginning of the line
    - `A`: Insert after the end of the line
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
    - `G`: Go to the bottom of focused list
    - `GG`: Go to the bottom of current list, recursivly
    - `#`: search for the word under the cursor. Works as tag search.
    - `u`: Undo
    - `<Ctrl>r`: Redo
    - `y`: yank (duplicate) focused items
    - `Y`: yank (mirror) focused items
    - `p`: paste yanked items below focused item
    - `P`: paste yanked items above focused item
    - `<alt>l`: Zoom in on focused node 1 step and retain focus on that node
    - `<alt>h`: Zoom out of focused node 1 step and retain focus on that node
    - `<Alt>J`: Move the current line down
    - `<Alt>K`: Move the current line up
    - `<Alt>1-7`: Color focused item name/note (depending on where the cursor is)
    - `<Alt>0`: Remove coloring from the focused item name/note (cursor dependent)
    - `<ctrl>h`: zoom out (identical behaviour as WF zoom out - but instant)
    - `<ctrl>l`: zoom in  (identical behaviour as WF zoom in  - but instant)
    - `<ctrl>j`: Jump to node via EasyMotion
    - `<Ctrl>c`: Copies focused item to clipboard; enabling you to paste items between browsers. 
    - `V`,`v`: Enter visual mode
    - `>`,`<alt>L`,`Tab`: indent item(s)
    - `<alt>H`,`<shift>Tab`: outdent items
    - `<`: outdent items (and selected kids once the parent item hits the wall)
    - `<Alt>Enter`: Will open first URL found in the focusedItems name or note. Works with Workflowys inline linking feature.
    - `<Shift><Alt>Enter`: zoom in on a mirrored items parent. (use backspace to get back again)
    - `Space`, `z`: toggle expand/collapse on focusedItem
    - `<ctrl>Space`: toggle expand/collapse on all items under currentItemRoot
    - `Enter`: Zoom in on focused node - and place current item in memory
    - `Backspace`: zoom in on item which was place in memory when using 'Enter'
    - `<alt>§`, `` <alt>` ``: toggle work time counter; displaying num (8 hour) days and num (5 day) Weeks worth of tags. (use #1d, #2h, #30m tags for it to count)
    - `§`, `` ` ``: sort completed items according to time and place them at the bottom
    - `r`: replace character under cursor 
    - `x`: remove character under cursor
    - `s`: remove character under cursor + insert mode
    - `f`: find character after cursor in current line. Ex: fb will find the 1st b occurence, 3fb will find 3rd b occurence. 
    - `t`: same as 'f' but cursor moves to just before found character
    - `F`: backwards version of 'f'
    - `T`: backwards version of 't'
    - `S`: substitute entire line - deletes line, enters insertion mode
    - `C`: change to end of line
    - `d$`, `D`: delete to end of line
    - `dd`: yank items (by copy) and delete the currently selected item(s)
    - `de`: cut from cursor location to the end of the current word
    - `dm`: detach mirror 
    - `ce`: de + goToInsertMode
    - `dw`: cut from cursor location to next word
    - `cw`: dw + goToInsertMode
    - `dn`: delete note
    - `cn`: change note == delete note + insert mode
    - `diw`: delete word under cursor. Works with a numeric 0-9 prefix to make the command repeat. 4ciw, for example. 
    - `ciw`: deletes word under cursor + insert-mode. Works with a numeric 0-9 prefix.
    - `daw`: deletes word under the cursor and trims off any white space at the end. Works with a numeric 0-9 prefix.
* insert mode
    - `<jk>` : Enter Normal mode
* visual mode
    - `>`,`<alt>L`,`Tab`: indent item(s) + enter normal mode
    - `<alt>H`,`<shift>Tab`: outdent items +  enter normal mode
    - `<`: outdent items (and selected kids once the parent item hits the wall) +  enter normal mode
    - `V`,`v`,`<Esc>`: Enter normal mode
    - `y`: yank (duplicate) focused items and enter normal mode
    - `Y`: yank (mirror) focused items and enter normal mode
    - `d`: yank (copy) + delete selected items + enter normal mode
    - `D`: delete notes on all selected items
    - `G`: Adds the siblings below to the selection
    - `g`: Adds the siblings above to the selection
    - `GG`: Adds the ancestors below to the selection
    - `gg`: Adds the ancestors above to the selection
    - `<Alt>J`: Move the current selection down
    - `<Alt>K`: Move the current selection up
    - `u`: Undo + exit visual mode
    - `<Ctrl>r`: Redo
    - `<Ctrl>c`: Copies selected items to clipboard; enabling you to paste items between browsers. 
    - `Space`: toggle expand/collapse on focusedItem
    - `<ctrl>Space`: toggle expand/collapse on all items under currentItemRoot
    - `<Alt>1-7`: Color selected items
    - `<Alt>0`: Remove Color from selected items
* all modes
    - `<Esc>`, `<ctrl>[`: Enter Normal mode
    - `<Ctrl>Dead`, `<Ctrl>;`, `<Ctrl>:`: Use Workflowys JumpToItemMenu
    - `<Ctrl>k`: Edit links when focusing on a link. Secondary behaviour is to prompt the Workflowys JumpToItemMenu
    - `<ctrl>Enter`: Toggle Completed on seletion

Mode indicator
--------------

In the bottom left corner there is a mode indicator that shows what mode you are in currently.

Rebinding keys
--------------

You'll have to edit [keybinding.js](https://github.com/Wojnach/vimflowy/blob/master/keybindings.js) or [transparentKeybindings.js](https://github.com/Wojnach/vimflowy/blob/master/transparentKeybindings.js) if you want to rebind or add new shortcuts.

mac users: if you want to bind stuff to Cmd you'll have to type "meta-" instead. "meta-j" instead of "cmd-j" for example. 

Usage tips
----------

If you're using [cvim](https://chrome.google.com/webstore/detail/cvim/ihlenndgcmojhcghmfjfneahoeklbjjh) (or any other Chrome extensions that install modal keybindings), make sure you add `http*://*.workflowy.com/*`to the excluded URLs.

Installation
------------

The extension is available on the [chrome web store](https://chrome.google.com/webstore/detail/vimflowy/jhoonlfajlaihdlcocigbpeacapaepng)

But you can also download and install an unofficial version:
1. Clone this repo (or your fork) somewhere on your filesystem.
2. go to `chrome://extensions/`
3. click 'Load unpacked extension...' button right below 'Extensions' header in the top left corner of the page
4. point at the vimflowy repo directory
5. refresh workflowy page

Tested on
---------

The extension has mainly been tested on nordic QWERTY keyboards running windows 10, but it should work on other keyboard configurations as well. Please report any bugs you might find at [Issues](https://github.com/Wojnach/vimflowy/issues)

<a href="https://www.buymeacoffee.com/Wojnach" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png" alt="Buy Me A Coffee" style="height: auto !important;width: auto !important;" ></a>
