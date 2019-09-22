
/*
	keybindings that implicitly always 
	call e.preventDefault() && e.stopPropagation()

	!!! Sequences, such as 'dd' are only supported in the transparentKeybinding map ATM.
*/

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

	  },
	  'ctrl-h': t => 
	  {
	    const currentItem = WF.currentItem();
	    const focusedItem = WF.focusedItem();
	    WF.editItemName(currentItem);

	    if(currentItem.getParent())
	    {
	      WF.zoomTo(currentItem.getParent());
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
	  'alt-§': t => 
	  {
	      previousTimeTagCounterMsg = "";
	      WF.hideMessage();
	      bShowTimeCounter = !bShowTimeCounter;
	  },
	  '§': t => 
	  {
		  sortCompletedItemsOnFocusParent(t);
	  },
	  P: t => 
	  {
	    pasteYankedItems(true);
	  },
	  p: t => 
	  {
	    pasteYankedItems(false);
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
	    toggleExpand(t);
	  },
	  'v': t =>
	  {
	    // const selection = WF.getSelection();
	    // if(selection !== undefined && selection.length != 0)
	    //   ExitVisualMode(t);
		// else
		  ExitVisualMode(t);
	      enterVisualMode(t);
	  },
	  'V': t =>
	  {
	    // const selection = WF.getSelection();
	    // if(selection !== undefined && selection.length != 0)
	    //   ExitVisualMode(t);
	    // else
		  ExitVisualMode(t);
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
	  }
	},
	[Mode.VISUAL]: 
	{
	  '§': t => 
	  {
		sortCompletedItemsOnFocusParent(t);
		ExitVisualMode();
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
	    toggleExpand(t);
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
	  'd': t =>
	  {
	    deleteSelectedItems(t);
	    ExitVisualMode();
	  },
	  P: t => 
	  {
		if (yankBuffer === undefined || yankBuffer.length == 0) 
			return;

		if(yankBuffer[0] == null || yankBuffer[0] === undefined)
			return;

		WF.editGroup(() => 
		{
			deleteSelectedItems(t);
			pasteYankedItems(true);
		});

	    ExitVisualMode();
	  },
	  p: t => 
	  {
		if (yankBuffer === undefined || yankBuffer.length == 0) 
			return;

		if(yankBuffer[0] == null || yankBuffer[0] === undefined)
			return;

		WF.editGroup(() => 
		{
			deleteSelectedItems(t);
			pasteYankedItems(false);
		});

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
