const searchCommand = () => {
  const searchBox = document.getElementById('searchBox')
  searchBox.className += ' evenDirtierSearchHack'

  searchBox.focus()
}

const searchBox = (setState, getState, calculateOffset) => {
  document.getElementsByClassName('searchBox*').addEventListener('focus', event => {
  //document.getElementById('searchBox').addEventListener('focus', event => {
    if (event.sourceCapabilities) {
      return
    }

    if (event.target.className.includes('evenDirtierSearchHack')) {
      event.target.className = event.target.className.replace('evenDirtierSearchHack', '').trim()

      return
    }

    debug('dirty escape search hack')
    setCursorAfterVerticalMove(calculateOffset, projectAncestor(event.relatedTarget))
  })

  document.getElementById('searchBox').addEventListener('keydown', event => {
    if (event.keyCode !== 13) {
      window.clearTimeout(getState().searchFocusRetryTimeout)

      return
    }

    event.preventDefault()

    const focusFirstSearchResult = () => {
      const firstMatch = document.querySelector('.searching .mainTreeRoot .project')
      if (firstMatch) {
        setCursorAfterVerticalMove(calculateOffset, firstMatch)
      }

      return Boolean(firstMatch)
    }

    const keepTrying = callback => {
      debug('trying to focus first search result')
      if (callback()) {
        return
      }

      const searchFocusRetryTimeout = window.setTimeout(() => {
        setState(s => ({searchFocusRetryTimeout: null}))
        keepTrying(callback)
      }, 200)
      setState(s => ({searchFocusRetryTimeout}))
    }

    keepTrying(focusFirstSearchResult)
  })
}

