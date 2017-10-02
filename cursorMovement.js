const closest = (node, selector) => {
  let element = node
  while(element && !element.matches(selector)) {
    element = element.parentNode
  }

  return element
}

const projectAncestor = project => closest(project, `.project:not([projectid='${project.getAttribute('projectid')}'])`)

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

const setCursorAfterVerticalMove = (anchorOffset, cursorTargetProject) => {
  const cursorTarget = cursorTargetProject.querySelector('.name>.content')

  const selection = window.getSelection()

  if (!cursorTarget.childNodes.length) {
    cursorTarget.append('')
  }
  const textNode = cursorTarget.childNodes[0]
  const range = document.createRange()
  range.setStart(textNode, Math.min(anchorOffset, textNode.length))
  range.collapse(true)
  selection.removeAllRanges()
  selection.addRange(range)
  cursorTarget.focus()

  moveAboveFold(cursorTarget)
}

const moveCursorDown = startElement => {
  const project = projectAncestor(startElement)

  if (project.className.includes('open')) {
    return project.querySelector('.project')
  }

  let cursorTargetProject = project
  while(!cursorTargetProject.nextElementSibling || !cursorTargetProject.nextElementSibling.className.includes('project')) {
    const ancestor = projectAncestor(cursorTargetProject)

    if (ancestor.className.includes('mainTreeRoot')) {
      return cursorTargetProject
    }
    cursorTargetProject = ancestor
  }

  return cursorTargetProject.nextElementSibling
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

  return cursorTarget.className.includes('mainTreeRoot')
    ? project
    : cursorTarget
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

if (typeof module !== 'undefined') {
  module.exports = {
    moveCursorLeft,
    moveCursorRight,
    moveCursorDown,
    moveCursorUp
  }
}

