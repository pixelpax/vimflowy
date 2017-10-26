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
    goToNormalMode: () => {
      setState(s => ({mode: Mode.NORMAL}))
      setMode(Mode.NORMAL)
      setCursorAt(a => a)
    }
  }
}

let secondDTimeout
const firstD = (target, keymap) => {
  keymap.d = function (t) {
    secondD(t, this)
  }

  secondDTimeout = setTimeout(() => {
    keymap.d = function (t) { firstD(t, this) }
  }, 800)
}

const secondD = (target, keymap) => {
  clearTimeout(secondDTimeout)
  const e = jQuery.Event('keydown')
  e.which = 8
  e.ctrlKey = true
  e.shiftKey = true
  $(target).trigger(e)
  keymap.d = function (t) { firstD(t, this) }
}

$(() => {
  window.toggleDebugging = () => state.set(s => ({
    debug: !s.debug
  }))

  let stack = ''

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

  searchBox(state.set, state.get, offsetCalculator(state))

  const mainContainer = document.getElementById('pageContainer')

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

  const actionMap = {
    [Mode.NORMAL]: {
      h: t => moveCursorLeft(t, offsetCalculator(state)),
      j: target => setCursorAfterVerticalMove(offsetCalculator(state), moveCursorDown(target)),
      Enter: target => {
        setCursorAfterVerticalMove(offsetCalculator(state), moveCursorDown(target))
        moveCursorToStart(target, offsetCalculator(state))
      },
      k: target => setCursorAfterVerticalMove(offsetCalculator(state), moveCursorUp(target)),
      l: t => moveCursorRight(t, offsetCalculator(state)),
      i: onlyIfProjectCanBeEdited(() => goToInsertMode()),
      a: onlyIfProjectCanBeEdited(() => goToInsertMode(true)),
      '/': searchCommand,
      '?': searchCommand,
      o: t => {
        moveCursorToEnd(t, offsetCalculator(state))
        goToInsertMode(true)
        const e = jQuery.Event('keydown')
        e.which = 13
        $(t).trigger(e)
      },
      O: t => {
        moveCursorToStart(t, offsetCalculator(state))
        goToInsertMode()
        const e = jQuery.Event('keydown')
        e.which = 13
        $(t).trigger(e)
      },
      '0': t => moveCursorToStart(t, offsetCalculator(state)),
      '^': t => moveCursorToStart(t, offsetCalculator(state)),
      '$': t => moveCursorToEnd(t, offsetCalculator(state)),
      'I': onlyIfProjectCanBeEdited(t => {
        moveCursorToStart(t, offsetCalculator(state))
        goToInsertMode()
      }),
      'A': onlyIfProjectCanBeEdited(t => {
        moveCursorToEnd(t, offsetCalculator(state))
        goToInsertMode(true)
      }),
      'alt-l': t => {
        state.set(s => ({anchorOffset: 0}))
        const e = jQuery.Event('keydown')
        e.which = 39
        e.altKey = true
        $(t).trigger(e)
      },
      'alt-h': t => {
        state.set(s => ({anchorOffset: 0}))
        const e = jQuery.Event('keydown')
        e.which = 37
        e.altKey = true
        $(t).trigger(e)
      },
      u: t => {
        const selection = document.getSelection()
        const selectionSnapshot = {
          anchorOffset: selection.anchorOffset,
        }
        const e = jQuery.Event('keydown')
        e.which = 90
        e.ctrlKey = true
        $(window).trigger(e)

        if (!t.childNodes.length) {
          const e = jQuery.Event('keydown')
          e.which = 90
          e.ctrlKey = true
          $(window).trigger(e)
          t.focus()
          return
        }

        const textNode = t.childNodes[0]
        const range = document.createRange()
        range.setStart(textNode, Math.min(selectionSnapshot.anchorOffset, textNode.length - 1))
        range.collapse(true)
        selection.removeAllRanges()
        selection.addRange(range)
        selection.modify('extend', 'right', 'character')
        t.focus()
      },
      'ctrl-r': t => {
        const selection = document.getSelection()
        const selectionSnapshot = {
          anchorOffset: selection.anchorOffset,
        }
        const e = jQuery.Event('keydown')
        e.which = 89
        e.ctrlKey = true
        $(window).trigger(e)

        const textNode = t.childNodes[0]
        const range = document.createRange()
        range.setStart(textNode, Math.min(selectionSnapshot.anchorOffset, textNode.length - 1))
        range.collapse(true)
        selection.removeAllRanges()
        selection.addRange(range)
        selection.modify('extend', 'right', 'character')
        t.focus()
      },
      Escape: goToNormalMode,
      Esc: () => console.log('MAC WTF') || goToNormalMode(), // mac?
      d: function (t) { firstD(t, this) },
      'alt-J': t => {
        const e = jQuery.Event('keydown')
        e.which = 40 
        e.altKey = true
        e.shiftKey = true
        $(t).trigger(e)
      },
      'alt-K': t => {
        const e = jQuery.Event('keydown')
        e.which = 38 
        e.altKey = true
        e.shiftKey = true
        $(t).trigger(e)
      }
    },
    [Mode.INSERT]: {
      Escape: goToNormalMode,
      Esc: () => console.log('MAC WTF') || goToNormalMode() // mac?
    }
  }
  mainContainer.addEventListener('keydown', event => {
    debug(state.get().mode, keyFrom(event), event)

    if (actionMap[state.get().mode][keyFrom(event)]) {
      event.preventDefault()
      event.stopPropagation()


      actionMap[state.get().mode][keyFrom(event)](event.target)

      return
    }

    const input = '1234567890[{]};:\'",<.>/?\\+=_-)(*&^%$#@~`!abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.includes(event.key)
    const modified = !(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)
    if (state.get().mode === Mode.NORMAL && (input || modified)) {
      event.preventDefault()

      debug('prevented because NORMAL mode')
    }
  })
})
