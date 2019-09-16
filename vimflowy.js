const keyFrom = event => `${event.altKey ? 'alt-': ''}${event.ctrlKey ? 'ctrl-' : ''}${event.key && event.key}`

const Mode = {
  NORMAL: 'NORMAL',
  INSERT: 'INSERT'
}

const state = stateClosure({
    mode: Mode.NORMAL,
    anchorOffset: 0,
    debug: false
  }
)

const debug = (...args) => state.get().debug && console.log(...args)

const modeClosure = (mainContainer, getState, setState) => {
  const indicatorElement = document.createElement('div')
  indicatorElement.setAttribute('style', 'position: fixed; z-index:9001; bottom:0; left: 0; background-color: grey; color: white; padding: .3em; font-family: sans-serif;')
  indicatorElement.innerHTML = 'NORMAL'
  document.querySelector('body').append(indicatorElement)

  let timerId = null
  const setMode = modeText => {
    clearTimeout(timerId)
    indicatorElement.innerHTML = modeText
  }

  return {
    flashMode: (temporaryMode, duration = 1000) => {
      setMode(temporaryMode)
      timerId = setTimeout(() => {
        indicatorElement.innerHTML = getState().mode
      }, duration)
    },
    goToInsertMode: (cursorRight = false) => {
      setState(s => ({mode: Mode.INSERT}))
      setMode(Mode.INSERT)
      document.getSelection().modify('extend', 'left', 'character')
      if (cursorRight) {
        document.getSelection().modify('move', 'right', 'character')
      }
    },
    goToNormalMode: () => 
    {
      if(state.get().mode === Mode.NORMAL)
      {
        setCursorAt(a => a)
      }
      else
      {
        // update cursor pos based on where we ended up after INSERT mode
        setCursorAt(document.getSelection().getRangeAt(0).startOffset-1);
      }

      setState(s => ({mode: Mode.NORMAL}))
      setMode(Mode.NORMAL)
    }
  }
}

  $(() => 
  {
    function fixFocus() 
    {
      const active = document.activeElement.className;

      // console.log("attempting to fix focus");

      if (active.includes("searchBoxInput")) 
        return;

      if (active.includes("content")) 
        return;

      // console.log("focus fixed");

      const matches = document.querySelectorAll(".name.matches .content, .notes.matches .content");
      matches.length > 0 ? matches[0].focus() : document.getElementsByClassName("content")[0].focus();
    }

    function preventDefaultWhileInNormalMode(event)
    {
      // console.log("trying to prevent: " + event.key);
      if (state.get().mode === Mode.NORMAL)
      {

       if(modifierKeyCodesToIgnore.includes(event.keyCode))
       {
          event.preventDefault();
          event.stopPropagation();
          // console.log("blocking modifier keys");
       }

        // const input = ValidNormalKeys.includes(event.key);
        const input = '1234567890[{]};:\'",<.>/?\\+=_-)(*&^%$#@~`!abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ'.includes(event.key);
        const modified = (event.metaKey || event.altKey || event.ctrlKey)
        if (input && !modified)
        // const modified = (event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)
        // if (input || !modified)
        {
          // const normalModeExceptions = 
          // [
          //   // 'F12'
          //   'Delete'
          //   ,'alt-d'
          // ]

          // console.log("illegal key");
          // console.log(event.keyCode);
          // console.log("modified? " + modified);

          // if(!normalModeExceptions.includes(keyFrom(event)))
          // {
          event.preventDefault();

            // !!! bind the key if you need to stopPropagation() as well. 
            // event.stopPropagation();
          // }

        }
      }
    }

    // function focusOnItemOverTime(itemToFocus)
    // {
    //     if(itemToFocus == null)
    //       return;

    //     forceFocusItem = itemToFocus;
    //     clearInterval(forceFocusItemID);
    //     forceFocusItemID = setInterval(() => 
    //     {
    //       // the page will have successfully zoomed out
    //       // once the focused item becomes valid again
    //       const currentlyFocusedItem = WF.focusedItem();
    //       if(currentlyFocusedItem != null)
    //       {
    //         WF.editItemName(forceFocusItem);
    //         clearInterval(forceFocusItemID);
    //         forceFocusItem = null;
    //         forceFocusItemID = null;
    //       }
    //       else
    //       {
    //         console.log("waiting for zoom animation to finish");
    //       }
    //     }, 10); 
    // }

    function mouseClickIntoInsertMode()
    {
      if(state.get().mode === Mode.NORMAL)
      {

        goToInsertMode(true);

        if(!WF.focusedItem())
        {
          // we clicked somewhere outside of the tree revert to normal mode!
          WF.zoomTo(WF.currentItem());
          WF.editItemName(WF.currentItem());
          goToNormalMode();
        }

      // console.log("mouse focus fix");
        requestAnimationFrame(fixFocus);

        // only go into insert mode if we are clicking - NOT selecting
        // if(!document.getSelection() || document.getSelection().toString().length == 0)
        // {
        //   goToInsertMode(true);
        //   goToNormalMode();
        //   goToInsertMode(true);
        // }
      }
    }

    function reselectItemsBeingMoved()
    {
      // Bulk moving items deselects them...
      // Reselecting them during the same event "frame"
      // does not work - which is why we do it on the keyup event for now.
      if (SelectionPreMove !== undefined && SelectionPreMove.length != 0) 
      {
        WF.setSelection(SelectionPreMove);
        SelectionPreMove = [];
      }
    }

    function updateKeyBuffer_Keydown(event)
    {
      if(modifierKeyCodesToIgnore.includes(event.keyCode))
        return true;

      const key = event.key;

      if(keyBuffer.includes(key_Slash))
      {

        if(key == 'Backspace')
        {
          if(keyBuffer.length > 1)
          {
            keyBuffer.pop();
          }
        }
        else if(!keyBuffer.includes('Enter'))
        // else
        {
          keyBuffer = [...keyBuffer, key];

          const filteredKeys = keyBuffer.filter(function(value, index, arr)
          {
            return validSearchKeys.includes(value);
          });

          var slashIndex = filteredKeys.indexOf("/");
          if (slashIndex > -1) {
              filteredKeys.splice(slashIndex, 1);
          }

          const keyBufferStr = filteredKeys.join(""); 

          WF.hideMessage();
          WF.showMessage(keyBufferStr.bold(), false);
        }
      }
      else if(key == key_Slash)
      {
        if(state.get().mode === Mode.NORMAL)
        {
          // focus on top item otherwise search fails
          WF.editItemName(WF.currentItem());
          keyBuffer = [key];
        }
      }
      else
      {
        if(keyBuffer.length > 2)
          keyBuffer.shift();

        keyBuffer = [...keyBuffer, key];
      }

      if(keyBuffer.includes(key_Slash) && key != key_Esc)
      {
        return true;
      }

      return false;
    }

    function updateKeyBuffer_Keyup(event)
    {
      const searchQuery = WF.currentSearchQuery();
      const key = event.key;

      if(keyBuffer.includes(key_Slash))
      {
        if(key == key_Esc)
        {
          keyBuffer = [];
          // console.log("clearing buffer and search");
          WF.hideMessage();
          WF.search("");
          WF.clearSearch();
          WF.editItemName(WF.currentItem());
        }
        else if(key == 'Enter' || keyBuffer.includes('Enter'))
        // else if(searchQuery !== null && key == 'Enter' || keyBuffer.includes('Enter') )
        // else if(key == 'Enter')
        {
          // console.log(searchQuery);

          if(searchQuery !== null)
          {
            WF.editItemName(WF.currentItem());
            keyBuffer = [];
            WF.hideMessage();
          }
          else
          {
            keyBuffer = [...keyBuffer, key];
            if(key == 'Enter')
            {
              WF.hideMessage();
              WF.showMessage("Waiting for search Query to complete...".bold(), true);
            }
          }

        }
        else
        {
          const filteredKeys = keyBuffer.filter(function(value, index, arr)
          {
            return validSearchKeys.includes(value);
          });

          // console.log(filteredKeys);

          var slashIndex = filteredKeys.indexOf("/");
          if (slashIndex > -1) {
              filteredKeys.splice(slashIndex, 1);
          }

          const keyBufferStr = filteredKeys.join(""); 

          WF.hideMessage();
          WF.showMessage(keyBufferStr.bold(), false);
          WF.search(keyBufferStr);
        }
      }
      else if(searchQuery !== null && key == 'Escape')
      {
          WF.search("");
          WF.clearSearch();
          WF.editItemName(WF.currentItem());
      }
    }

    window.toggleDebugging = () => state.set(s => ({
      debug: !s.debug
    })) 

  const offsetCalculator = state => (contentAbstraction, offset) => {
    const maxOffset = contentAbstraction.length - 1
    const bound = o => {
      let inBounds = o
      inBounds = Math.min(maxOffset, inBounds)
      inBounds = Math.max(0, inBounds)
      return inBounds
    }

      const currentOffset = state.get().anchorOffset

    const effective = bound(offset(currentOffset))
    state.set(_ => ({anchorOffset: effective}))
    return effective
  }

  //searchBox(state.set, state.get, offsetCalculator(state))
  //const mainContainer = document.getElementById('pageContainer')
  // const mainContainer = document.getElementById('app')
  const mainContainer = document.getElementById('app');

  const {flashMode, goToInsertMode, goToNormalMode} = modeClosure(mainContainer, state.get, state.set)

  const onlyIfProjectCanBeEdited = command => target => {
    const targetProject = projectAncestor(target)
    const isMainDotOfForeignSharedList = targetProject.className.includes('addedShared')

    const isNotEditable = targetProject.getAttribute('data-tid') === '2'

    const commandShouldBePrevented = isMainDotOfForeignSharedList || isNotEditable

    if (commandShouldBePrevented) {
        flashMode('Cannot edit this')
        return
    }

    command(target)
  }

  // _cancels_ event propagation
  const actionMap = 
  {
    [Mode.NORMAL]: 
    {
      h: t => moveCursorLeft(t, offsetCalculator(state)),
      j: target => 
      {
        setCursorAfterVerticalMove(offsetCalculator(state), moveCursorDown(target));
      },
      k: target => setCursorAfterVerticalMove(offsetCalculator(state), moveCursorUp(target)),
      l: t => moveCursorRight(t, offsetCalculator(state)),
      i: onlyIfProjectCanBeEdited(() => goToInsertMode()),
      a: onlyIfProjectCanBeEdited(() => goToInsertMode(true)),
      // '/': t => { WF.search("test"); },
      //'/': searchCommand,
      //'?': searchCommand,
      e: t => 
      {
        const focusedItem = WF.focusedItem();
        if(!focusedItem)
          return;

        const split = focusedItem.getNameInPlainText().split(" ");
        const currentOffset = state.get().anchorOffset

        let traverseLength = 0;
        for(let i = 0; i < split.length; ++i) 
        {
          traverseLength += split[i].length;
          traverseLength += 1;

          if(split[i] == "")
            continue;

          const wordEndOffset = traverseLength - 2;
          if(wordEndOffset > currentOffset)
          {
            moveCursorTo(t, offsetCalculator(state), wordEndOffset);
            return;
          }
        }
      },
      w: t => 
      {
        const focusedItem = WF.focusedItem();
        if(!focusedItem)
          return;

        const itemName = focusedItem.getNameInPlainText();

        var currentOffset = state.get().anchorOffset;

        const substring_End = itemName.substring(currentOffset);
        const split = substring_End.split(" ");

        let traverseLength = currentOffset;
        for(let i = 0; i < split.length; ++i) 
        {

          if(split[i] == "")
          {
            traverseLength += 1;
            continue;
          }

          const wordEndOffset = traverseLength;
          if(wordEndOffset > currentOffset)
          {
            moveCursorTo(t, offsetCalculator(state), wordEndOffset + 1);
            return;
          }

          traverseLength += split[i].length;
        }
      },
      b: t => {

        const focusedItem = WF.focusedItem();
        if(!focusedItem)
          return;

        const nameInPlainText = focusedItem.getNameInPlainText();
        const split = nameInPlainText.split(" ");
        const currentOffset = state.get().anchorOffset

        let traverseLength = nameInPlainText.length - 1;
        for(let i = split.length-1; i >= 0; --i) 
        {
          traverseLength -= (split[i].length - 1);
          if(split[i] != "" && traverseLength < currentOffset)
          {
            moveCursorTo(t, offsetCalculator(state), traverseLength);
            return;
          }
          traverseLength -= 2;
        }

      },
      o: t => 
      {

        const focusedItem = WF.focusedItem();
        const parentItem = focusedItem.getParent();
        const currentItem = WF.currentItem();
        const bFocusHasVisibleChildren = focusedItem.getVisibleChildren().length != 0;

        // Just add item if we are focusing 
        // on the top-most-item (zoomed in)
        if(focusedItem.equals(currentItem))
        {
          WF.createItem(currentItem, 0);
        }
        else if (focusedItem.isExpanded() && bFocusHasVisibleChildren)
        {
          WF.createItem(focusedItem, 0);
        }
        else
        {
          const currentItemIndex = focusedItem.getPriority();
          const nextItemIndex = currentItemIndex + 1; 
          WF.createItem(parentItem, nextItemIndex);
        }

        goToInsertMode(false);

      },
      O: t => {
        const focusedItem = WF.focusedItem();
        const parentItem = focusedItem.getParent();
        const currentItem = WF.currentItem();
        if(!focusedItem.equals(currentItem))
        {
          const currentItemIndex = focusedItem.getPriority();
          WF.createItem(parentItem, currentItemIndex);
        }
        else
        {
          WF.createItem(currentItem, 0);
        }

        goToInsertMode();
      },
      'B': t => moveCursorToStart(t, offsetCalculator(state)),
      '0': t => moveCursorToStart(t, offsetCalculator(state)),
      '^': t => moveCursorToStart(t, offsetCalculator(state)),
      '$': t => moveCursorToEnd(t, offsetCalculator(state)),
      'E': t => moveCursorToEnd(t, offsetCalculator(state)),
      'I': onlyIfProjectCanBeEdited(t => {
        moveCursorToStart(t, offsetCalculator(state))
        goToInsertMode()
      }),
      'A': onlyIfProjectCanBeEdited(t => {
        moveCursorToEnd(t, offsetCalculator(state))
        goToInsertMode(true)
      }),
      'alt-l': t => {
        WF.zoomIn(WF.focusedItem());
      },
      'alt-h': t => {
        WF.zoomOut(WF.currentItem());
      },
      'ctrl-l': t => 
      {
        const focusedItem = WF.focusedItem();
        // console.log("attempting to peak in");
        if(focusedItem != null)
        {
          const focusedAncestors = focusedItem.getAncestors();
          if(focusedAncestors.length != 0)
          {
            // console.log("anscestors length : " + focusedAncestors.length);
            if(focusedAncestors.length == 1)
            {
              // console.log("zooming in on focused item: " + focusedItem.getNameInPlainText());

              // WF.zoomIn(focusedItem);
              WF.zoomTo(focusedItem);
            }
            else
            {
              const currentItem = WF.currentItem();
              focusedAncestors.forEach((item, i) => 
              {
                // console.log("index: " + i);
                // console.log("item: " + item.getNameInPlainText());
                const itemParent = item.getParent();
                if(itemParent && itemParent.equals(currentItem))
                {
                  // WF.zoomIn(item);
                  // focusOnItemOverTime(focusedItem);
                  WF.zoomTo(item);
                  WF.editItemName(focusedItem);
                  return;
                }
              });
            }
          }
        //   else
        //   {
        //     console.log("no anscestors");
        //   }
        }
        // else
        // {
        //   console.log("no focuseItem");
        // }
      },
      'ctrl-h': t => 
      {
        const currentItem = WF.currentItem();
        const focusedItem = WF.focusedItem();
        WF.editItemName(currentItem);

        // console.clear();
        // console.log("ctrl-h: currentItem: " + WF.currentItem().getNameInPlainText());

        if(currentItem.getParent())
        {
          WF.zoomTo(currentItem.getParent());
          // console.log("ctrl-h snapTo : " + currentItem.getParent().getNameInPlainText());
          if(!WF.focusedItem())
          {
            // console.log("ctrl-h focus lost after snap, fixing focus");
            requestAnimationFrame(fixFocus);
            goToNormalMode();
            WF.editItemName(currentItem);
            // WF.zoomOut(currentItem);
            // console.log("ctrl-h zoomOut: " + currentItem.getNameInPlainText());
          }
        }
        else
        {
          // console.log("ctrl-h ZoomOut: " + currentItem);
          // console.log(":((((((((((((((((((((((((((");
          WF.zoomOut(currentItem);
        }

        if(WF.focusedItem())
        {
          // console.log("ctrl-h focusedItemWhenWestarted: " + focusedItem.getNameInPlainText());
          // console.log("ctrl-h currentlyFocusedItem: " + WF.focusedItem().getNameInPlainText());
          // WF.editItemName(WF.focusedItem());
          WF.editItemName(focusedItem);
        }
        else
        {
          // console.log("ctrl-h failed");
          requestAnimationFrame(fixFocus);
          goToNormalMode();
          // WF.zoomTo(currentItem);
        }

        // focusOnItemOverTime(focusedItem);
        // console.log("preessing ctrl h");
      },
      x: t => 
      { 
        const currentOffset = state.get().anchorOffset;
        WF.insertText("");
        moveCursorTo(t, offsetCalculator(state), currentOffset);
        // setCursorAt(currentOffset);
        // goToInsertMode();
        // goToNormalMode();
        // goToNormalMode();
        // setCursorAt(currentOffset);
      },
      '§': t => {
          previousTimeTagCounterMsg = "";
          WF.hideMessage();
          bShowTimeCounter = !bShowTimeCounter;
      },
      P: t => 
      {
        if (yankBuffer === undefined || yankBuffer.length == 0) 
          return;

        if(yankBuffer[0] == null || yankBuffer[0] === undefined)
          return;

        const focusedItem = WF.focusedItem();
        const parentItem = focusedItem.getParent();

        if(parentItem == null)
          return;

        WF.editGroup(() => 
        {
          const yankParent = yankBuffer[0].getParent();
          const yankPrio = yankBuffer[0].getPriority();

          // we can only duplicate items that are "visible" 
          // (they share the same WF.currentItem())
          WF.moveItems([yankBuffer[0]], parentItem, 0);

          const createdItem = WF.duplicateItem(yankBuffer[0]);

          // move the item back once we've duplicated it
          const bCopyFromSameList = yankParent.equals(createdItem.getParent());

          WF.moveItems([yankBuffer[0]], yankParent, bCopyFromSameList ? yankPrio+2 : yankPrio);

          if(createdItem == null || createdItem == undefined)
            return;

          const createdItemName = createdItem.getName();
          var nameWithoutCopyTag = createdItemName.substring(0, createdItemName.length - 6);
          WF.setItemName(createdItem, nameWithoutCopyTag);

          if(focusedItem.equals(WF.currentItem()))
            WF.moveItems([createdItem], focusedItem, 0);
          else
            WF.moveItems([createdItem], parentItem, focusedItem.getPriority());

          // WF.zoomTo(parentItem);

          WF.editItemName(createdItem);
        });

      },
      p: t => 
      {
        if (yankBuffer === undefined || yankBuffer.length == 0) 
          return;

        if(yankBuffer[0] == null || yankBuffer[0] === undefined)
          return;

        const focusedItem = WF.focusedItem();
        const parentItem = focusedItem.getParent();

        if(parentItem == null)
          return;

        WF.editGroup(() => 
        {
          const yankParent = yankBuffer[0].getParent();
          const yankPrio = yankBuffer[0].getPriority();

          // we can only duplicate items that are "visible" 
          // (they share the same WF.currentItem())
          WF.moveItems([yankBuffer[0]], parentItem, 0);

          const createdItem = WF.duplicateItem(yankBuffer[0]);

          // move the item back once we've duplicated it
          const bCopyFromSameList = yankParent.equals(createdItem.getParent());
          WF.moveItems([yankBuffer[0]], yankParent, bCopyFromSameList ? yankPrio+2 : yankPrio);

          if(createdItem  == null || createdItem === undefined)
            return;

          const createdItemName = createdItem.getName();
          var nameWithoutCopyTag = createdItemName.substring(0, createdItemName.length - 6);
          WF.setItemName(createdItem, nameWithoutCopyTag);

          if(focusedItem.equals(WF.currentItem()))
            WF.moveItems([createdItem], focusedItem, 0);
          else
            WF.moveItems([createdItem], parentItem, focusedItem.getPriority()+1);

          WF.editItemName(createdItem);
        });

      },
      Y: t => 
      {
        if(WF.focusedItem())
          yankBuffer = [WF.focusedItem()];
      },
      y: t => 
      {
        if(WF.focusedItem())
          yankBuffer = [WF.focusedItem()];
      },
      u: t => { WF.undo(); },
      'ctrl-r': t => { WF.redo(); },
      ' ': t => {
        const focusedItem = WF.focusedItem();
        if(focusedItem.isExpanded())
          WF.collapseItem(focusedItem);
        else
          WF.expandItem(focusedItem);
      },
      'D': t =>
      {
        var CurrentSelection = WF.getSelection();
        if (CurrentSelection !== undefined && CurrentSelection.length != 0) 
        {
          WF.editGroup(() => 
          {
            CurrentSelection.forEach((item, i) => 
            {
              WF.deleteItem(item);
            });
          });
        }
      },
      'V': t =>
      {
        var CurrentSelection = WF.getSelection();
        var focusedItem = WF.focusedItem();
        CurrentSelection.push(focusedItem);
        WF.setSelection(CurrentSelection);
        // console.log("highlight pls");
      },
      'K': t =>
      {
        // limit it to the current scope for now
        if(WF.focusedItem().getPreviousVisibleSibling() == null)
          return;

        var CurrentSelection = WF.getSelection();

        setCursorAfterVerticalMove(offsetCalculator(state), moveCursorUp(t));

        CurrentSelection.unshift(WF.focusedItem());
        WF.setSelection(CurrentSelection);

      },
      'J': t =>
      {
        // limit it to the current scope for now
        if(WF.focusedItem().getNextVisibleSibling() == null)
          return;

        var CurrentSelection = WF.getSelection();

        setCursorAfterVerticalMove(offsetCalculator(state), moveCursorDown(t));

        CurrentSelection.push(WF.focusedItem());
        WF.setSelection(CurrentSelection);
      },
      'alt-J': t => 
      {

        var selection = WF.getSelection();
        if (selection === undefined || selection.length == 0) 
          selection = SelectionPreMove;

        if (selection !== undefined && selection.length != 0)
        {
          const nextItem = selection[selection.length-1].getNextVisibleSibling();
          if(nextItem == null)
            return;

          const parentItem = nextItem.getParent();

          SelectionPreMove = selection;
          WF.editGroup(() => 
          {
            WF.moveItems(selection, parentItem, nextItem.getPriority() + 1);
          });
        }
        else
        {
          const focusedItem = WF.focusedItem();
          const nextItem = focusedItem.getNextVisibleSibling();
          if(nextItem)
          {
            const parentItem = nextItem.getParent();
            WF.moveItems([nextItem], parentItem, focusedItem.getPriority());
          }
        }

      },
      'alt-K': t => 
      {
        var selection = WF.getSelection();
        if (selection === undefined || selection.length == 0) 
          selection = SelectionPreMove;

        if (selection !== undefined && selection.length != 0)
        {
          const prevItem = selection[0].getPreviousVisibleSibling();
          if(prevItem == null)
            return;

          const parentItem = prevItem.getParent();

          SelectionPreMove = selection;
          WF.editGroup(() => 
          {
            WF.moveItems(selection, parentItem, prevItem.getPriority());
          });
        }
        else
        {
          const focusedItem = WF.focusedItem();
          const prevItem = focusedItem.getPreviousVisibleSibling();
          if(prevItem)
          {
            const parentItem = focusedItem.getParent();
            WF.moveItems([focusedItem], parentItem, prevItem.getPriority());
          }
        }

      },
      'alt-j': t => {

        const focusedItem = WF.focusedItem();
        const nextItem = focusedItem.getNextVisibleSibling();
        if(nextItem == null)
          return;

        const parentItem = nextItem.getParent();
        WF.moveItems([nextItem], parentItem, focusedItem.getPriority());

      },
      'alt-k': t => {

        const focusedItem = WF.focusedItem();
        const prevItem = focusedItem.getPreviousVisibleSibling();
        if(prevItem == null)
          return;

        const parentItem = prevItem.getParent();

        WF.moveItems([focusedItem], parentItem, prevItem.getPriority());

      }
    },
    [Mode.INSERT]: 
    {
      // Escape: goToNormalMode,
      Esc: () => console.log('MAC?') || goToNormalMode() // mac?
    }
  }

  let PrevEnterItem = null;
  let SelectionPreMove = [];
  let bExpandAll = true;

  // _allows_ event propagation 
  const transparentActionMap = 
  {
    [Mode.NORMAL]: 
    {
      'ctrl- ': e => 
      {
        e.preventDefault()
        e.stopPropagation()
        const currentItem = WF.currentItem();
        const currentRootItem = currentItem;
        const Children = currentRootItem.getVisibleChildren();
        // const Children = currentRootItem.getChildren();
        if (Children !== undefined && Children.length != 0)
        {
          // fix focus loss problem when collapsing
          const focusedItem = WF.focusedItem();
          if(focusedItem.getParent().equals(currentItem) == false)
          {
            if(focusedItem.getParent().getParent().equals(currentItem))
              WF.editItemName(focusedItem.getParent());
            else
              WF.editItemName(currentItem);
          }

          bExpandAll = !bExpandAll;

          if(focusedItem)
          {
            // const focusKids = focusedItem.getChildren();
            const focusKids = focusedItem.getVisibleChildren();
            if(focusKids !== undefined && focusKids.length != 0)
            {
              bExpandAll = !focusedItem.isExpanded();
            }
          }

          WF.editGroup(() => 
          {
            Children.forEach((item, i) => 
            {
              if(bExpandAll)
                WF.expandItem(item);
              else
                WF.collapseItem(item);
            });
          });


        }
      },
      'ctrl-k': e => 
      {
        focusPreJumpToItemMenu = WF.focusedItem();
        goToInsertMode();
      },
      'ctrl-Dead': e => 
      {
        focusPreJumpToItemMenu = WF.focusedItem();
        goToInsertMode();
      },
      'alt-Enter': e => 
      {
        var focusedItem = WF.focusedItem();
        if(!focusedItem)
          return;

        focusedItem = WF.getItemById(focusedItem.getId());

        const element = focusedItem.getElement();
        const firstContentLink = element.getElementsByClassName('contentLink')[0]; 
        if(firstContentLink)
        {
          const contentHref = firstContentLink.getAttribute("href");
          // console.log("href: " + contentHref);
          const strippedHref = contentHref.replace(/(^\w+:|^)\/\//, '');
          // console.log("Stripped href: " + strippedHref);
          const focusedItemName = focusedItem.getNameInPlainText();
          // console.log("Name; " + focusedItemName);
          const focusedItemNote = focusedItem.getNoteInPlainText();
          // console.log("Note; " + focusedItemNote);
          if(focusedItemName.includes(strippedHref) || focusedItemNote.includes(strippedHref))
          {
            var win = window.open(contentHref, '_blank');
            win.focus();
          }
        }

      },
      Tab: e => 
      {
        var selection = WF.getSelection();
        if (selection === undefined || selection.length == 0) 
          selection = SelectionPreMove;

        if (selection !== undefined && selection.length != 0)
        {

          var prio = 0;
          var newParentItem = null;

          if(e.shiftKey)
          {
            const currentItem = WF.currentItem();
            const selectionsParent = selection[0].getParent();
            if(selectionsParent && !currentItem.equals(selectionsParent))
            {
              const grandParent = selectionsParent.getParent();
              if(grandParent)
              {
                newParentItem = grandParent;
                prio = selectionsParent.getPriority() + 1; 
              }
            }
          }
          else
          {
            newParentItem = selection[0].getPreviousVisibleSibling();
            if(newParentItem)
            {
              const kids = newParentItem.getChildren(); 
              if(kids.length != 0)
                prio = kids[kids.length-1].getPriority()+1;
            }
          }

          if(newParentItem == null || newParentItem === undefined)
            return;

          SelectionPreMove = selection;

          const currentOffset = state.get().anchorOffset
          // setCursorAt(currentOffset);
          WF.editItemName(newParentItem);

          WF.editGroup(() => 
          {
            WF.moveItems(selection, newParentItem, prio);
            WF.setSelection(selection);
            if(newParentItem.getChildren().length != 0 && !newParentItem.isExpanded())
              WF.expandItem(newParentItem);
          });

          WF.editItemName(selection[0]);
          setCursorAt(currentOffset);

          if(!WF.focusedItem())
            requestAnimationFrame(fixFocus);

          e.preventDefault()
          e.stopPropagation()
        }

      },
      Enter: e => 
      {
        // console.log("NormalMode: pressing enter");
        const focusedItem = WF.focusedItem();
        if(e.shiftKey && focusedItem)
        {
          goToInsertMode();
          return;
        }

        PrevEnterItem = WF.currentItem();
        if(focusedItem)
        {
          // console.log("transparent Enter (NORMAL) valid focus");
          e.preventDefault()
          e.stopPropagation()
          // WF.zoomIn(focusedItem);
          WF.zoomTo(focusedItem);
          WF.editItemName(focusedItem);
        }
        else
        {
          // WF.zoomIn(WF.currentItem());
          WF.zoomTo(WF.currentItem());
          WF.editItemName(WF.currentItem());
        }
      },
      Backspace: e => 
      {
        // console.log("backspacing?");
        e.preventDefault()
        e.stopPropagation()
        if(PrevEnterItem)
        {
          // console.log("trying to zoom in on prev item");
          // console.log(PrevEnterItem);

          // WF.zoomIn(PrevEnterItem);
          WF.zoomTo(PrevEnterItem);
        }
      },
      'dd': e => 
      {
        var CurrentSelection = WF.getSelection();
        if (CurrentSelection !== undefined && CurrentSelection.length != 0) 
        {
          WF.editGroup(() => 
          {
            CurrentSelection.forEach((item, i) => 
            {
              WF.deleteItem(item);
            });
          });
          WF.editItemName(WF.currentItem());
        }
        else
        {
          const focusedItem = WF.focusedItem();
          if(focusedItem.getPreviousVisibleSibling() === null)
          {
            const SelectedProject = e.target.parentNode.parentNode.parentNode.parentNode;
            WF.deleteItem(focusedItem);
            setCursorAfterVerticalMove(offsetCalculator(state), SelectedProject);
          }
          else
          {
            const PrevTarget = e.target.parentNode.parentNode.previousElementSibling.firstElementChild.lastElementChild;
            WF.deleteItem(focusedItem);
            setCursorAfterVerticalMove(offsetCalculator(state), moveCursorDown(PrevTarget));
          }
        }
        e.preventDefault()
        e.stopPropagation()
      },
      Escape: e => 
      {
        if(WF.focusedItem())
        {
            // console.log("transparent Escape (NORMAL)");
            const Selection = WF.getSelection();
            if (Selection !== undefined && Selection.length != 0)
              WF.setSelection([]);

            e.preventDefault()
            e.stopPropagation()
        }

        WF.hideMessage();
        WF.hideDialog();
        goToNormalMode();
      },
      // 'pp': e => 
      // {
      //   const focusedItem = WF.focusedItem();
      //   if(focusedItem)
      //   {
      //     WF.duplicateItem(WF.focusedItem());
      //     e.preventDefault()
      //     e.stopPropagation()
      //   }
      // },
      'g': e => 
      {
        const focusedItem = WF.focusedItem();
        if(!focusedItem)
          return;

        const focusedItemParent = focusedItem.getParent();
        if(!focusedItemParent)
          return;

        const currentOffset = state.get().anchorOffset

        const bIsParentHomeRoot = WF.rootItem().equals(focusedItem.getParent()); 
        if(bIsParentHomeRoot)
        {
          const visibleChildren = WF.currentItem().getVisibleChildren();
          if (visibleChildren !== undefined && visibleChildren.length != 0) 
          {
            WF.editItemName(visibleChildren[0]);
          }
          else
          {
            WF.editItemName(focusedItemParent);
          }
        }
        else
        {
          WF.editItemName(focusedItemParent);
        }

        event.preventDefault()
        event.stopPropagation()

        setCursorAt(currentOffset);
      },
      'G': e => 
      {
        const visibleChildren = WF.currentItem().getVisibleChildren();
        if (visibleChildren !== undefined && visibleChildren.length != 0) 
        {
          const currentOffset = state.get().anchorOffset

          WF.editItemName(visibleChildren[visibleChildren.length - 1]);
          event.preventDefault()
          event.stopPropagation()

          setCursorAt(currentOffset);
        }
      },
      'gg': e => 
      {
        const currentOffset = state.get().anchorOffset
        const bIsCurrentItemHomeRoot = WF.rootItem().equals(WF.currentItem()); 
        if(bIsCurrentItemHomeRoot)
        {
          const visibleChildren = WF.currentItem().getVisibleChildren();
          if (visibleChildren !== undefined && visibleChildren.length != 0) 
          {
            WF.editItemName(visibleChildren[0]);
          }
          else
          {
            WF.editItemName(WF.currentItem());
          }
        }
        else
        {
          WF.editItemName(WF.currentItem());
        }

        event.preventDefault();
        event.stopPropagation();

        setCursorAt(currentOffset);
      },
      'dw': e => 
      {
        focusedItem = WF.focusedItem();
        if(focusedItem)
        {
          const currentOffset = state.get().anchorOffset
          const itemName = focusedItem.getNameInPlainText();
          const substring_Start = itemName.substring(0, currentOffset);
          const substring_End = itemName.substring(currentOffset);
          const underCursorChar = itemName.charAt(currentOffset); 

          if(/[a-zåäöA-ZÅÄÖ0-9]/.test(underCursorChar))
          {
            const substringArray = substring_End.split(/([^a-zåäöA-ZÅÄÖ0-9])/).filter(Boolean);
            const modifiedEndString = substring_End.substring(substringArray[0].length).trim();
            const finalString = substring_Start.concat(modifiedEndString);
            WF.setItemName(focusedItem, finalString);
          }
          else
          {
            const substringArray = substring_End.split(/([a-zåäöA-ZÅÄÖ0-9])/).filter(Boolean);
            const modifiedEndString = substring_End.substring(substringArray[0].length).trim();
            const finalString = substring_Start.concat(modifiedEndString);
            WF.setItemName(focusedItem, finalString);
          }

          event.preventDefault()
          event.stopPropagation()
        }
      },
      'd$': e => 
      {
        focusedItem = WF.focusedItem();
        if(focusedItem)
        {
          const currentOffset = state.get().anchorOffset
          const itemName = focusedItem.getNameInPlainText();
          const substring_Start = itemName.substring(0, currentOffset);
          WF.setItemName(focusedItem, substring_Start);
          event.preventDefault()
          event.stopPropagation()
        }
      },
      'dr': e => 
      {
        focusedItem = WF.focusedItem();
        if(focusedItem)
        {
          const currentOffset = state.get().anchorOffset
          const itemName = focusedItem.getNameInPlainText();
          const substring_Start = itemName.substring(0, currentOffset);
          WF.setItemName(focusedItem, substring_Start);
          event.preventDefault()
          event.stopPropagation()
        }
      },
      'de': e => 
      {
        focusedItem = WF.focusedItem();
        if(focusedItem)
        {
          const currentOffset = state.get().anchorOffset
          const itemName = focusedItem.getNameInPlainText();
          const substring_Start = itemName.substring(0, currentOffset);
          const substring_End = itemName.substring(currentOffset);
          const underCursorChar = itemName.charAt(currentOffset); 

          if(/[a-zåäöA-ZÅÄÖ0-9]/.test(underCursorChar))
          {
            const substringArray = substring_End.split(/([^a-zåäöA-ZÅÄÖ0-9])/).filter(Boolean);
            const modifiedEndString = substring_End.substring(substringArray[0].length);
            const finalString = substring_Start.concat(modifiedEndString);
            WF.setItemName(focusedItem, finalString);
          }
          else
          {
            const substringArray = substring_End.split(/([a-zåäöA-ZÅÄÖ0-9])/).filter(Boolean);
            const modifiedEndString = substring_End.substring(substringArray[0].length);
            const finalString = substring_Start.concat(modifiedEndString);
            WF.setItemName(focusedItem, finalString);
          }

          event.preventDefault()
          event.stopPropagation()
        }
      }
    },
    [Mode.INSERT]: 
    {
      Escape: e =>
      {
        // prevent it from focusing on the search bar
        e.preventDefault()

        if(!WF.focusedItem())
        {
          if(focusPreJumpToItemMenu)
          {
            WF.editItemName(focusPreJumpToItemMenu);
            focusPreJumpToItemMenu = null;
          }

          if(!WF.focusedItem())
            WF.editItemName(WF.currentItem());
        }
        else
        {
          // console.log("stopping prop");
          e.stopPropagation()
        }

        goToNormalMode();
      },
      'jk': e => 
      {
        // guard against accidently pressing jk while in the menu 
        if(!WF.focusedItem())
          return;

        goToNormalMode();

        // remove j from under the cursor
        const currentOffset = state.get().anchorOffset
        WF.insertText("");
        setCursorAt(currentOffset);
        goToInsertMode();
        goToNormalMode();
        goToNormalMode();
        setCursorAt(currentOffset);

        // prevent k from being typed out.
        event.preventDefault();
      },
      'ctrl-k': e => 
      {
        // console.log("insert ctrl k");
        focusPreJumpToItemMenu = WF.focusedItem();
        goToNormalMode();
        goToInsertMode();
      },
      'ctrl-Dead': e => 
      {
        // console.log("insert ctrl dead");
        focusPreJumpToItemMenu = WF.focusedItem();
        goToNormalMode();
        goToInsertMode();
      },
      'Enter': e => 
      {
        // we are using the JumpToMenu to jump to the 
        // item which we are already standing on.
        // this means that "locationChanged" won't fire...
        // so we'll handle it here for now.. 
        if(!WF.focusedItem() && WF.currentItem())
        {

          if(focusPreJumpToItemMenu)
          {
            WF.editItemName(focusPreJumpToItemMenu);
            focusPreJumpToItemMenu = null;
          }

          if(!WF.focusedItem())
            WF.editItemName(WF.currentItem());

          goToNormalMode();
          event.preventDefault();

          requestAnimationFrame(fixFocus);

          // console.log("exiting the bullet menu");
        }

        // console.log("(insert) Enter: focused item: " + WF.focusedItem().getNameInPlainText());
        // console.log("(insert) Enter: current item: " + WF.currentItem().getNameInPlainText());

      }
    }
  }

  let bKeyDownHasFired = false;
  let bShowTimeCounter = false;
  let keyBuffer = [];
  let yankBuffer = [];
  const validSearchKeys = '1234567890[{]};:\'",<.>/?\\+=_-)(*&^%$#@~`!abcdefghijklmnopqrstuvwxyzäåöABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ ';
  const key_Slash = "/"//55;
  const key_Esc = "Escape"//27;
  const modifierKeyCodesToIgnore = [17, 16, 18];   // shift, ctrl, alt
  // let forceFocusItem = null;
  // let forceFocusItemID = null; 
  let focusPreJumpToItemMenu = null;

  WFEventListener = event => 
  {
    // console.clear();
    // console.log(state.get().mode);
    // console.log(event);
    // console.log(WF.focusedItem() ? WF.focusedItem().getNameInPlainText() : "no focus on item");

    // fix for not landing in NormalMode when using the JumpToItemMenu
    if (event === 'locationChanged' 
      && state.get().mode === Mode.INSERT
      && !WF.focusedItem()
    ) 
    {
      // console.log("going into normal mode post using JumpToItemMenu");
      requestAnimationFrame(fixFocus);
      goToNormalMode();
      focusPreJumpToItemMenu = null;
      event.preventDefault()
      event.stopPropagation()
    }

  };

  mainContainer.addEventListener('mousedown', event => 
  { 
    mouseClickIntoInsertMode();
  });

  mainContainer.addEventListener('keyup', event => 
  { 

    // workaround for keydown not always firing
    // if(!bKeyDownHasFired)
    // {
    //   console.log("keydown was not fired, trigging workaround");
    //   HandleKeydown(event);
    //   event.preventDefault()
    //   event.stopPropagation()
    // }
    // bKeyDownHasFired = false;

    // clear the hacky timer, used in ctrl-h/l, whenever we pressing something
    // if(forceFocusItem != null && !modifierKeyCodesToIgnore.includes(event.keyCode))
    // {
    //   console.log("clearing forceFocus");
    //   clearInterval(forceFocusItemID);
    //   forceFocusItem = null;
    //   forceFocusItemID = null 
    // }

    reselectItemsBeingMoved();
    updateKeyBuffer_Keyup(event);

  });

  mainContainer.addEventListener('keydown', event => 
  { 
    // temp workaround for "keyUp" and "keyDown" not always firing in sequence 
    // bKeyDownHasFired = true;

      if(updateKeyBuffer_Keydown(event))
      {
        event.preventDefault()
        event.stopPropagation()
        // console.log("-- KeybufferDownKey early out -- ")
        return;
      }

      if (keyBuffer.length > 1 
        && transparentActionMap[state.get().mode][keyBuffer[keyBuffer.length-2]+keyBuffer[keyBuffer.length-1]]) 
      {
        // handle sequence bindings
        transparentActionMap[state.get().mode][keyBuffer[keyBuffer.length-2]+keyBuffer[keyBuffer.length-1]](event);

        // @TODO: check if we have triple and quad 
        // sequences in the if statement instead
        keyBuffer.pop();
        keyBuffer.pop();
        // console.log("-- Sequence Map -- ")
      }
      else if (actionMap[state.get().mode][keyFrom(event)]) 
      {
        // handle simple bindings that always block propagation
        // console.log("-- Action Map -- ")
        actionMap[state.get().mode][keyFrom(event)](event.target)
        event.preventDefault()
        event.stopPropagation()
        // return false;
      }
      else if (transparentActionMap[state.get().mode][keyFrom(event)]) 
      {
        // handle bindings that sometimes block propagation
        transparentActionMap[state.get().mode][keyFrom(event)](event)
        // console.log("-- Transparent Map -- ")
      }
      else
      {
        preventDefaultWhileInNormalMode(event);
        // console.log("-- Preventing defaults -- ")
      }

      // console.log(WF.currentItem().getNameInPlainText());
      // console.log(WF.focusedItem().getNameInPlainText());

      if(bShowTimeCounter)
          updateTimeTagCounter();

      // return false;

  })

}) 
