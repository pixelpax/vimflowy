const keyFrom = event => `${event.altKey ? 'alt-': ''}${event.ctrlKey ? 'ctrl-' : ''}${event.key && event.key}`

function deleteUntilLineEnd()
{
  const focusedItem = WF.focusedItem();
  if(!focusedItem)
    return;

  const itemName = focusedItem.getName();
  const itemNameText = focusedItem.getNameInPlainText();
  var currentOffset = state.get().anchorOffset

  // Oh no, it has html tags, recalculate cursor offset
  if(itemNameText.length != itemName.length)
  {
    var addedOffset = 0;
    for (var i = 0; i < itemName.length; i++) 
    {
      const char_1 = itemNameText.charAt(i-addedOffset);
      const char_2 = itemName.charAt(i);
      if(char_1 != char_2)
        ++addedOffset;

      if(i-addedOffset == currentOffset)
        break;
    }

    currentOffset += addedOffset;
    // console.log("added offset: " + addedOffset);

    if(itemName.charAt(currentOffset) == "<")
    {
      --currentOffset;
      --addedOffset;
    }
  }

  const substring_Start = itemName.substring(0, currentOffset);
  const substring_End = itemName.substring(currentOffset);
  var finalString = substring_Start;

  // console.clear();
  // console.log("substring_Start: " + substring_Start);
  // console.log("substring_End: " + substring_End);

  var htmlTags = substring_End.match(/(<\/b>)|(<\/u>)|(<\/i>)|(<i>)|(<u>)|(<b>)/g);
  if(htmlTags != null)
  {
    var htmlEndTags = htmlTags.join("");

    // console.log("htmlTags pre replace: " + htmlEndTags);
    htmlEndTags = htmlEndTags.replace(/(<u><\/u>)/g, "");
    // console.log("htmlEndTags post replace u: " + htmlEndTags);
    htmlEndTags = htmlEndTags.replace(/(<i><\/i>)/g, "");
    // console.log("htmlEndTags post replace i: " + htmlEndTags);
    htmlEndTags = htmlEndTags.replace(/(<b><\/b>)/g, "");
    // console.log("htmlEndTags post replace b: " + htmlEndTags);

    finalString = substring_Start.concat(htmlEndTags);
    // console.log("finalString pre replace: " + finalString);

    finalString = finalString.replace(/(<u><\/u>)/g, "");
    // console.log("finalString post replace u: " + finalString);
    finalString = finalString.replace(/(<i><\/i>)/g, "");
    // console.log("finalString post replace i: " + finalString);
    finalString = finalString.replace(/(<b><\/b>)/g, "");
    // console.log("finalString post replace b: " + finalString);
  }

  // console.log("finalString: " + finalString);
  WF.setItemName(focusedItem, finalString);
  setCursorAt(state.get().anchorOffset);
}

