const keyFrom = event => `${event.altKey ? 'alt-': ''}${event.ctrlKey ? 'ctrl-' : ''}${event.metaKey ? 'meta-' : ''}${event.key && event.key}`

function calculateCursorOffset(bHtmlTagsIncluded = false)
{
  let currentOffset = state.get().anchorOffset

  const focusedItem = WF.focusedItem();
  if(!focusedItem)
    return currentOffset;

  const itemName = focusedItem.getName();
  const itemNameText = focusedItem.getNameInPlainText();

  // Oh no, it has html tags, recalculate cursor offset
  if(itemNameText.length != itemName.length)
  {
    // remove any html tags from the "plain text name" before we start the counting
    let ItemNameTextPreCleanupSubStringStart = itemNameText.substring(0, currentOffset+1); 
    let itemNameCleaned = ItemNameTextPreCleanupSubStringStart;
    itemNameCleaned = itemNameCleaned.replace(/(<u>)/g, "");
    itemNameCleaned = itemNameCleaned.replace(/(<\/u>)/g, "");
    itemNameCleaned = itemNameCleaned.replace(/(<i>)/g, "");
    itemNameCleaned = itemNameCleaned.replace(/(<\/i>)/g, "");
    itemNameCleaned = itemNameCleaned.replace(/(<b>)/g, "");
    itemNameCleaned = itemNameCleaned.replace(/(<\/b>)/g, "");
    const lenDiff = ItemNameTextPreCleanupSubStringStart.length - itemNameCleaned.length;
    let offsetThreshold = currentOffset - lenDiff;

    let addedOffset = 0;
    for (let i = 0; i < itemName.length; i++) 
    {
      const char_1 = itemNameCleaned.charAt(i-addedOffset);
      const char_2 = itemName.charAt(i);
      if(char_1 != char_2)
        ++addedOffset;

      if (i - addedOffset == offsetThreshold)
        break;
    }

    currentOffset += addedOffset;
    currentOffset -= lenDiff;

    if(itemName.charAt(currentOffset) == "<")
    {
      --currentOffset;
      --addedOffset;
    }

    if(bHtmlTagsIncluded)
    {
      // cursor offset (with html tags accounted for)
      return currentOffset;
    }
    else
    {
      // cursor offset (without html tags)
      const accurateCursorOffset = currentOffset - addedOffset;
      return accurateCursorOffset;
    }

  }

  return currentOffset;
}

