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
        setCursorAt(a => a)
      else
        // update cursor pos based on where we ended up after INSERT mode
        setCursorAt(document.getSelection().getRangeAt(0).startOffset-1);

      setState(s => ({mode: Mode.NORMAL}))
      setMode(Mode.NORMAL)
    }
  }
}

const sequence = (twoKeys, handler, timeout = 800) => (keymap) => {
  const [first, second] = twoKeys.split(' ');
  let sequenceTimeout

  const sequenceHandler = function () {
    const original = keymap[second]

    keymap[second] = function (t) {
      clearTimeout(sequenceTimeout)
      handler(t)
      keymap[second] = original
    }

    sequenceTimeout = setTimeout(() => {
      keymap[first] = sequenceHandler
    }, timeout)
  }

  keymap[first] = sequenceHandler
}

  $(() => {
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
  const mainContainer = document.getElementById('app')

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
      '/': t => { WF.search("test"); },
      //'/': searchCommand,
      //'?': searchCommand,
      o: t => {
        const focusedItem = WF.focusedItem();
        const Parent = focusedItem.getParent();
        const CurrentItemIndex = focusedItem.getPriority();
        const NextItemIndex = CurrentItemIndex + 1; 
        WF.createItem(Parent, NextItemIndex);
        // WF.insertText(" ");
        goToInsertMode(false);
      },
      O: t => {
        const focusedItem = WF.focusedItem();
        const Parent = focusedItem.getParent();
        const CurrentItemIndex = focusedItem.getPriority();
        WF.createItem(Parent, CurrentItemIndex);
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
        const currentOffset = state.get().anchorOffset
        WF.insertText("");
        setCursorAt(currentOffset);
        goToInsertMode();
        goToNormalMode();
        goToNormalMode();
        setCursorAt(currentOffset);
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
        // console.log("shift J");

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
            WF.moveItems([nextItem], parentItem, focusedItem.getPriority() + 1);
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
        const currentRootItem = WF.currentItem();
        const Children = currentRootItem.getChildren();
        if (Children !== undefined && Children.length != 0)
        {

          // fix focus loss problem when collapsing
          if(WF.focusedItem().getParent().equals(WF.currentItem()) == false)
          {
            if(WF.focusedItem().getParent().getParent().equals(WF.currentItem()))
              WF.editItemName(WF.focusedItem().getParent());
            else
              WF.editItemName(WF.currentItem());
          }

          bExpandAll = !bExpandAll;
          WF.editGroup(() => 
          {
            Children.forEach((item, i) => 
            {
              if(bExpandAll)
                WF.collapseItem(item);
              else
                WF.expandItem(item);
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
          console.log("transparent Enter (NORMAL) Invalid focus");
        }
      },
      Backspace: e => 
      {
        console.log("backspacing?");
        e.preventDefault()
        e.stopPropagation()
        if(PrevEnterItem)
        {
          // console.log("trying to zoom in on prev item");
          // console.log(PrevEnterItem);
          WF.zoomIn(PrevEnterItem);
        }
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
        // else
        // {
        //     console.log("transparent Escape (NORMAL) failed");
        // }
        goToNormalMode();
      }
      // Esc: () => console.log('MAC WTF') || goToNormalMode(), // mac?
      // 'ctrl-Dead': goToInsertMode,
      // 'ctrl-¨': goToInsertMode
    },
    [Mode.INSERT]: 
    {
      Escape: e =>
      {
        if(WF.focusedItem())
        {
          // console.log("transparent Escape (INSERT)");
          e.preventDefault()
          e.stopPropagation()
          WF.zoomIn(WF.currentItem());
          goToNormalMode();
        }
        // else
        // {
        //   console.log("transparent Escape (INSERT) failed");
        // }
      },
      Enter: () => 
      {
        const focusedItem = WF.focusedItem();
        if(focusedItem == null)
        {
          // console.log("ggoing to normal mode");
          WF.zoomIn(WF.currentItem());
          WF.editItemName(WF.currentItem());
          goToNormalMode();
        }
      }
    }
  }

  sequence('d d', (target) => 
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
        const SelectedProject = target.parentNode.parentNode.parentNode.parentNode;
        WF.deleteItem(focusedItem);
        setCursorAfterVerticalMove(offsetCalculator(state), SelectedProject);
      }
      else
      {
        const PrevTarget = target.parentNode.parentNode.previousElementSibling.firstElementChild.lastElementChild;
        WF.deleteItem(focusedItem);
        setCursorAfterVerticalMove(offsetCalculator(state), moveCursorDown(PrevTarget));
      }
    }
  })(actionMap[Mode.NORMAL]);

  sequence('p p', (target) => 
  {
    WF.duplicateItem(WF.focusedItem());
  })(actionMap[Mode.NORMAL]);

  // sequence('d w', (target) => 
  // {
  //   // fuck it, i don't care, lets hack this.
  //   const focusedItem = WF.focusedItem();
  //   const focusedElement = focusedItem.getElement();
  //   console.log(focusedElement);

  //   const currentOffset = state.get().anchorOffset
  //   console.log(currentOffset);
  //   // const effective = bound(offset(currentOffset))
  //   // console.log(effective);

  //   // WF.insertText("€");
  //   // const NameStr = focusedItem.getNameInPlainText();
  //   // if(NameStr.includes("€"))
  //   // {
  //   // }
  //   // else
  //   // {
  //   //   const NoteStr = focusedItem.getNoteInPlainText();
  //   // }
  //   // console.log(WF.focusedItem);

  // })(actionMap[Mode.NORMAL]);


  let PrevKey = "";

  // Bulk moving items deselects them...
  // Reselecting them during the same event "frame"
  // does not work - which is why we do it on the keyup event for now.
  mainContainer.addEventListener('keyup', event => 
  { 
    if (SelectionPreMove !== undefined && SelectionPreMove.length != 0) 
    {
      WF.setSelection(SelectionPreMove);
      SelectionPreMove = [];
    }
  });

  mainContainer.addEventListener('keydown', event => 
  { 

    // if(state.get().mode === Mode.INSERT)
    // {
    //   let selection = document.getSelection();
    //   const idx = selection.getRangeAt(0);
    //   console.log(idx.startOffset);
    // }
    // const currentOffset = state.get().anchorOffset
    // console.log(currentOffset);

    debug(state.get().mode, keyFrom(event), event)

    if (actionMap[state.get().mode][keyFrom(event)]) 
    {
      event.preventDefault()
      event.stopPropagation()
      actionMap[state.get().mode][keyFrom(event)](event.target)

      return
    }

    if (transparentActionMap[state.get().mode][keyFrom(event)]) 
    {
      transparentActionMap[state.get().mode][keyFrom(event)](event)
      return
    }

    // Handle jk == esc. @TODO: make into buffer
    // and merge inte with the search functionality
    // or write a new sequence handler for insert mode. 
    if(PrevKey == 74 && event.keyCode == 75 && state.get().mode === Mode.INSERT)
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
    }
    PrevKey = event.keyCode;

    const input = '1234567890[{]};:\'",<.>/?\\+=_-)(*&^%$#@~`!abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ'.includes(event.key)
    const modified = !(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)
    if (state.get().mode === Mode.NORMAL && (input || modified)) {
      event.preventDefault()

      debug('prevented because NORMAL mode')
    }
  })
}) 