function deleteWord(e, bToNextWord)
{
  const focusedItem = WF.focusedItem();
  if(!focusedItem)
    return;

  const itemName = focusedItem.getName();
  const itemNameText = focusedItem.getNameInPlainText();
  var currentOffset = state.get().anchorOffset

  // Oh no, it has html tags, recalculate cursor offset
  if(itemNameText.length != itemName.length)
  {
    var addedOffset = 0;
    for (var i = 0; i < itemName.length; i++) 
    {
      const char_1 = itemNameText.charAt(i-addedOffset);
      const char_2 = itemName.charAt(i);
      if(char_1 != char_2)
        ++addedOffset;

      if(i-addedOffset == currentOffset)
        break;
    }

    currentOffset += addedOffset;
    // console.log("added offset: " + addedOffset);

    if(itemName.charAt(currentOffset) == "<")
    {
      --currentOffset;
      --addedOffset;
    }
  }

  const substring_Start = itemName.substring(0, currentOffset);
  const substring_End = itemName.substring(currentOffset);
  const underCursorChar = itemName.charAt(currentOffset); 

  // console.clear();
  // console.log("itemNameText: " + itemNameText);
  // console.log("itemName: " + itemName);
  // console.log("under cursor char: " + underCursorChar);
  // console.log("substring_Start: " + substring_Start);
  // console.log("substring_End: " + substring_End);

  const bNormalCharUnderCursor = /[a-zåäöA-ZÅÄÖ0-9]/.test(underCursorChar);
  const regexStringToUse = bNormalCharUnderCursor ? /([^a-zåäöA-ZÅÄÖ0-9])/ : /([a-zåäöA-ZÅÄÖ0-9</>])/
  const subStrSplit_End = substring_End.split(regexStringToUse).filter(Boolean);

  var modifiedStrEnd = substring_End.substring(subStrSplit_End[0].length);
  if(bToNextWord)
    modifiedStrEnd = modifiedStrEnd.trim();

  var finalstring = substring_Start.concat(modifiedStrEnd);

  // console.log("bNormalCharUnderCursor" + bNormalCharUnderCursor);
  // console.log("regex being used: " + regexStringToUse);
  // console.log("subStrSplit_End: " + subStrSplit_End);
  // console.log("modifiedStrEnd: " + modifiedStrEnd);

  const bRemovedEntireWord = substring_Start.charAt(substring_Start.length-1) == ">";
  if(bRemovedEntireWord)
  {
    finalstring = finalstring.replace(/(<u><\/u>)/g, "");
    finalstring = finalstring.replace(/(<i><\/i>)/g, "");
    finalstring = finalstring.replace(/(<b><\/b>)/g, "");
  }

  // console.log("finalstring: " + finalstring);
  WF.setItemName(focusedItem, finalstring);

  event.preventDefault()
  event.stopPropagation()
}

function createItemFrom(itemToCopy, parent, prio)
{
  if(!parent)
    return;

  if(itemToCopy.equals(parent))
    return;

  var createdItem = WF.createItem(parent, prio);

  WF.setItemName(createdItem, itemToCopy.getName());
  WF.setItemNote(createdItem, itemToCopy.getNote());

  if(itemToCopy.isCompleted())
    WF.completeItem(createdItem);

  // !!! this needs to be done before we process the kids
  // there is a unhandled exception in WF otherwise 
  // when copying completed items
  if(itemToCopy.isExpanded())
    WF.expandItem(createdItem);
  else
    WF.collapseItem(createdItem);

  // @TODO: we could take all children by calling 
  // getChildren() but then we'd run into potential
  // problems down below when completing and expanding
  var kids = itemToCopy.getChildren();
  if (kids !== undefined && kids.length != 0) 
  {
    kids.forEach((item, i) =>  
    {
      createItemFrom(
        item,
        createdItem,
        item.getPriority()
      ); 
    });
  }

  return createdItem;
}

