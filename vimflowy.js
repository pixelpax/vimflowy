const keyFrom = event => `${event.altKey ? 'alt-': ''}${event.key && event.key.toLowerCase()}`

const Mode = {
  NORMAL: 'NORMAL',
  INSERT: 'INSERT'
}

const state = {
  mode: Mode.NORMAL,
  anchorOffset: 0,
  debug: false
}

const debug = (...args) => state.debug && console.log(...args)

const moveCursorHorizontally = offset => {
  const {anchorOffset, baseNode} = document.getSelection()
  const targetCursorPosition = anchorOffset + offset
  if (targetCursorPosition < 0) {
    return
  }

  if (targetCursorPosition > baseNode.length) {
    return
  }

  const selection = window.getSelection()
  state.anchorOffset = targetCursorPosition

  const range = document.createRange()
  range.setStart(baseNode, targetCursorPosition)
  range.collapse(true)
  selection.removeAllRanges()
  selection.addRange(range)
  baseNode.parentElement.focus()
}

const projectAncestor = project => {
  const ancestor = project.closest(`.project:not([projectid='${project.getAttribute('projectid')}'])`)

  return ancestor.className.includes('mainTreeRoot')
    ? project
    : ancestor
} 

const moveAboveFold = element => {
  const rect = element.getBoundingClientRect()
  const fold = window.innerHeight
  const scrollPosition = window.scrollY
  const beyondFold = rect.top >= fold || (rect.top < fold && rect.bottom > fold)
  const floatingHeaderHeight = 30
  const aboveViewport = rect.top < floatingHeaderHeight

  if (!beyondFold && !aboveViewport) {
    return
  }

  element.scrollIntoView()
  if (aboveViewport) {
    window.scrollBy(0, -floatingHeaderHeight)
  }
}

const setCursorAfterVerticalMove = cursorTargetProject => {
  const cursorTarget = cursorTargetProject.querySelector('.name>.content')

  const selection = window.getSelection()
  state.anchorOffset = Math.max(selection.anchorOffset, state.anchorOffset)
  if (!cursorTarget.childNodes.length) {
    cursorTarget.append('')
  }
  const textNode = cursorTarget.childNodes[0]
  const range = document.createRange()
  range.setStart(textNode, Math.min(state.anchorOffset, textNode.length))
  range.collapse(true)
  selection.removeAllRanges()
  selection.addRange(range)
  cursorTarget.focus()

  moveAboveFold(cursorTarget)
}

const moveDown = t => {
  const project = projectAncestor(t)
  let cursorTargetProject = project.className.includes('open')
    ? project.querySelector('.project')
    : project.nextElementSibling

  while(cursorTargetProject && cursorTargetProject.className.includes('childrenEnd')) {
    const sibling = projectAncestor(cursorTargetProject).nextElementSibling
    cursorTargetProject = (sibling.className.includes('childrenEnd') || sibling.className.includes('project')) && sibling
  }

  if (!cursorTargetProject) {
    return
  }

  setCursorAfterVerticalMove(cursorTargetProject)
}

const moveUp = t => {
  const project = projectAncestor(t) 
  let cursorTarget = null

  if (project.previousElementSibling) {
    cursorTarget = project.previousElementSibling
    if (cursorTarget.className.includes('open')) {
      const textContainers = cursorTarget.querySelectorAll('.project')
      cursorTarget = textContainers[textContainers.length - 1]
    }
  }

  if (!cursorTarget) {
    cursorTarget = projectAncestor(project) 
  }

  cursorTarget && setCursorAfterVerticalMove(cursorTarget)
}

$(() => {
  window.toggleDebugging = () => {
    state.debug = !state.debug
  }
  document.getElementById('searchBox').addEventListener('focus', event => {
    if (event.sourceCapabilities) {
      return
    }

    debug('dirty escape search hack')
    setCursorAfterVerticalMove(projectAncestor(event.relatedTarget))
  })
  document.getElementById('pageContainer').addEventListener('keydown', event => {
    const e = jQuery.Event('keydown')

    const actionMap = {
      [Mode.NORMAL]: {
        j: moveDown,
        k: moveUp,
        h: t => moveCursorHorizontally(-1),
        l: t => moveCursorHorizontally(1),
        'alt-l': t => {
          state.anchorOffset = 0
          e.which = 39
          e.altKey = true
          $(t).trigger(e)
        },
        'alt-h': t => {
          state.anchorOffset = 0
          e.which = 37
          e.altKey = true
          $(t).trigger(e)
        },
        i: t => {
          console.log('INSERT MODE')
          state.mode = Mode.INSERT
        },
        escape: t => {
          state.mode = Mode.NORMAL
          moveCursorHorizontally(0)
        }
      },
      [Mode.INSERT]: {
        escape: t => {
          console.log('NORMAL MODE')
          state.mode = Mode.NORMAL
          moveCursorHorizontally(0)
        }
      }
    }

    if (actionMap[state.mode][keyFrom(event)]) {
      event.preventDefault()

      debug(state.mode, event)

      actionMap[state.mode][keyFrom(event)](event.target)

      return
    }

    if (state.mode === Mode.NORMAL) {
      event.preventDefault()

      debug('prevented because NORMAL mode', event)
    }
  })
})
