const test = require('tape')
const {moveCursorDown} = require('../cursorMovement')
const stateClojure = require('../state')
const jsdom = require('jsdom')

const {JSDOM} = jsdom

test('move down from closed to a closed project below current target', t => {
  const dom = new JSDOM(`<!DOCTYPE html>
    <body>
      <div class="project" projectid="1"><div class="name"><div class="content" contenteditable>something</div></div></div>
      <div class="project" projectid="2"><div class="name"><div class="content" contenteditable>something else</div></div></div>
    </body>
  `)
  const state = stateClojure()
  state.set(() => ({anchorOffset: 0 }))

  moveCursorDown(state)(dom.window.document.querySelector('.project[projectid=\'1\']'))

  t.equal(state.get().cursorTarget.getAttribute('projectid'), '2')
  t.equal(state.get().anchorOffset, 0)

  t.end()
});

test('move down from open to a closed project child project', t => {
  const dom = new JSDOM(`<!DOCTYPE html>
    <body>
      <div class="project open" projectid="1">
        <div class="name"><div class="content" contenteditable>something</div></div>
        <div class="children">
          <div class="project" projectid="2"><div class="name"><div class="content" contenteditable>something else</div></div></div>
        </div>
      </div>
    </body>
  `)
  const state = stateClojure()
  state.set(() => ({anchorOffset: 0 }))

  moveCursorDown(state)(dom.window.document.querySelector('.project[projectid=\'1\']'))

  t.equal(state.get().cursorTarget.getAttribute('projectid'), '2')
  t.equal(state.get().anchorOffset, 0)

  t.end()
});