function pasteYankedItems(bAboveFocusedItem)
{
  if (yankBuffer === undefined || yankBuffer.length == 0) 
    return;

  if(yankBuffer[0] == null || yankBuffer[0] === undefined)
    return;

  const focusedItem = WF.focusedItem();
  var parentItem = focusedItem.getParent();

  if(parentItem == null)
    return;

  const currentItem = WF.currentItem();
  if(focusedItem.equals(currentItem))
    parentItem = currentItem;

  WF.editGroup(() => 
  {
    // all items will have same parent
    const yankParent = yankBuffer[0].getParent();
    const yankPrio = yankBuffer[0].getPriority();

    // check if we are dealing with dead items..
    // @TODO: we could just always create new items 
    // and not duplicate them... we'd lose some 
    // information but that is negligible?
    var bPastingDeadItems = true;
    const tempItem = WF.duplicateItem(yankBuffer[0]);
    if(tempItem)
    {
      WF.deleteItem(tempItem);
      bPastingDeadItems = false;
    }

    var createdItems = [];

    if(bPastingDeadItems)
    {
      for (var i = 0, len = yankBuffer.length; i < len; i++) 
      {
        var createdItem = createItemFrom(
          yankBuffer[i],
          parentItem,
          yankBuffer[i].getPriority() + 1,    // the +1 is for tricking workflowy
        );
        WF.setItemName(createdItem, createdItem.getName().concat(" #Copy"));
        createdItems.push(createdItem);
      }
    }
    else
    {
      // we can only duplicate items that are "visible",
      // (they have to share the same WF.currentItem()?)
      // so we'll move them here
      WF.moveItems(yankBuffer, parentItem, 0);

      for (var i = 0, len = yankBuffer.length; i < len; i++) 
      {
        var createdItem = WF.duplicateItem(yankBuffer[i]);
        createdItems.push(createdItem);
      }

      // move the items back once we've duplicated them
      const bCopyFromSameList = yankParent.equals(createdItems[0].getParent());
      const originPriority = bCopyFromSameList ? (yankPrio + (yankBuffer.length*2)) : yankPrio;
      WF.moveItems(yankBuffer, yankParent, originPriority);
    }

    if(createdItems[0] == null || createdItems[0] == undefined)
      return;

    // remove the copy tag...
    for (var i = 0, len = createdItems.length; i < len; i++) 
    {
      const createdItemName = createdItems[i].getName();
      const nameWithoutCopyTag = createdItemName.substring(0, createdItemName.length - 6);
      WF.setItemName(createdItems[i], nameWithoutCopyTag);
    }

    if(focusedItem.equals(WF.currentItem()))
      WF.moveItems(createdItems, focusedItem, 0);
    else if(bAboveFocusedItem)
      WF.moveItems(createdItems, parentItem, focusedItem.getPriority());
    else
      WF.moveItems(createdItems, parentItem, focusedItem.getPriority()+1);

    // focus on top most pasted item
    WF.editItemName(createdItems[0]);

  });
}

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

function toggleExpand(t)
{
  const focusedItem = WF.focusedItem();
  if(focusedItem == null)
    return;

  // expansion/collapse isn't supported by WF when searching
  if(WF.currentSearchQuery() !== null)
    return;

  const currentItem = WF.currentItem();

  if(focusedItem && focusedItem.equals(currentItem))
    return;

  if(focusedItem.isExpanded())
    WF.collapseItem(focusedItem);
  else
    WF.expandItem(focusedItem);
}

function toggleExpandAll(e)
{
  const currentItem = WF.currentItem();
  const focusedItem = WF.focusedItem();

  // Let the workflowy binding handle it. 
  // it uses expandOrCollapseAllDescendants() 
  // which we can't call upon atm
  if(focusedItem && focusedItem.equals(currentItem))
    return;

  e.preventDefault();
  e.stopPropagation();

  // expansion/collapse isn't supported by WF when searching
  if(WF.currentSearchQuery() !== null)
    return;

  const children = currentItem.getVisibleChildren();
  if (children === undefined || children.length == 0)
    return;

  var numExpanded = 0;
  var numCollapsed = 0;
  children.forEach((item, i) => 
	{
		if(item.isExpanded())
			++numExpanded;
		else
			++numCollapsed;
	});

	var bExpandAll = false;
	if(numExpanded == 0)
		bExpandAll = true;
	else if(numCollapsed == 0)
		bExpandAll = false;
	else
	{    
		bExpandAll = numExpanded > numCollapsed;
	}

  const currentItemChildAncestor = getChildOfCurrentItem(focusedItem);
  WF.editItemName(currentItemChildAncestor);

  WF.editGroup(() => 
  {
    children.forEach((item, i) => 
    {
      if(bExpandAll)
        WF.expandItem(item);
      else
        WF.collapseItem(item);
    });
  });

  // fix focus loss problem when collapsing
  if(!WF.focusedItem())
  {
    requestAnimationFrame(fixFocus);
    WF.editItemName(currentItem);
  }

	setCursorAt(state.get().anchorOffset);

}

function enterVisualMode(t)
{
    var focusedItem = WF.focusedItem();

    if(focusedItem == null)
      return;

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

    const nextNextItem = nextItem.getNextVisibleSibling();
    if(nextNextItem != null)
    {
      WF.editItemName(nextNextItem);
      if(focusedItem.equals(WF.focusedItem()) && nextItem.isExpanded() && WF.currentSearchQuery() === null)
          WF.collapseItem(nextItem);
      WF.editItemName(focusedItem);
    }

    // console.log("nextItem: " + nextItem.getNameInPlainText());

    const parentItem = nextItem.getParent();
    WF.moveItems([nextItem], parentItem, focusedItem.getPriority());
    setCursorAt(state.get().anchorOffset);
}

