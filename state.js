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