function deleteUntilLineEnd()
{
  const focusedItem = WF.focusedItem();
  if(!focusedItem)
    return;

  const itemName = focusedItem.getName();
  let currentOffset = calculateCursorOffset(true);

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

  // console.clear();

  const itemName = focusedItem.getName();
  var currentOffset = calculateCursorOffset(true);

  const substring_Start = itemName.substring(0, currentOffset);
  const substring_End = itemName.substring(currentOffset);
  const underCursorChar = itemName.charAt(currentOffset); 

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

  const focusedItemParent = focusedItem.getParent();
  const children = focusedItemParent.getVisibleChildren();
  // const children = currentItem.getVisibleChildren();
  if (children === undefined || children.length == 0)
    return;

	var bExpandAll = false;

  const focusKids = focusedItem.getVisibleChildren(); 
  if(focusKids !== undefined && focusKids.length != 0)
  {
    bExpandAll = !focusedItem.isExpanded();
  }
  else
  {
    var numExpanded = 0;
    var numCollapsed = 0;
    children.forEach((item, i) => 
    {
      const itemKids = item.getVisibleChildren();
      const bHasKids = itemKids !== undefined && itemKids.length != 0;
      if(bHasKids)
      {
        if(item.isExpanded())
          ++numExpanded;
        else
          ++numCollapsed;
      }
    });

    // none of the items have any kids => nothing to expand or collapse
    if(numExpanded == 0 && numCollapsed == 0)
      return;

    if(numExpanded == 0)
      bExpandAll = true;
    else if(numCollapsed == 0)
      bExpandAll = false;
    else
    {    
      bExpandAll = numExpanded > numCollapsed;
    }

  }

  // const currentItemChildAncestor = getChildOfCurrentItem(focusedItem);
  // WF.editItemName(currentItemChildAncestor);

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
    WF.editItemName(focusedItemParent);
    if(!WF.focusedItem())
    {
      WF.editItemName(currentItem);
    }
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

function addKidsRecursively(itemContainer, item, bOnlyExpanded = true)
{
  if (!item)
    return;

  // hmmm performance...
  // if (!containsItem(itemContainer, item))
  itemContainer.push(item); 

  if (bOnlyExpanded && !item.isExpanded())
    return;

  let kids = item.getChildren();
  if (kids !== undefined && kids.length != 0) 
  {
    kids.forEach((kid, i) =>  
    {
      addKidsRecursively
      (
        itemContainer,
        kid,
        bOnlyExpanded
      );
    });
  }
}

function toggleCompletedOnSelection(e)
{
  let selection = WF.getSelection();
  if (selection === undefined || selection.length == 0) 
    return;

  e.preventDefault()
  e.stopPropagation()

  let numCompleted = 0;
  let numUncompleted = 0;
  selection.forEach((item, i) => 
	{
		if(item.isCompleted())
			++numCompleted;
		else
			++numUncompleted;
  });
  
	let bCompleteAll = false;
	if(numCompleted == 0)
		bCompleteAll  = true;
	else if(numUncompleted == 0)
		bCompleteAll = false;
	else
	{    
		bCompleteAll = numCompleted > numUncompleted;
	}

  // add all visible kids to the selection
  selection.forEach((item, i) => 
  {
    addKidsRecursively(
      selection,
      item,
      true
    );
  });

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

  // replace any mirrors with the original item
  ReplaceMirroredItems(yankBuffer);
}

function ReplaceMirroredItems(itemContainer)
{
  for (i = itemContainer.length-1; i >= 0; i--) 
  {
    if (IsItemOriginal(itemContainer[i]) == false)
    {
      itemContainer[i] = GetOriginalItem(itemContainer[i]);
    }
  }
}

// get original item from mirror
function GetOriginalItem(mirroredItem)
{
  return WF.getItemById(mirroredItem.data.metadata.originalId);
}

// check whether an item is a mirror or original
function IsItemOriginal(itemToQuery)
{
   return itemToQuery.data.metadata.originalId === undefined;
}

// get original ID from mirror
function GetOriginalID(mirroredItem)
{
   return mirroredItem.data.metadata.originalId;
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

  SelectionPreMove = selection;

  if(newParentItem == null || newParentItem === undefined)
    return;

  const currentOffset = state.get().anchorOffset
  WF.editItemName(newParentItem);

  WF.editGroup(() => 
  {
    WF.moveItems(selection, newParentItem, prio);
    VisualSelectionBuffer = selection;
    WF.setSelection(selection);

    // @TODO: this will only work if the expansion is instant
    // if(newParentItem.getChildren().length != 0 && !newParentItem.isExpanded())
    //   WF.expandItem(newParentItem);

  });

  // we need to focus on the newly created mirrors..
  if(!IsItemOriginal(newParentItem))
  {
    const numItemsIndented = selection.length;
    const newParentKids = newParentItem.getChildren();
    const numItemsOnNewParent = newParentKids.length;
    selection = [];
    for (i = numItemsOnNewParent - numItemsIndented; i < numItemsOnNewParent; i++) 
      selection.push(newParentKids[i]);
    
    // ...maybe not needed!?
    VisualSelectionBuffer = selection;
    SelectionPreMove = selection;
  }

  WF.editItemName(selection[0]);
  setCursorAt(currentOffset);

  if(!WF.focusedItem())
    requestAnimationFrame(fixFocus);

  e.preventDefault();
  e.stopPropagation();
}

function indentFocusedItem(e)
{
	e.preventDefault();
	e.stopPropagation();

	var focusedItem = WF.focusedItem();
	if(!focusedItem)
		return;

	const focusPrevSibling = focusedItem.getPreviousVisibleSibling();
	if(!focusPrevSibling)
		return;

	var prio = 0;
    const kids = focusPrevSibling.getChildren(); 
    if(kids.length != 0)
      prio = kids[kids.length-1].getPriority()+1;

	const currentOffset = state.get().anchorOffset

	// focus on new parent in case re-focusing fails after move.
	WF.editItemName(focusPrevSibling);

	WF.editGroup(() => 
	{
		WF.moveItems([focusedItem], focusPrevSibling, prio);
  });
  
  // we need to focus on the newly created mirror
  if (!IsItemOriginal(focusPrevSibling))
  {
    const kids = focusPrevSibling.getChildren();
    if(kids.length > 0)
    {
      focusedItem = kids[kids.length-1];
    }
  }

	WF.editItemName(focusedItem);

	setCursorAt(currentOffset);

	if(!WF.focusedItem())
		requestAnimationFrame(fixFocus);
}

function outdentFocusedItem(e)
{
	e.preventDefault();
	e.stopPropagation();

	var focusedItem = WF.focusedItem();
	if(!focusedItem)
		return;

	const focusParent = focusedItem.getParent();
	if(!focusParent)
		return;

	const currentItem = WF.currentItem();
	if(currentItem.equals(focusParent))
		return;

	var newPriority = focusParent.getPriority() + 1;
	const newParent = focusParent.getParent();

	const currentOffset = state.get().anchorOffset

	// focus on new parent in case re-focusing fails after move.
	WF.editItemName(newParent);

	WF.editGroup(() => 
	{
		WF.moveItems([focusedItem], newParent, newPriority);
  });
  
  // we need to replace the mirrored item with the original, 
  // if we try to move it out of the parent, which also is a mirror.
  if(!IsItemOriginal(focusedItem))
    focusedItem = GetOriginalItem(focusedItem);

	WF.editItemName(focusedItem);

	setCursorAt(currentOffset);

	if(!WF.focusedItem())
		requestAnimationFrame(fixFocus);
}

function outdentSelection(e, bIncludingChildren = false)
{
	var selection = WF.getSelection();
	if (selection === undefined || selection.length == 0) 
		selection = SelectionPreMove;

	if (selection === undefined || selection.length == 0)
		return;

	const selectionParent = selection[0].getParent();
	if(!selectionParent)
		return;

	var prio = 0;
	var newParentItem = null;

	const currentItem = WF.currentItem();
	if(!currentItem.equals(selectionParent))
	{
		const grandParent = selectionParent.getParent();
		if(grandParent)
		{
			newParentItem = grandParent;
			prio = selectionParent.getPriority() + 1; 
		}
	}
	else if(bIncludingChildren)
	{
		WF.editGroup(() => 
		{
			selection.forEach((item, i) => 
			{
				const kids = item.getVisibleChildren();
				if (kids !== undefined && kids.length != 0) 
				{
					const destinationParent = item.getParent();
					const destinationPriority = item.getPriority() + 1;
					WF.moveItems(kids, destinationParent, destinationPriority);

					// the kids have to be added to the selection
					// now that they have been outdented
					selection = selection.concat(kids);
					VisualSelectionBuffer = selection;
					WF.setSelection(selection);
				}
			});
		});
	}

	SelectionPreMove = selection;

	if(newParentItem == null || newParentItem === undefined)
		return;

	const currentOffset = state.get().anchorOffset
	WF.editItemName(newParentItem);

	WF.editGroup(() => 
	{
		WF.moveItems(selection, newParentItem, prio);
		VisualSelectionBuffer = selection;
		WF.setSelection(selection);

		// @TODO: this will only work if the expansion is instant
		// if(newParentItem.getChildren().length != 0 && !newParentItem.isExpanded())
		//   WF.expandItem(newParentItem);
  });

  // we need to replace the mirrored items with 
  // the originals if we try to move out mirrored
  // items outside of the topmost mirror
  if(!IsItemOriginal(selection[0]))
  {
    const theMirrorsParent = selection[0].getParent();
    if(theMirrorsParent && !IsItemOriginal(theMirrorsParent))
    {
      ReplaceMirroredItems(selection);
      WF.setSelection(selection);
    }
  }

  WF.editItemName(selection[0]);

	setCursorAt(currentOffset);

	if(!WF.focusedItem())
		requestAnimationFrame(fixFocus);

	// we've placed these down here due to "TAB"
	// if this fails then workflowys TAB will take over.
	e.preventDefault();
	e.stopPropagation();
}

function deleteSelectedItems(t)
{
  const focusedItem = WF.focusedItem();
  if(!focusedItem)
    return;

  var CurrentSelection = WF.getSelection();
  if (CurrentSelection !== undefined && CurrentSelection.length != 0) 
  {

    minNumAncestors = GetMinNumAncestors(CurrentSelection);
    var filteredSelection = CurrentSelection.filter(function(item, index, arr)
    {
      return item.getAncestors().length <= minNumAncestors; 
    });

    var topMostItem = null;
    var minIndex = Number.MAX_SAFE_INTEGER;
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
    else if(topMostItem && topMostItem.getParent())
      WF.editItemName(topMostItem.getParent());
    else
      WF.editItemName(WF.currentItem());

    WF.editGroup(() => 
    {
      CurrentSelection.forEach((item, i) => 
      {
         WF.deleteItem(item); 
      });
    });

  }
  else
  {
    const bWasPreviousVisibleSiblingInvalid = focusedItem.getPreviousVisibleSibling() === null;
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

  // fix for invisible siblings that are placed at the top
  if(currentItem.getVisibleChildren()[0].equals(focusedItem))
    return;

  const previousVisibleSibling = focusedItem.getPreviousVisibleSibling();
  if(previousVisibleSibling && previousVisibleSibling.equals(currentItem))
    return;

  var currentSelection = VisualSelectionBuffer.length != 0 ? VisualSelectionBuffer : WF.getSelection();
  const itemAtStart = focusedItem;

  if(itemAtStart && !containsItem(currentSelection, itemAtStart))
    currentSelection.unshift(itemAtStart);

  // console.clear();
  // console.log("focusedItem before move: " + WF.focusedItem().getNameInPlainText());

  setCursorAfterVerticalMove(offsetCalculator(state), moveCursorUp(t));

  // console.log("focusedItem after move: " + WF.focusedItem().getNameInPlainText());
  // console.log("child of focusedItem after move: " + getChildOfCurrentItem(WF.focusedItem()).getNameInPlainText());

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
  {
    const focusKids = focusedItem.getVisibleChildren();
    if(focusKids.length == 0 || (!focusedItem.equals(InitialSelectionItem) && !containsItem(InitialSelectionItem.getAncestors(), focusedItem)))
    {
      return;
    }
  }

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
        // console.log("checking kids");
        var childrenRemaining = item.getVisibleChildren().length;
        if(childrenRemaining <= 1)
        {
          // console.log("no multi kids, removing: " + item.getNameInPlainText())
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
          // console.log("all kids included");
          return true;
        }
        else
        {
          // console.log("all kids were not included, removing:  " + item.getNameInPlainText());
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

   if(modifierKeyCodesToIgnore.includes(event.key))
   {
      event.preventDefault();
      event.stopPropagation();
      // console.log("blocking modifier keys");
   }

    const input = validInputKeys.includes(event.key);
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
  if(modifierKeyCodesToIgnore.includes(event.key))
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
  const currentItemParent = currentItem.getParent();

  if(currentItemParent)
  {
    // Zoom out instantly by targeting current item parent
    WF.zoomTo(currentItemParent);

    // refocus on currentItem because ZoomTo stole it. 
    WF.editItemName(currentItem);
  }
  else
  {
    // worse case; fallback to animated zoomOut 
    WF.zoomOut(currentItem);
  }

  // refocus on the item we focused in the beginning.
  WF.editItemName(focusedItem);

  // we might lose focus during the above operations due to various reasons. 
  if(!WF.focusedItem())
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

function addSiblingsFromInitList(bSiblingsAboveInitItem = true)
{
	if(!InitialSelectionItem)
		return;

	var selection = WF.getSelection();
	if (selection === undefined || selection.length == 0) 
		selection = SelectionPreMove;

	if (selection === undefined || selection.length == 0)
		return;

	const initParent = InitialSelectionItem.getParent();
	const initPrio = InitialSelectionItem.getPriority();
	const siblings = initParent.getVisibleChildren();
	if (siblings === undefined || siblings.length == 0) 
		return;

	WF.editGroup(() => 
	{
		var siblingsToBeAdded = [];
		var siblingsToBeRemoved = [];
		if(bSiblingsAboveInitItem)
		{
			siblings.forEach((item, i) => 
			{
				if(item.getPriority() < initPrio)
				{
					siblingsToBeAdded.push(item);
				}
				else if(item.getPriority() != initPrio)
				{
					siblingsToBeRemoved.push(item);
				}
			});
		}
		else
		{
			siblings.forEach((item, i) => 
			{
				if(item.getPriority() > initPrio)
				{
					siblingsToBeAdded.push(item);
				}
				else if(item.getPriority() != initPrio)
				{
					siblingsToBeRemoved.push(item);
				}
			});
		}

		if(bSiblingsAboveInitItem)
			selection = siblingsToBeAdded.concat(selection);
		else
			selection = selection.concat(siblingsToBeAdded);

		selection = selection.filter(x => 
			!containsItem(siblingsToBeRemoved, x)
		);

		const currentOffset = state.get().anchorOffset
		VisualSelectionBuffer = selection;
		SelectionPreMove = selection;
		WF.setSelection(selection);
		WF.editItemName(selection[bSiblingsAboveInitItem ? 0 : selection.length - 1]);
		setCursorAt(currentOffset);
	});
}

function addSiblingsFromCurrentList(bAbove = true)
{
	if(!InitialSelectionItem)
		return;

	var selection = WF.getSelection();
	if (selection === undefined || selection.length == 0) 
		selection = SelectionPreMove;

	if (selection === undefined || selection.length == 0)
		return;

	const initsCurrentItemAncestor = getChildOfCurrentItem(InitialSelectionItem);
	const initPrio = initsCurrentItemAncestor.getPriority();
	const siblings = WF.currentItem().getVisibleChildren();

	WF.editGroup(() => 
	{
		var siblingsToBeAdded = [];
		var siblingsToBeRemoved = [];
		if(bAbove)
		{
			siblings.forEach((item, i) => 
			{
				if(item.getPriority() < initPrio)
				{
					siblingsToBeAdded.push(item);
				}
				else if(item.getPriority() != initPrio)
				{
					siblingsToBeRemoved.push(item);
				}
			});
		}
		else
		{
			siblings.forEach((item, i) => 
			{
				if(item.getPriority() > initPrio)
				{
					siblingsToBeAdded.push(item);
				}
				else if(item.getPriority() != initPrio)
				{
					siblingsToBeRemoved.push(item);
				}
			});
		}

		if(bAbove)
		{
			selection = siblingsToBeAdded.concat(selection);
			selection.push(initsCurrentItemAncestor);
		}
		else
		{
			selection = selection.concat(siblingsToBeAdded);
			selection.unshift(initsCurrentItemAncestor);
		}

		selection = selection.filter(x => 
			!containsItem(siblingsToBeRemoved, x)
		);


		const currentOffset = state.get().anchorOffset
		VisualSelectionBuffer = selection;
		SelectionPreMove = selection;
		WF.setSelection(selection);
		WF.editItemName(selection[bAbove ? 0 : selection.length - 1]);
		setCursorAt(currentOffset);
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

  // delete under cursor
  WF.insertText("");

  let desiredOffset = currentOffset;
  const maxLen = WF.focusedItem().getNameInPlainText().length;
  if(maxLen == currentOffset)
    desiredOffset -= 1;

  moveCursorTo(t, offsetCalculator(state), desiredOffset);

}

function handleFindMode(e)
{
  goToNormalMode();

  const focusedItem = WF.focusedItem();
  if(!focusedItem)
    return;

  if(event.key == key_Esc)
    return;

  const filteredKeys = keyBuffer.filter(function(value, index, arr)
  {
    return validSearchKeys.includes(value);
  });

  if(filteredKeys.length <= 0)
    return;

  keyBuffer = [];

  // check if we pressed 't' / 'f' or 'F' / 'T'
  let bSearchForwards = true;
  if(filteredKeys.length > 1)
    bSearchForwards = filteredKeys[filteredKeys.length-2] == filteredKeys[filteredKeys.length-2].toLowerCase(); 

  const keyToFind = filteredKeys[filteredKeys.length-1];
  const currentOffset = state.get().anchorOffset;
  const itemNameText = focusedItem.getNameInPlainText();

  let newOffset = bSearchForwards 
  ? itemNameText.indexOf(keyToFind, currentOffset+1) 
  : itemNameText.lastIndexOf(keyToFind, currentOffset-1);

  if(newOffset != -1)
  {
    if(filteredKeys.length > 2 && !isNaN(filteredKeys[filteredKeys.length-3]))
    {
      const iterNum = parseInt(filteredKeys[filteredKeys.length-3]);
      for (let i = 1; i < iterNum; ++i) 
      {
        let iterNewOffset = bSearchForwards 
        ? itemNameText.indexOf(keyToFind, newOffset+1) 
        : itemNameText.lastIndexOf(keyToFind, newOffset-1);

        if(iterNewOffset != -1)
          newOffset = iterNewOffset;
      }
    }

    // offset if its a 't' or 'T'
    let targetOffset = newOffset; 
    if(filteredKeys.length > 1 && filteredKeys[filteredKeys.length-2].toLowerCase() == "t")
      targetOffset -= 1;

    moveCursorTo(
      e.target,
      offsetCalculator(state),
      targetOffset
    );
  }

}

function handleReplaceMode(e)
{
  if(event.key != key_Esc)
  {
    const filteredKeys = keyBuffer.filter(function(value, index, arr)
    {
      // @TODO: switch to a common 'validKeys' instead
      // which both replace and search uses
      return validSearchKeys.includes(value);
    });

    // @TODO: remove this once we implement 'R'
    keyBuffer = [];

    if(filteredKeys.length > 0)
    {
      const currentOffset = state.get().anchorOffset;
      WF.insertText(filteredKeys[filteredKeys.length-1]);
      moveCursorTo(e.target, offsetCalculator(state), currentOffset);
    }
  }

  goToNormalMode();
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

function SimulateEscapeInsertMode(e)
{
  // it will not work while we are in the JumpToItem menu
  if(!WF.focusedItem())
    return;

  e.preventDefault()
  e.stopPropagation()

  goToNormalMode();
}

// assumes Escape is actually being pressed
function HandleEscapeInsertMode(e)
{
  // prevent it from focusing on the search bar
  e.preventDefault()

  if(!WF.focusedItem())
  {
    // important that we don't stop propagation
    // when trying to escape the JumpToItemMenu
    if(focusPreJumpToItemMenu)
    {
      WF.editItemName(focusPreJumpToItemMenu);
      focusPreJumpToItemMenu = null;
    }
    else
    {
      // assuming we are focusing on the searchbar
      // in which case we'll have to stop the propagation
      e.stopPropagation()
    }

    if(!WF.focusedItem())
      WF.editItemName(WF.currentItem());

  }
  else
  {
    e.stopPropagation()

    // Update cursor pos because it doesn't get updated during insert mode
    let extraLength = 0;
    const nodes = getNodes(WF.focusedItem().getElement());
    for(let i = 0; i < nodes.length; ++i) 
    {
      if(!window.getSelection().containsNode(nodes[i]))
        extraLength += nodes[i].length;
      else
        // only count length up to the focused node
        break;
    }
    const cursorOffsetReset = document.getSelection().getRangeAt(0).startOffset; 
    setCursorAt(cursorOffsetReset);
    const targetOffset = state.get().anchorOffset + extraLength;
    moveCursorTo(e.target, offsetCalculator(state), targetOffset);
  }

  goToNormalMode();
}

function SimulateEscapeVisualMode(e)
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

// assumes Escape is actually being pressed
function HandleEscapeVisualMode(e)
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

function SimulateEscapeNormalMode(e)
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

  WF.hideMessage();
  WF.hideDialog();
  goToNormalMode();
}

// assumes Escape is actually being pressed
function HandleEscapeNormalMode(e)
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

  WF.hideMessage();
  WF.hideDialog();
  goToNormalMode();
}

function goToListBottom(event, listRootItem)
{
  var focusedItem = WF.focusedItem();

  if(!focusedItem)
    return;

  if(!listRootItem)
    return;

  const visibleChildren = listRootItem.getVisibleChildren();
  if (visibleChildren === undefined || visibleChildren.length == 0) 
    return;

  const currentOffset = state.get().anchorOffset

  // edge case; we would teleport outside of the visible list without this!
  if(focusedItem.equals(WF.currentItem()))
    WF.editItemName(visibleChildren[0]);

  const finalKid = visibleChildren[visibleChildren.length - 1];

  event.preventDefault()
  event.stopPropagation()

  // check if we are at the very bottom.
  if(containsItem(focusedItem.getAncestors(), finalKid))
    return;

  WF.editItemName(finalKid);
  setCursorAt(currentOffset);

  // did we make the jump?
  if(WF.focusedItem().equals(finalKid))
  {
    // do a recursive jump if we were standing on the bottom kid when we started
    if(finalKid.isExpanded() && focusedItem.equals(finalKid))
      goToListBottom(event, finalKid);
    return;
  }

  // The jump failed because there are to many items 
  // in the way. We'll start collapsing all items
  // and start marching down.
  focusedItem = WF.focusedItem();
  if(focusedItem.isExpanded() && WF.currentSearchQuery() === null)
    WF.collapseItem(focusedItem);

  var i = visibleChildren.length; 
  while(i--)
  {
    if(focusedItem.isExpanded() && WF.currentSearchQuery() === null)
      WF.collapseItem(focusedItem);

    const index = visibleChildren.length - i - 1;
    WF.editItemName(visibleChildren[index]);
    focusedItem = WF.focusedItem();
    setCursorAt(currentOffset);
  }


}