function MoveItemUp(t)
{
    const focusedItem = WF.focusedItem();
    const prevItem = focusedItem.getPreviousVisibleSibling();
    if(prevItem == null)
      return;

    const parentItem = prevItem.getParent();

    WF.moveItems([focusedItem], parentItem, prevItem.getPriority());
    setCursorAt(state.get().anchorOffset);
}

function toggleCompletedOnSelection(e)
{
  var selection = WF.getSelection();
  if (selection === undefined || selection.length == 0) 
    return;

  e.preventDefault()
  e.stopPropagation()

  var numCompleted = 0;
  var numUncompleted = 0;
  selection.forEach((item, i) => 
	{
		if(item.isCompleted())
			++numCompleted;
		else
			++numUncompleted;
  });
  
	var bCompleteAll = false;
	if(numCompleted == 0)
		bCompleteAll  = true;
	else if(numUncompleted == 0)
		bCompleteAll = false;
	else
	{    
		bCompleteAll = numCompleted > numUncompleted;
	}

  WF.editGroup(() => 
  {
    selection.forEach((item, i) => 
    {
      if(item.isCompleted() != bCompleteAll)
        WF.completeItem(item)
    });
  });

}

function RotateSelectionPreMoveBuffer()
{
		var selection = WF.getSelection();
		if (selection === undefined || selection.length == 0) 
			selection = SelectionPreMove;

		if (selection !== undefined && selection.length != 0)
			SelectionPreMove = selection;
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

    // collapse the Item inbetween us and the destination
    // if we can't "see" far enough to remain in focus
    const nextNextItem = nextItem.getNextVisibleSibling();
    if(nextNextItem != null)
    {
      const focusedItem = WF.focusedItem();
      WF.editItemName(nextNextItem);
      if(focusedItem.equals(WF.focusedItem()) && nextItem.isExpanded() && WF.currentSearchQuery() === null)
          WF.collapseItem(nextItem);
      WF.editItemName(focusedItem);
    }

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

      // collapse the Item inbetween us and the destination
      // if we can't "see" far enough to remain in focus
      const nextNextItem = nextItem.getNextVisibleSibling();
      if(nextNextItem != null)
      {
        WF.editItemName(nextNextItem);
        if(focusedItem.equals(WF.focusedItem()) && nextItem.isExpanded() && WF.currentSearchQuery() === null)
            WF.collapseItem(nextItem);
        WF.editItemName(focusedItem);
      }

      const parentItem = nextItem.getParent();
      WF.moveItems([nextItem], parentItem, focusedItem.getPriority());
    }
  }

  setCursorAt(state.get().anchorOffset);
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

  setCursorAt(state.get().anchorOffset);
}

