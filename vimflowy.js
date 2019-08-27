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

    function preventDefaultWhileInNormalMode(event)
    {
      if (state.get().mode === Mode.NORMAL)
      {
        // const input = ValidNormalKeys.includes(event.key);
        const input = '1234567890[{]};:\'",<.>/?\\+=_-)(*&^%$#@~`!abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ'.includes(event.key);
        const modified = !(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)
        if (input || modified)
        {
          const exceptions = 
          [
            123   // F12
            , 46  // Delete
          ];

          // console.log("illegal key");
          // console.log(event.keyCode);

          if(!exceptions.includes(event.keyCode))
            event.preventDefault()

        }
      }
    }

    function mouseClickIntoInsertMode()
    {
      if(state.get().mode === Mode.NORMAL && (!document.getSelection() || document.getSelection().toString().length == 0))
      {
          goToInsertMode(true);
          goToNormalMode();
          goToInsertMode(true);
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
        else
        {
          keyBuffer = [...keyBuffer, key];
        }

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
          console.log("clearing buffer and search");
          WF.hideMessage();
          WF.search("");
          WF.clearSearch();
          WF.editItemName(WF.currentItem());
        }
        else if(searchQuery !== null && key == 'Enter')
        // else if(key == 'Enter')
        {
          console.log(searchQuery);
          WF.editItemName(WF.currentItem());
          WF.hideMessage();
          keyBuffer = [];
        }
        else
        {
          const filteredKeys = keyBuffer.filter(function(value, index, arr)
          {
            return validSearchKeys.includes(value);
          });

          console.log(filteredKeys);

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
      j: target => setCursorAfterVerticalMove(offsetCalculator(state), moveCursorDown(target)),
      k: target => setCursorAfterVerticalMove(offsetCalculator(state), moveCursorUp(target)),
      l: t => moveCursorRight(t, offsetCalculator(state)),
      i: onlyIfProjectCanBeEdited(() => goToInsertMode()),
      a: onlyIfProjectCanBeEdited(() => goToInsertMode(true)),
      // '/': t => { WF.search("test"); },
      //'/': searchCommand,
      //'?': searchCommand,
      e: t => {

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
      u: t => { WF.undo(); },
      y: t => { WF.redo(); }, 
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
        var CurrItem = WF.focusedItem();

        CurrentSelection.push(CurrItem);

        const CurrIndex = CurrItem.getPriority();
        const FirstElementIndex = CurrentSelection[0].getPriority();

        var CurrAndAboveSelection = CurrentSelection.filter(function(value, index, arr){
          const NextIndex = value.getPriority();
          return (NextIndex <= CurrIndex || NextIndex <= FirstElementIndex);
        });

        WF.setSelection(CurrAndAboveSelection);
      },
      'J': t =>
      {
        // limit it to the current scope for now
        if(WF.focusedItem().getNextVisibleSibling() == null)
          return;

        var CurrentSelection = WF.getSelection();
        setCursorAfterVerticalMove(offsetCalculator(state), moveCursorDown(t));
        var CurrItem = WF.focusedItem();

        CurrentSelection.push(CurrItem);

        const CurrIndex = CurrItem.getPriority();
        const FirstElementIndex = CurrentSelection[0].getPriority();
        
        var CurrAndBelowSelection = CurrentSelection.filter(function(value, index, arr){
          const i = value.getPriority();
          return (i >= CurrIndex || i >= FirstElementIndex);
        });

        WF.setSelection(CurrAndBelowSelection);
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
      Esc: () => console.log('MAC WTF') || goToNormalMode() // mac?
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
        const Children = currentRootItem.getChildren();
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
            const focusKids = focusedItem.getChildren();
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
      Enter: e => 
      {
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
          WF.zoomIn(focusedItem);
          WF.editItemName(focusedItem);
        }
        else
        {
          WF.zoomIn(WF.currentItem());
          WF.editItemName(WF.currentItem());
          // console.log("transparent Enter (NORMAL) Invalid focus");
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
          WF.zoomIn(PrevEnterItem);
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
        goToNormalMode();
      },
      'pp': e => 
      {
        const focusedItem = WF.focusedItem();
        if(focusedItem)
        {
          WF.duplicateItem(WF.focusedItem());
          e.preventDefault()
          e.stopPropagation()
        }
      },
      'dw': e => 
      {
        focusedItem = WF.focusedItem();
        if(focusedItem)
        {
          var split = focusedItem.getNameInPlainText().split(/[ ]+/).filter(Boolean);
          const currentOffset = state.get().anchorOffset
          let traverseLength = 0;
          for(let i = 0; i < split.length; ++i) 
          {
            traverseLength += split[i].length;
            traverseLength += 1;

            const wordEndOffset = traverseLength - 2;
            if(wordEndOffset >= currentOffset)
            {
              const targetOffset = wordEndOffset - split[i].length + 1;
              split.splice(i, 1);
              var newName = split.join(" ");
              WF.setItemName(focusedItem, newName);
              moveCursorTo(event.target, offsetCalculator(state), targetOffset);
              event.preventDefault()
              event.stopPropagation()
              break;
            }
          }
        }
      }
    },
    [Mode.INSERT]: 
    {
      Escape: e =>
      {
        if(WF.focusedItem())
        {
          e.preventDefault()
          e.stopPropagation()
          WF.zoomIn(WF.currentItem());
          goToNormalMode();
        }
      },
      'jk': e => 
      {
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
      Enter: () => 
      {
        const focusedItem = WF.focusedItem();
        if(focusedItem == null)
        {
          WF.zoomIn(WF.currentItem());
          WF.editItemName(WF.currentItem());
          goToNormalMode();
        }
      }
    }
  }

  let bShowTimeCounter = false;
  let keyBuffer = [];
  const validSearchKeys = '1234567890[{]};:\'",<.>/?\\+=_-)(*&^%$#@~`!abcdefghijklmnopqrstuvwxyzäåöABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ ';
  const key_Slash = "/"//55;
  const key_Esc = "Escape"//27;

  mainContainer.addEventListener('mouseup', event => 
  { 
    mouseClickIntoInsertMode();
  });

  mainContainer.addEventListener('keyup', event => 
  { 
    reselectItemsBeingMoved();
    updateKeyBuffer_Keyup(event);
  });

  mainContainer.addEventListener('keydown', event => 
  { 

    if(updateKeyBuffer_Keydown(event))
    {
      event.preventDefault()
      event.stopPropagation()
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
    }
    else if (actionMap[state.get().mode][keyFrom(event)]) 
    {
      // handle simple bindings that always block propagation
      event.preventDefault()
      event.stopPropagation()
      actionMap[state.get().mode][keyFrom(event)](event.target)
    }
    else if (transparentActionMap[state.get().mode][keyFrom(event)]) 
    {
      // handle bindings that sometimes block propagation
      transparentActionMap[state.get().mode][keyFrom(event)](event)
    }
    else
    {
      preventDefaultWhileInNormalMode(event);
    }

    if(bShowTimeCounter)
        updateTimeTagCounter();

  })

}) 
