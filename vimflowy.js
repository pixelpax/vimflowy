const keyFrom = event => `${event.altKey ? 'alt-': ''}${event.key && event.key.toLowerCase()}`

const Mode = {
  NORMAL: 'NORMAL',
  INSERT: 'INSERT'
}

const stateClojure = (stateChanged = () => {}) => {
  let s = {
    mode: Mode.NORMAL,
    anchorOffset: 0,
    debug: false
  }

  return {
    set: stateReducer => {
      s = Object.assign({}, s, stateReducer(s))
      stateChanged()
    },
    get: () => Object.assign({}, s)
  }
}

const state = stateClojure(() => document.getElementById('pageContainer').dispatchEvent(new Event('vimflowy.stateChanged')))

const debug = (...args) => state.get().debug && console.log(...args)

const modeIndicator = (mainContainer, getState) => {
  const indicatorElement = document.createElement('div')
  indicatorElement.setAttribute('style', 'position: fixed; bottom:0; left: 0; background-color: grey; color: white; padding: .3em; font-family: sans-serif;')
  indicatorElement.innerHTML = 'NORMAL'
  document.querySelector('body').append(indicatorElement)

  mainContainer.addEventListener('vimflowy.stateChanged', () => {
    const {mode} = getState()
    indicatorElement.innerHTML = mode
  })
}

$(() => {
  window.toggleDebugging = () => state.set(s => ({
    debug: !s.debug
  }))

  searchBox(state.set, state.get)

  modeIndicator(document.getElementById('pageContainer'), state.get)

  document.getElementById('pageContainer').addEventListener('keydown', event => {
    const e = jQuery.Event('keydown')

    const actionMap = {
      [Mode.NORMAL]: {
        h: moveCursorLeft,
        j: moveCursorDown,
        k: moveCursorUp,
        l: moveCursorRight,
        '/': searchCommand,
        '?': searchCommand,
        'alt-l': t => {
          state.set(s => ({anchorOffset: 0}))
          e.which = 39
          e.altKey = true
          $(t).trigger(e)
        },
        'alt-h': t => {
          state.set(s => ({anchorOffset: 0}))
          e.which = 37
          e.altKey = true
          $(t).trigger(e)
        },
        i: () => state.set(s => ({mode: Mode.INSERT})),
        escape: () => state.set(s => ({mode: Mode.NORMAL}))
      },
      [Mode.INSERT]: {
        escape: () => state.set(s => ({mode: Mode.NORMAL}))
      }
    }

    if (actionMap[state.get().mode][keyFrom(event)]) {
      event.preventDefault()

      debug(state.get().mode, event)

      actionMap[state.get().mode][keyFrom(event)](event.target)

      return
    }

    if (state.get().mode === Mode.NORMAL && !(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)) {
      event.preventDefault()

      debug('prevented because NORMAL mode', event)
    }
  })
})