function yankSelectedItems(t)
{
  const focusedItem = WF.focusedItem();

  if(!focusedItem)
    return;

  const currentItem = WF.currentItem();

  if(focusedItem.equals(currentItem))
    return;

  const selection = WF.getSelection();
  if (selection !== undefined && selection.length != 0) 
    yankBuffer = selection;
  else 
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

function deleteSelectedItems(t)
{
  const focusedItem = WF.focusedItem();
  if(!focusedItem)
    return;

  const bWasPreviousVisibleSiblingInvalid = focusedItem.getPreviousVisibleSibling() === null;

  var CurrentSelection = WF.getSelection();
  if (CurrentSelection !== undefined && CurrentSelection.length != 0) 
  {

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

    WF.editGroup(() => 
    {
      CurrentSelection.forEach((item, i) => { WF.deleteItem(item); });
    });

  }
  else
  {
    if(bWasPreviousVisibleSiblingInvalid)
    {
      const selectedProject = t.parentNode.parentNode.parentNode.parentNode;
      WF.deleteItem(focusedItem);
      setCursorAfterVerticalMove(offsetCalculator(state), selectedProject);
    }
    else
    {
      const prevTarget = t.parentNode.parentNode.previousElementSibling.firstElementChild.lastElementChild;
      WF.deleteItem(focusedItem);
      setCursorAfterVerticalMove(offsetCalculator(state), moveCursorDown(prevTarget));
    }
  }
}

function visualMode_AddItemToSelection_Above(t)
{
  const focusedItem = WF.focusedItem();

  if(!focusedItem)
    return;

  const currentItem = WF.currentItem();

  if(focusedItem.equals(currentItem))
    return;

  if(focusedItem.getPriority() == 0 && focusedItem.getParent().equals(currentItem))
    return;

  const previousVisibleSibling = focusedItem.getPreviousVisibleSibling();
  if(!previousVisibleSibling || previousVisibleSibling && previousVisibleSibling.equals(currentItem))
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
    || (!WF.focusedItem().getParent().equals(WF.currentItem())) && (!getChildOfCurrentItem(WF.focusedItem()).equals(getChildOfCurrentItem(InitialSelectionItem))))
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

  if(!focusedItem)
    return;

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
    || (!WF.focusedItem().getParent().equals(WF.currentItem())) && (!getChildOfCurrentItem(WF.focusedItem()).equals(getChildOfCurrentItem(InitialSelectionItem))))
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

    const input = '1234567890[{]};:\'",<.>/?\\+=_-)(*&^%$#@~`!abcdefghijklmnopqrstuvwxyzåäöABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ'.includes(event.key);
    const modified = (event.metaKey || event.altKey || event.ctrlKey)
    if (input && !modified)
    {
      event.preventDefault();
      // !!! bind the key if you need to stopPropagation() as well. 
    }
  }
}

