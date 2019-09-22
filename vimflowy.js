
const mainContainer = document.getElementById('app');
const {flashMode, goToInsertMode, goToNormalMode, goToVisualMode} = modeClosure(mainContainer, state.get, state.set);

WFEventListener = event => 
{
  // console.log(event);
  if(event === "documentReady")
    requestAnimationFrame(fixFocus);

  // // fix for not landing in NormalMode when using the JumpToItemMenu
  // if (event === 'locationChanged' 
  //   && state.get().mode === Mode.INSERT
  //   && !WF.focusedItem()
  //   && WF.currentSearchQuery() === null
  // ) 
  // {
  //   console.log("going into normal mode post using JumpToItemMenu");
  //   requestAnimationFrame(fixFocus);
  //   goToNormalMode();
  //   focusPreJumpToItemMenu = null;
  //   event.preventDefault()
  //   event.stopPropagation()
  // }

};

mainContainer.addEventListener('mousedown', event => 
{ 
    mouseClickIntoInsertMode(event);
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

// we can't use WF.getSelection()
// because WF.setSelection() will 
// remove any of the added items 
// if they are children of any 
// of the other items which were added
let VisualSelectionBuffer = [];
let PrevEnterItem = null;
let SelectionPreMove = [];
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
