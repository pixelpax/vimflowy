const stateClojure = (initialState = {}, stateChanged = () => {}) => {
  let s = initialState 

  return {
    set: stateReducer => {
      s = Object.assign({}, s, stateReducer(s))
      stateChanged()
    },
    get: () => Object.assign({}, s)
  }
}

if (typeof module !== 'undefined') {
  module.exports = stateClojure
}