function mouseClickIntoInsertMode(event)
{
  if(state.get().mode !== Mode.INSERT)
  {
    goToInsertMode(true);
    requestAnimationFrame(fixFocus);

    if(!WF.focusedItem())
    {
      // we clicked somewhere outside of the tree revert to normal mode!
      WF.zoomTo(WF.currentItem());
      WF.editItemName(WF.currentItem());
      goToNormalMode();
      // console.log("going to normal mode due to lack of focus: ");
    }

    goToInsertMode(true);
    requestAnimationFrame(fixFocus);
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
    // console.log("reselectingItemBeingMoved");
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

        // only show this message if you start hammering
        // button while the search is doing its thing
        if(key != 'Enter')
        {
          WF.hideMessage();
          WF.showMessage("Waiting for search Query to complete...".bold(), true);
        }
        else
        {
          const filteredKeys = keyBuffer.filter(function(value, index, arr)
          {
            return validSearchKeys.includes(value);
          });

          var slashIndex = filteredKeys.indexOf("/");
          if (slashIndex > -1) {
              filteredKeys.splice(slashIndex, 1);
          }

          const keyBufferStr = filteredKeys.join(""); 

          // cancel search upon searching for nothing and pressing enter
          if(!keyBufferStr)
          {
            WF.search("");
            WF.clearSearch();
            keyBuffer = [];
            WF.hideMessage();
            WF.editItemName(WF.currentItem());
          }
          else
          {
            // hide the message to tell the user that 
            // the search has begun
            WF.hideMessage();
          }
        }
      }

    }
    else
    {
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

function sortCompletedItemsOnFocusParent(t)
{
  const focusedItem = WF.focusedItem();

  if(!focusedItem)
    return;

  var parentItem = focusedItem.getParent();

  if(!parentItem)
    return;

  const currentItem = WF.currentItem();

  if(focusedItem.equals(currentItem))
    parentItem = currentItem;

  const visibleChildren = parentItem.getVisibleChildren();
  if (visibleChildren === undefined || visibleChildren.length == 0) 
    return;

  var completedKids = [];
  for (var i = 0; i < visibleChildren.length; i++) 
  {
    if(visibleChildren[i].isCompleted())
      completedKids.push(visibleChildren[i]);
  }

  if(completedKids.length == 0)
    return;

  completedKids.sort((a, b) => b.getCompletedDate() - a.getCompletedDate());
  WF.editGroup(() => 
  {
    completedKids.forEach((item, i) => 
    {
      if (item.getPriority() !== i) 
        WF.moveItems([item], parentItem, i)
    })

    WF.moveItems(completedKids, parentItem, visibleChildren.length);

  });

  if(!containsItem(completedKids, focusedItem))
    WF.editItemName(focusedItem);
  else if(completedKids[0].getPreviousVisibleSibling())
    WF.editItemName(completedKids[0].getPreviousVisibleSibling());
  else
    WF.editItemName(parentItem);

  setCursorAt(state.get().anchorOffset);
}

function zoomOutFocused()
{
  const focusedItem = WF.focusedItem();
  if(focusedItem == null)
    return;

  const currentItem = WF.currentItem();

  WF.editItemName(currentItem);

  if(currentItem.getParent())
  {
    WF.zoomTo(currentItem.getParent());
    if(!WF.focusedItem())
    {
      requestAnimationFrame(fixFocus);
      goToNormalMode();
      WF.editItemName(currentItem);
    }
  }
  else
  {
    WF.zoomOut(currentItem);
  }

  if(WF.focusedItem())
  {
    WF.editItemName(focusedItem);
  }
  else
  {
    requestAnimationFrame(fixFocus);
    goToNormalMode();
  }

  setCursorAt(state.get().anchorOffset);
}

function zoomInFocused()
{
  const focusedItem = WF.focusedItem();
  if(focusedItem == null)
    return;

  const focusedAncestors = focusedItem.getAncestors();
  if(focusedAncestors.length == 0)
    return;

  if(focusedAncestors.length == 1)
  {
    WF.zoomTo(focusedItem);
    setCursorAt(state.get().anchorOffset);
  }
  else
  {
    const currentItem = WF.currentItem();
    focusedAncestors.forEach((item, i) => 
    {
      const itemParent = item.getParent();
      if(itemParent && itemParent.equals(currentItem))
      {
        WF.zoomTo(item);
        WF.editItemName(focusedItem);
        setCursorAt(state.get().anchorOffset);
        return;
      }
    });
  }
}

function zoomOutInstantly()
{
  const currentItem = WF.currentItem();
  const currentItemParent = currentItem.getParent();
  if(currentItemParent)
  {
    WF.zoomTo(currentItemParent);
    WF.editItemName(currentItem);
    setCursorAt(state.get().anchorOffset);
  }
  else
  {
    WF.zoomOut(WF.currentItem());
  }

}

function zoomInInstantly()
{
		const focusedItem = WF.focusedItem();
    if(focusedItem)
    {
      WF.zoomTo(focusedItem);

      const kids = focusedItem.getVisibleChildren();
      if(kids !== undefined && kids.length != 0)
        WF.editItemName(kids[0]);
      else
        WF.editItemName(focusedItem);

      setCursorAt(state.get().anchorOffset);
    }
}

function deleteNote(item)
{
		if(!item)
      return;

    WF.editGroup(() => 
    {
      WF.setItemNote(item, "");
      WF.editItemName(item);
      setCursorAt(state.get().anchorOffset);
    });

}

function changeNote(item)
{
		if(!item)
      return;

    WF.editGroup(() => 
    {
      WF.editItemName(WF.currentItem());
      WF.setItemNote(item, "");
      WF.editItemNote(item);

      WF.insertText("");

      WF.editItemName(WF.currentItem());
      WF.setItemNote(item, "");
      WF.editItemNote(item);

    });

    goToInsertMode();
}

function deleteUnderCursor(t)
{
  const currentOffset = state.get().anchorOffset;
  WF.insertText("");
  moveCursorTo(t, offsetCalculator(state), currentOffset);
}

const onlyIfProjectCanBeEdited = command => target => {
	const targetProject = projectAncestor(target)
	const isMainDotOfForeignSharedList = targetProject.className.includes('addedShared')
	const isNotEditable = targetProject.getAttribute('data-tid') === '2'
	const commandShouldBePrevented = isMainDotOfForeignSharedList || isNotEditable
	if (commandShouldBePrevented) 
	{
	    flashMode('Cannot edit this')
	    return
	}
	command(target)
}
