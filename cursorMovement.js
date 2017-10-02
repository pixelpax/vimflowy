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

  if (!cursorTarget.childNodes.length) {
    cursorTarget.append(' ')
  }

  const selection = window.getSelection()
  const textNode = cursorTarget.childNodes[0]
  const range = document.createRange()
  range.setStart(textNode, Math.min(anchorOffset, textNode.length - 1))
  range.collapse(true)
  selection.removeAllRanges()
  selection.addRange(range)
  selection.modify('extend', 'right', 'character')
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

const setCursorAt = (offset, insertCursor = false) => {
  const selection = document.getSelection()
  const {anchorOffset, baseNode} = selection
  let effectiveOffset = offset

  if (typeof offset === 'function') {
    effectiveOffset = offset(anchorOffset, baseNode)
  }

  if (effectiveOffset === anchorOffset) {
    return
  }

  effectiveOffset = Math.min(effectiveOffset, insertCursor
    ? baseNode.length
    : baseNode.length - 1)
  effectiveOffset = Math.max(effectiveOffset, 0)

  state.set(_ => ({
    anchorOffset: effectiveOffset
  }))

  const range = document.createRange()
  range.setStart(baseNode, effectiveOffset)
  range.collapse(true)
  selection.removeAllRanges()
  selection.addRange(range)
  if (!insertCursor) {
    selection.modify('extend', 'right', 'character')
  }
  baseNode.parentElement.focus()
}

const moveCursorToStart = setCursorAt.bind(null, 0, true) 
const moveCursorToEnd = setCursorAt.bind(null, (_, baseNode) => baseNode.length, true)
const moveCursorLeft = setCursorAt.bind(null, anchorOffset => anchorOffset - 1, false)
const moveCursorRight = setCursorAt.bind(null, anchorOffset => anchorOffset + 1, false)

if (typeof module !== 'undefined') {
  module.exports = {
    moveCursorLeft,
    moveCursorRight,
    moveCursorDown,
    moveCursorUp
  }
}
