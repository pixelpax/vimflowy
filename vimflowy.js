const keyFrom = event => `${event.altKey ? 'alt-': ''}${event.ctrlKey ? 'ctrl-' : ''}${event.key && event.key}`

const Mode = {
  NORMAL: 'NORMAL',
  INSERT: 'INSERT',
  VISUAL: 'VISUAL'
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
      if(state.get().mode === Mode.INSERT)
        setCursorAt(document.getSelection().getRangeAt(0).startOffset-1);
      else
        setCursorAt(document.getSelection().getRangeAt(0).startOffset);

      setState(s => ({mode: Mode.NORMAL}))
      setMode(Mode.NORMAL)
    },
    goToVisualMode: () => 
    {
      if(state.get().mode === Mode.VISUAL)
        setCursorAt(a => a)
      else
        setCursorAt(document.getSelection().getRangeAt(0).startOffset);

      setState(s => ({mode: Mode.VISUAL}))
      setMode(Mode.VISUAL)
    }
  }
}

  $(() => 
  {

    function getChildOfCurrentItem(itemToQuery)
    {
      const currentItem = WF.currentItem();

      if(currentItem.equals(itemToQuery.getParent()))
        return itemToQuery;

      const ancestors = itemToQuery.getAncestors();
      var i = ancestors.length; 
      while(i--)
      {
        if(ancestors[i].getParent() && ancestors[i].getParent().equals(currentItem))
          return ancestors[i];
      }
      return null;
    }

    function toggleExpandAll(t)
    {
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
    }

    function enterVisualMode(t)
    {
        // if(InitialSelectionItem != null)
        // {
        //   InitialSelectionItem = null;
        //   return;
        // }

        var focusedItem = WF.focusedItem();
        const currentItem = WF.currentItem();

        const bFocusIsCurrent = focusedItem.equals(currentItem);
        if(bFocusIsCurrent)
        {
          const visibleKids = focusedItem.getVisibleChildren(); 
          if(visibleKids.length == 0)
            return;

          WF.editItemName(visibleKids[0]);
          focusedItem = WF.focusedItem();
        }

        var currentSelection = WF.getSelection();
        if(!containsItem(currentSelection, focusedItem))
          currentSelection.push(focusedItem);

        InitialSelectionItem = focusedItem;
        VisualSelectionBuffer = currentSelection;
        WF.setSelection(currentSelection);

        goToVisualMode();
    }

    function MoveItemDown(t)
    {
        const focusedItem = WF.focusedItem();
        const nextItem = focusedItem.getNextVisibleSibling();
        if(nextItem == null)
          return;

        const parentItem = nextItem.getParent();
        WF.moveItems([nextItem], parentItem, focusedItem.getPriority());
    }

    function MoveItemUp(t)
    {
        const focusedItem = WF.focusedItem();
        const prevItem = focusedItem.getPreviousVisibleSibling();
        if(prevItem == null)
          return;

        const parentItem = prevItem.getParent();

        WF.moveItems([focusedItem], parentItem, prevItem.getPriority());
    }

    function MoveSelectionDown(t)
    {
      var selection = WF.getSelection();
      if (selection === undefined || selection.length == 0) 
        selection = SelectionPreMove;

      if (selection !== undefined && selection.length != 0)
      {
        SelectionPreMove = selection;

        const nextItem = selection[selection.length-1].getNextVisibleSibling();
        if(nextItem == null)
          return;

        const parentItem = nextItem.getParent();

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
    }

    function MoveSelectionUp(t)
    {
      var selection = WF.getSelection();
      if (selection === undefined || selection.length == 0) 
        selection = SelectionPreMove;

      if (selection !== undefined && selection.length != 0)
      {
        SelectionPreMove = selection;

        const prevItem = selection[0].getPreviousVisibleSibling();
        if(prevItem == null)
          return;

        const parentItem = prevItem.getParent();

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
    }

    function yankSelectedItems(t)
    {
      if(WF.focusedItem())
        yankBuffer = [WF.focusedItem()];
    }

    function ExitVisualMode(t)
    {
      InitialSelectionItem = null;
      VisualSelectionBuffer = [];
      WF.setSelection([]);
      goToNormalMode();
    }

    function indentSelection(e)
    {
      var selection = WF.getSelection();
      if (selection === undefined || selection.length == 0) 
        selection = SelectionPreMove;

      if (selection === undefined || selection.length == 0)
        return;

      var prio = 0;
      var newParentItem = null;
      newParentItem = selection[0].getPreviousVisibleSibling();
      if(newParentItem)
      {
        const kids = newParentItem.getChildren(); 
        if(kids.length != 0)
          prio = kids[kids.length-1].getPriority()+1;
      }

      if(newParentItem == null || newParentItem === undefined)
        return;

      SelectionPreMove = selection;

      const currentOffset = state.get().anchorOffset
      WF.editItemName(newParentItem);

      WF.editGroup(() => 
      {
        WF.moveItems(selection, newParentItem, prio);
        VisualSelectionBuffer = selection;
        WF.setSelection(selection);
        if(newParentItem.getChildren().length != 0 && !newParentItem.isExpanded())
          WF.expandItem(newParentItem);
      });

      WF.editItemName(selection[0]);
      setCursorAt(currentOffset);

      if(!WF.focusedItem())
        requestAnimationFrame(fixFocus);

      e.preventDefault();
      e.stopPropagation();
    }

    function outdentSelection(e)
    {
      var selection = WF.getSelection();
      if (selection === undefined || selection.length == 0) 
        selection = SelectionPreMove;

      if (selection === undefined || selection.length == 0)
        return;

      var prio = 0;
      var newParentItem = null;
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

      if(newParentItem == null || newParentItem === undefined)
        return;

      SelectionPreMove = selection;

      const currentOffset = state.get().anchorOffset
      WF.editItemName(newParentItem);

      WF.editGroup(() => 
      {
        WF.moveItems(selection, newParentItem, prio);
        VisualSelectionBuffer = selection;
        WF.setSelection(selection);
        if(newParentItem.getChildren().length != 0 && !newParentItem.isExpanded())
          WF.expandItem(newParentItem);
      });

      WF.editItemName(selection[0]);
      setCursorAt(currentOffset);

      if(!WF.focusedItem())
        requestAnimationFrame(fixFocus);

      e.preventDefault();
      e.stopPropagation();
    }

    function deleteSelectedItems(e)
    {
      const focusedItem = WF.focusedItem();
      const bWasPreviousVisibleSiblingInvalid = focusedItem.getPreviousVisibleSibling() === null;

      var CurrentSelection = WF.getSelection();
      if (CurrentSelection !== undefined && CurrentSelection.length != 0) 
      {
        // WF.editGroup(() => 
        // {
        //   if(bWasPreviousVisibleSiblingInvalid)
        //   {
        //     const selectedProject = e.target.parentNode.parentNode.parentNode.parentNode;
        //     CurrentSelection.forEach((item, i) => { WF.deleteItem(item); });
        //     setCursorAfterVerticalMove(offsetCalculator(state), selectedProject);
        //   }
        //   else
        //   {
        //     const prevTarget = e.target.parentNode.parentNode.previousElementSibling.firstElementChild.lastElementChild;
        //     CurrentSelection.forEach((item, i) => { WF.deleteItem(item); });
        //     setCursorAfterVerticalMove(offsetCalculator(state), moveCursorDown(prevTarget));
        //   }
        // });

        minNumAncestors = GetMinNumAncestors(CurrentSelection);
        var filteredSelection = CurrentSelection.filter(function(item, index, arr)
        {
          return item.getAncestors().length <= minNumAncestors; 
        });

        var topMostItem = null;
        var minIndex= Number.MAX_SAFE_INTEGER;
        for (var i = 0, len = filteredSelection.length; i < len; i++) 
        {
          const prio = filteredSelection[i].getPriority();  
          if(prio < minIndex)
          {
            topMostItem = filteredSelection[i];
            minIndex = prio;
          }
        }

        if(topMostItem && topMostItem.getPriority() != 0 && topMostItem.getPreviousVisibleSibling())
          WF.editItemName(topMostItem.getPreviousVisibleSibling());
        else
          WF.editItemName(WF.currentItem());

        CurrentSelection.forEach((item, i) => { WF.deleteItem(item); });
      }
      else
      {
        if(bWasPreviousVisibleSiblingInvalid)
        {
          const selectedProject = e.target.parentNode.parentNode.parentNode.parentNode;
          WF.deleteItem(focusedItem);
          setCursorAfterVerticalMove(offsetCalculator(state), selectedProject);
        }
        else
        {
          const prevTarget = e.target.parentNode.parentNode.previousElementSibling.firstElementChild.lastElementChild;
          WF.deleteItem(focusedItem);
          setCursorAfterVerticalMove(offsetCalculator(state), moveCursorDown(prevTarget));
        }
      }
    }

    function visualMode_AddItemToSelection_Above(t)
    {
      const focusedItem = WF.focusedItem();
      const currentItem = WF.currentItem();

      if(focusedItem.equals(currentItem))
        return;

      if(focusedItem.getPriority() == 0 && focusedItem.getParent().equals(currentItem))
        return;

      const previousVisibleSibling = focusedItem.getPreviousVisibleSibling();
      if(previousVisibleSibling && previousVisibleSibling.equals(currentItem))
        return;

      var currentSelection = VisualSelectionBuffer.length != 0 ? VisualSelectionBuffer : WF.getSelection();
      const itemAtStart = focusedItem;

      if(itemAtStart && !containsItem(currentSelection, itemAtStart))
        currentSelection.unshift(itemAtStart);

      setCursorAfterVerticalMove(offsetCalculator(state), moveCursorUp(t));

      const initialSelectionItemAncestors = InitialSelectionItem.getAncestors();

      // if (YoungerThenInitial || SameAgeButDifferentBranch || bDifferentTree)
      if(  (WF.focusedItem().getAncestors().length > InitialSelectionItem.getAncestors().length)
        || (WF.focusedItem().getAncestors().length == InitialSelectionItem.getAncestors().length) && (!WF.focusedItem().getParent().equals(InitialSelectionItem.getParent()))
        || (WF.focusedItem().getParent() != WF.currentItem()) && (!getChildOfCurrentItem(WF.focusedItem()).equals(getChildOfCurrentItem(InitialSelectionItem))))
      {
        const prevSibling = focusedItem.getPreviousVisibleSibling(); 
        const bSharesTheSameTreeAsNewFocus = containsItem(WF.focusedItem().getAncestors(), InitialSelectionItem);
        if(!prevSibling || (prevSibling.getAncestors().length < initialSelectionItemAncestors.length && bSharesTheSameTreeAsNewFocus))
        {
          WF.editItemName(InitialSelectionItem);
        }
        // else if(initialSelectionItemAncestors.length < WF.focusedItem().getAncestors().length)
        // {
        //   const prevSiblingKids = prevSibling.getVisibleChildren(); 
        //   WF.editItemName(prevSiblingKids[prevSiblingKids.length-1]);
        // }
        // else if(initialSelectionItemAncestors.length == WF.focusedItem().getAncestors().length)
        // {
        //   WF.editItemName(WF.focusedItem().getAncestors()[initialSelectionItemAncestors.length-1]);
        // }
        else
        {
          WF.editItemName(prevSibling);
        }
      }

      const itemAfterMove = WF.focusedItem();
      if(itemAfterMove && !itemAfterMove.equals(currentItem))
      {
        if(!containsItem(currentSelection, itemAfterMove))
          currentSelection.unshift(itemAfterMove);

        var minNumAncestors = GetMinNumAncestors(currentSelection);
        var initialSelectionItemIndex = InitialSelectionItem.getPriority();

        const itemAfterMoveAncestors = itemAfterMove.getAncestors()
        var indexOfItemAfterMove = itemAfterMove.getPriority();

        /////////////////////////////////////////////////////////////
        // prio check down the tree branches 
        var itemSelectionIndexCommonToItemAfterMove = initialSelectionItemIndex;
        if(initialSelectionItemAncestors.length > itemAfterMoveAncestors.length)
          var itemSelectionIndexCommonToItemAfterMove = initialSelectionItemAncestors[itemAfterMoveAncestors.length].getPriority();

        var filteredSelection = currentSelection.filter(function(item, index, arr)
        {
          const itemIndex = item.getPriority();
          const itemAncestors = item.getAncestors()
          if(itemAncestors.length == itemAfterMoveAncestors.length)
          {
            return itemIndex <= Math.max(itemSelectionIndexCommonToItemAfterMove, indexOfItemAfterMove); 
          }
          return true;
        });

        /////////////////////////////////////////////////////////////
        // remove parents that have non-selected kids 
        filteredSelection = filteredSelection.filter(function(item, index, arr)
        {
          const itemIndex = item.getPriority();
          const itemAncestors = item.getAncestors()
          if(itemAncestors.length == itemAfterMoveAncestors.length)
          {
            return itemIndex <= Math.max(itemSelectionIndexCommonToItemAfterMove, indexOfItemAfterMove); 
          }
          else if(itemAncestors.length > itemAfterMoveAncestors.length)
          {
            return true;
          }
          // else
          else if(itemAfterMove.equals(item))
          {
            var childrenRemaining = item.getVisibleChildren().length;
            if(childrenRemaining <= 1)
              return false;

            for (var i = 0, len = filteredSelection.length; i < len; i++) 
            {
              if(filteredSelection[i].getParent().equals(item))
              {
                --childrenRemaining;
              }
            }

            if(childrenRemaining == 0)
              return true;
            else
              return false;
          }
          return false;
        });

        /////////////////////////////////////////////////////////////
        // do prio check with common ancestors 
        if(initialSelectionItemAncestors.length > minNumAncestors)
            initialSelectionItemIndex = initialSelectionItemAncestors[minNumAncestors].getPriority();

        if(itemAfterMoveAncestors.length > minNumAncestors)
            indexOfItemAfterMove = itemAfterMoveAncestors[minNumAncestors].getPriority();

        filteredSelection = filteredSelection.filter(function(item, index, arr)
        {
          var indexToCompare = item.getPriority();
          const itemAncestors = item.getAncestors()
          if(itemAncestors.length > minNumAncestors)
            indexToCompare = itemAncestors[minNumAncestors].getPriority();

          return indexToCompare <= Math.max(initialSelectionItemIndex, indexOfItemAfterMove); 
        });

        /////////////////////////////////////////////////////////////
        // add parents for orphaned children
        minNumAncestors = GetMinNumAncestors(filteredSelection);
        for (var i = 0, len = filteredSelection.length; i < len; i++) 
        {
          const ancestors = filteredSelection[i].getAncestors();
          if(ancestors.length > minNumAncestors)
          {
            const desiredAncestor = ancestors[minNumAncestors]; 
            if(!containsItem(filteredSelection, desiredAncestor))
            {
              filteredSelection.unshift(desiredAncestor);
            }
          }
        }

        currentSelection = filteredSelection;
      }

      VisualSelectionBuffer = currentSelection;
      WF.setSelection(currentSelection);
    }

    function visualMode_AddItemToSelection_Below(t)
    {

      const focusedItem = WF.focusedItem();

      if(focusedItem.getParent().equals(WF.currentItem()) && !focusedItem.getNextVisibleSibling())
        return;

      // console.clear();
      // console.log("////////////////////////////");
      // console.log("going down");

      const itemAtStart = focusedItem; 

      var currentSelection = VisualSelectionBuffer.length != 0 ? VisualSelectionBuffer : WF.getSelection();

      if(itemAtStart && !containsItem(currentSelection, itemAtStart))
        currentSelection.push(itemAtStart);

      setCursorAfterVerticalMove(offsetCalculator(state), moveCursorDown(t));

      // if (YoungerThenInitial || SameAgeButDifferentBranch || bDifferentTree)
      if(  (WF.focusedItem().getAncestors().length > InitialSelectionItem.getAncestors().length)
        || (WF.focusedItem().getAncestors().length == InitialSelectionItem.getAncestors().length) && (!WF.focusedItem().getParent().equals(InitialSelectionItem.getParent()))
        || (WF.focusedItem().getParent() != WF.currentItem()) && (!getChildOfCurrentItem(WF.focusedItem()).equals(getChildOfCurrentItem(InitialSelectionItem))))
      {
        const nextSibling = focusedItem.getNextVisibleSibling(); 
        if(nextSibling)
        {
          WF.editItemName(nextSibling);
        }
        else
        {
          const ancestors = focusedItem.getAncestors();
          var i = ancestors.length; 
          while(i--)
          {
            if(ancestors[i].getNextVisibleSibling())
            {
              WF.editItemName(ancestors[i].getNextVisibleSibling());
              break;
            }
          }

          // we've reached end of the visible list
          if(i <= 0)
          {
            // console.log("reached end of list");
            return;
          }
        }
      }

      const itemAfterMove = WF.focusedItem();
      if(itemAfterMove)
      {
        if(!containsItem(currentSelection, itemAfterMove))
        {
          currentSelection.push(itemAfterMove);
        }

        // console.log("moved to: " + itemAfterMove.getNameInPlainText());
        // console.log("currentSelection after moving: ");
        // currentSelection.forEach((item, i) => 
        // {
        //   // console.log("index: " + i);
        //   console.log("item: " + item.getNameInPlainText());
        // });

        var minNumAncestors = GetMinNumAncestors(currentSelection);
        var initialSelectionItemIndex = InitialSelectionItem.getPriority();
        const initialSelectionItemAncestors = InitialSelectionItem.getAncestors()
        const itemAfterMoveAncestors = itemAfterMove.getAncestors()
        var indexOfItemAfterMove = itemAfterMove.getPriority();

        /////////////////////////////////////////////////////////////
        // prio check down the tree branches and
        var itemSelectionIndexCommonToItemAfterMove = initialSelectionItemIndex;
        if(initialSelectionItemAncestors.length > itemAfterMoveAncestors.length)
          var itemSelectionIndexCommonToItemAfterMove = initialSelectionItemAncestors[itemAfterMoveAncestors.length].getPriority();

        var filteredSelection = currentSelection.filter(function(item, index, arr)
        {
          const itemIndex = item.getPriority();
          const itemAncestors = item.getAncestors()
          if(itemAncestors.length == itemAfterMoveAncestors.length && item.getParent().equals(itemAfterMove.getParent()))
          {
            return itemIndex >= Math.min(itemSelectionIndexCommonToItemAfterMove, indexOfItemAfterMove); 
          }
          return true;
        });

        // console.log("currentSelection after 1st prio filter");
        // filteredSelection.forEach((item, i) => 
        // {
        //   console.log("item: " + item.getNameInPlainText());
        // });

        /////////////////////////////////////////////////////////////
        // remove parents that have kids which aren't selected
        filteredSelection = filteredSelection.filter(function(item, index, arr)
        {
          const itemIndex = item.getPriority();
          const itemAncestors = item.getAncestors()
          if(itemAncestors.length == itemAfterMoveAncestors.length)
          {
            return itemIndex >= Math.min(itemSelectionIndexCommonToItemAfterMove, indexOfItemAfterMove); 
          }
          else if(itemAncestors.length > itemAfterMoveAncestors.length)
          {
            return true;
          }
          else if(itemAfterMove.equals(item))
          // else 
          {
            console.log("checking kids");
            var childrenRemaining = item.getVisibleChildren().length;
            if(childrenRemaining <= 1)
            {
              console.log("no multi kids, removing: " + item.getNameInPlainText())
              return false;
            }

            for (var i = 0, len = filteredSelection.length; i < len; i++) 
            {
              if(filteredSelection[i].getParent().equals(item))
              {
                --childrenRemaining;
              }
            }

            if(childrenRemaining == 0)
            {
              console.log("all kids included");
              return true;
            }
            else
            {
              console.log("all kids were not included, removing:  " + item.getNameInPlainText());
              return false;
            }
          }

          return false;
        });

        // console.log("currentSelection after 2nd prio filter");
        // filteredSelection.forEach((item, i) => 
        // {
        //   console.log("item: " + item.getNameInPlainText());
        // });

        /////////////////////////////////////////////////////////////
        // do prio check with common ancestors 
        if(initialSelectionItemAncestors.length > minNumAncestors)
            initialSelectionItemIndex = initialSelectionItemAncestors[minNumAncestors].getPriority();

        if(itemAfterMoveAncestors.length > minNumAncestors)
            indexOfItemAfterMove = itemAfterMoveAncestors[minNumAncestors].getPriority();

        filteredSelection = filteredSelection.filter(function(item, index, arr)
        {
          var indexToCompare = item.getPriority();
          const itemAncestors = item.getAncestors()
          if(itemAncestors.length > minNumAncestors)
            indexToCompare = itemAncestors[minNumAncestors].getPriority();

          return indexToCompare >= Math.min(initialSelectionItemIndex, indexOfItemAfterMove); 
        });

        // console.log("currentSelection after ancestor filter");
        // filteredSelection.forEach((item, i) => 
        // {
        //   console.log("item: " + item.getNameInPlainText());
        // });

        /////////////////////////////////////////////////////////////
        // add parents for orphaned children
        minNumAncestors = GetMinNumAncestors(filteredSelection);

        for (var i = 0, len = filteredSelection.length; i < len; i++) 
        {
          const ancestors = filteredSelection[i].getAncestors();
          if(ancestors.length > minNumAncestors)
          {
            const desiredAncestor = ancestors[minNumAncestors]; 
            if(!containsItem(filteredSelection, desiredAncestor))
            {
              filteredSelection.unshift(desiredAncestor);
              // WF.editItemName(desiredAncestor);
            }
          }
        }

        currentSelection = filteredSelection;
      }

      // console.log("currentSelection setSelection");
      // currentSelection.forEach((item, i) => 
      // {
      //   console.log("item: " + item.getNameInPlainText());
      // });

      VisualSelectionBuffer = currentSelection;
      WF.setSelection(currentSelection);
    }

    function containsItem(arr, item)
    {
      for (var i = 0, len = arr.length; i < len; i++) 
      {
        if(arr[i].equals(item))
          return true;
      }
      return false;
    }

    function GetMinNumAncestors(arr)
    {
      var minNumAncestors = Number.MAX_SAFE_INTEGER;
      for (var i = 0, len = arr.length; i < len; i++) 
      {
        const numAncestors = arr[i].getAncestors().length;
        if(numAncestors < minNumAncestors)
          minNumAncestors = numAncestors;
      }
      return minNumAncestors;
    }

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

    function preventKeystrokesWhileNavigating(event)
    {
      // console.log("trying to prevent: " + event.key);
      if (state.get().mode !== Mode.INSERT)
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
      if(state.get().mode !== Mode.INSERT)
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

  const {flashMode, goToInsertMode, goToNormalMode, goToVisualMode} = modeClosure(mainContainer, state.get, state.set);

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
        yankSelectedItems(t);
      },
      y: t => 
      {
        yankSelectedItems(t);
      },
      u: t => 
      {
        WF.undo(); 
      },
      'ctrl-r': t => 
      {
        WF.redo();
      },
      ' ': t => 
      {
        const focusedItem = WF.focusedItem();
        if(focusedItem.isExpanded())
          WF.collapseItem(focusedItem);
        else
          WF.expandItem(focusedItem);
      },
      'v': t =>
      {
        // const selection = WF.getSelection();
        // if(selection !== undefined && selection.length != 0)
        //   ExitVisualMode(t);
        // else
          enterVisualMode(t);
      },
      'V': t =>
      {
        // const selection = WF.getSelection();
        // if(selection !== undefined && selection.length != 0)
        //   ExitVisualMode(t);
        // else
          enterVisualMode(t);
      },
      'alt-J': t => 
      {
        MoveSelectionDown(t);
      },
      'alt-K': t => 
      {
        MoveSelectionUp(t);
      },
      'alt-j': t => 
      {
        const selection = WF.getSelection();
        if(selection !== undefined && selection.length != 0)
          MoveSelectionDown(t);
        else
          MoveItemDown(t);
      },
      'alt-k': t => 
      {
        const selection = WF.getSelection();
        if(selection !== undefined && selection.length != 0)
          MoveSelectionUp(t);
        else
          MoveItemUp(t);
      },
      'ctrl- ': t => 
      {
        toggleExpandAll(t);
      }
    },
    [Mode.VISUAL]: 
    {
      u: t => 
      {
        WF.undo(); 
      },
      'ctrl-r': t => 
      {
        WF.redo();
      },
      ' ': t => 
      {
        const focusedItem = WF.focusedItem();
        if(focusedItem.isExpanded())
          WF.collapseItem(focusedItem);
        else
          WF.expandItem(focusedItem);
      },
      'ctrl- ': t => 
      {
        toggleExpandAll(t);
      },
      'j': t =>
      {
        visualMode_AddItemToSelection_Below(t);
      },
      'k': t =>
      {
        visualMode_AddItemToSelection_Above(t);
      },
      'J': t =>
      {
        visualMode_AddItemToSelection_Below(t);
      },
      'K': t =>
      {
        visualMode_AddItemToSelection_Above(t);
      },
      'd': e =>
      {
        deleteSelectedItems(e);
        ExitVisualMode();
      },
      'V': t =>
      {
        ExitVisualMode(t);
        // enterVisualMode(t);
      },
      'v': t =>
      {
        ExitVisualMode(t);
        // enterVisualMode(t);
      },
      'Y': t =>
      {
        yankSelectedItems(t);
        ExitVisualMode(t);
      },
      'y': t =>
      {
        yankSelectedItems(t);
        ExitVisualMode(t);
      },
      'alt-J': t => 
      {
        MoveSelectionDown(t);
        ExitVisualMode(t);
      },
      'alt-K': t => 
      {
        MoveSelectionUp(t);
        ExitVisualMode(t);
      },
      'alt-j': t => 
      {
        MoveSelectionDown(t);
        ExitVisualMode(t);
      },
      'alt-k': t => 
      {
        MoveSelectionUp(t);
        ExitVisualMode(t);
      }
    },
    [Mode.INSERT]: 
    {
      // Escape: goToNormalMode,
      Esc: () => console.log('MAC?') || goToNormalMode() // mac?
    }
  }

  // _allows_ event propagation 
  const transparentActionMap = 
  {
    [Mode.NORMAL]: 
    {
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
        deleteSelectedItems(e);
        e.preventDefault()
        e.stopPropagation()
      },
      Escape: e => 
      {
        if(WF.focusedItem())
        {
            // console.log("transparent Escape (NORMAL)");
            const selection = WF.getSelection();
            if (selection !== undefined && selection.length != 0)
            {
              VisualSelectionBuffer = [];
              WF.setSelection([]);
            }

            e.preventDefault()
            e.stopPropagation()
        }

        WF.hideMessage();
        WF.hideDialog();
        goToNormalMode();
      },
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
      },
      '<': e => 
      {
        enterVisualMode();
        outdentSelection(e);
        ExitVisualMode();
        event.preventDefault()
        event.stopPropagation()
      },
      '>': e => 
      {
        enterVisualMode();
        indentSelection(e);
        ExitVisualMode();
        event.preventDefault()
        event.stopPropagation()
      },
      Tab: e => 
      {
        if(e.shiftKey)
          outdentSelection(e);
        else
          indentSelection(e);
      }
    },
    [Mode.VISUAL]: 
    {
      '<': e => 
      {
        outdentSelection(e);
        event.preventDefault()
        event.stopPropagation()
        ExitVisualMode();
      },
      '>': e => 
      {
        indentSelection(e);
        event.preventDefault()
        event.stopPropagation()
        ExitVisualMode();
      },
      Tab: e => 
      {
        if(e.shiftKey)
          outdentSelection(e);
        else
          indentSelection(e);
        ExitVisualMode();
      },
      'ctrl-k': e => 
      {
        ExitVisualMode();
        focusPreJumpToItemMenu = WF.focusedItem();
        goToInsertMode();
      },
      'ctrl-Dead': e => 
      {
        ExitVisualMode();
        focusPreJumpToItemMenu = WF.focusedItem();
        goToInsertMode();
      },
      Escape: e => 
      {
        if(WF.focusedItem())
        {
            const selection = WF.getSelection();
            if (selection !== undefined && selection.length != 0)
            {
              VisualSelectionBuffer = [];
              WF.setSelection([]);
            }

            e.preventDefault()
            e.stopPropagation()
        }

        InitialSelectionItem = null;

        WF.hideMessage();
        WF.hideDialog();
        goToNormalMode();
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

  let PrevEnterItem = null;
  let SelectionPreMove = [];

  // WF.setSelection() will remove any children 
  // that belong to items which have been added.
  // We need those children for MODE.VISUAL
  let VisualSelectionBuffer = [];

  let bExpandAll = true;

  let InitialSelectionItem = null;
  let focusPreJumpToItemMenu = null;
  let bKeyDownHasFired = false;
  let bShowTimeCounter = false;
  let keyBuffer = [];
  let yankBuffer = [];
  const validSearchKeys = '1234567890[{]};:\'",<.>/?\\+=_-)(*&^%$#@~`!abcdefghijklmnopqrstuvwxyzäåöABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ ';
  const key_Slash = "/"//55;
  const key_Esc = "Escape"//27;
  const modifierKeyCodesToIgnore = [17, 16, 18];   // shift, ctrl, alt

  WFEventListener = event => 
  {
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
    reselectItemsBeingMoved();
    updateKeyBuffer_Keyup(event);

  });

  mainContainer.addEventListener('keydown', event => 
  { 
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
        actionMap[state.get().mode][keyFrom(event)](event.target)
        event.preventDefault()
        event.stopPropagation()
        // console.log("-- Action Map -- ")
      }
      else if (transparentActionMap[state.get().mode][keyFrom(event)]) 
      {
        // handle bindings that sometimes block propagation
        transparentActionMap[state.get().mode][keyFrom(event)](event)
        // console.log("-- Transparent Map -- ")
      }
      else
      {
        preventKeystrokesWhileNavigating(event);
        // console.log("-- Preventing defaults -- ")
      }

      // console.log(WF.currentItem().getNameInPlainText());
      // console.log(WF.focusedItem().getNameInPlainText());

      if(bShowTimeCounter)
          updateTimeTagCounter();

  })

}) 
