const keyFrom = event => `${event.altKey ? 'alt-': ''}${event.key && event.key.toLowerCase()}`

const Mode = {
  NORMAL: 'NORMAL',
  INSERT: 'INSERT'
}

const state = stateClojure({
    mode: Mode.NORMAL,
    anchorOffset: 0,
    debug: false
  },
  () => document.getElementById('pageContainer').dispatchEvent(new Event('vimflowy.stateChanged'))
)

const debug = (...args) => state.get().debug && console.log(...args)

const modeIndicator = (mainContainer, getState) => {
  const indicatorElement = document.createElement('div')
  indicatorElement.setAttribute('style', 'position: fixed; z-index:9001; bottom:0; left: 0; background-color: grey; color: white; padding: .3em; font-family: sans-serif;')
  indicatorElement.innerHTML = 'NORMAL'
  document.querySelector('body').append(indicatorElement)

  mainContainer.addEventListener('vimflowy.stateChanged', () => {
    const {mode} = getState()
    indicatorElement.innerHTML = mode
  })

  let timerId = null

  return {
    flashMode: (temporaryMode, duration = 1000) => {
      clearTimeout(timerId)
      indicatorElement.innerHTML = temporaryMode
      timerId = setTimeout(() => {
        indicatorElement.innerHTML = getState().mode
      }, duration)
    }
  }
}

const preventInsertMode = target => {
  const targetProject = projectAncestor(target)
  const isMainDotOfForeignSharedList = targetProject.className.includes('addedShared')

  const isNotEditable = targetProject.getAttribute('data-tid') === '2'

  return isMainDotOfForeignSharedList || isNotEditable
}

$(() => {
  window.toggleDebugging = () => state.set(s => ({
    debug: !s.debug
  }))

  searchBox(state.set, state.get)

  const mainContainer = document.getElementById('pageContainer')

  const {flashMode} = modeIndicator(mainContainer, state.get)

  mainContainer.addEventListener('keydown', event => {
    const e = jQuery.Event('keydown')

    const actionMap = {
      [Mode.NORMAL]: {
        h: moveCursorLeft,
        j: target => setCursorAfterVerticalMove(state.get().anchorOffset, moveCursorDown(target)),
        k: target => setCursorAfterVerticalMove(state.get().anchorOffset, moveCursorUp(target)),
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
        i: t => {
          if (preventInsertMode(t)) {
            flashMode('Cannot edit this')
            return
          }

          state.set(s => ({mode: Mode.INSERT}))
        },
        escape: () => state.set(s => ({mode: Mode.NORMAL})),
        esc: () => console.log('MAC WTF') || state.set(s => ({mode: Mode.NORMAL})) // mac?
      },
      [Mode.INSERT]: {
        escape: () => state.set(s => ({mode: Mode.NORMAL})),
        esc: () => console.log('MAC WTF') || state.set(s => ({mode: Mode.NORMAL})) // mac?
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
