
const stateClosure = (initialState = {}, stateChanged = () => {}) => {
  let s = initialState 

  return {
    set: stateReducer => {
      s = Object.assign({}, s, stateReducer(s))
      stateChanged()
    },
    get: () => Object.assign({}, s)
  }
}

const Mode = {
  NORMAL: 'NORMAL',
  INSERT: 'INSERT',
  VISUAL: 'VISUAL',
  REPLACE: 'REPLACE'
}

const state = stateClosure({
    mode: Mode.NORMAL,
    anchorOffset: 0,
    debug: false
  }
)

window.toggleDebugging = () => state.set(s => ({
  debug: !s.debug
})) 

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
    },
    goToReplaceMode: () => 
    {
      if(state.get().mode === Mode.REPLACE)
        setCursorAt(a => a)
      else
        setCursorAt(document.getSelection().getRangeAt(0).startOffset);

      setState(s => ({mode: Mode.REPLACE}))
      setMode(Mode.REPLACE)
    }
  }
}
