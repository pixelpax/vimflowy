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
  state.set(s => ({
    anchorOffset: Math.max(selection.anchorOffset, s.anchorOffset)
  }))
  if (!cursorTarget.childNodes.length) {
    cursorTarget.append('')
  }
  const textNode = cursorTarget.childNodes[0]
  const range = document.createRange()
  range.setStart(textNode, Math.min(state.get().anchorOffset, textNode.length))
  range.collapse(true)
  selection.removeAllRanges()
  selection.addRange(range)
  cursorTarget.focus()

  moveAboveFold(cursorTarget)
}

const moveCursorDown = t => {
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

const moveCursorUp = t => {
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
  state.set(s => ({
    anchorOffset: targetCursorPosition
  }))

  const range = document.createRange()
  range.setStart(baseNode, targetCursorPosition)
  range.collapse(true)
  selection.removeAllRanges()
  selection.addRange(range)
  baseNode.parentElement.focus()
}

const moveCursorLeft = moveCursorHorizontally.bind(null, -1)

const moveCursorRight = moveCursorHorizontally.bind(null, 1)

