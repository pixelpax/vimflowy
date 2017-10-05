const test = require('tape')
const {moveCursorDown} = require('../cursorMovement')
const jsdom = require('jsdom')

const {JSDOM} = jsdom

test('move down from closed to a closed project below current target', t => {
  const dom = new JSDOM(`<!DOCTYPE html>
    <body>
      <div class="project" projectid="1"><div class="name"><div class="content" contenteditable data-test="cursor">something</div></div></div>
      <div class="project" projectid="2"><div class="name"><div class="content" contenteditable>something else</div></div></div>
    </body>
  `)

  const cursorTarget = moveCursorDown(dom.window.document.querySelector(`div[data-test='cursor']`))

  t.equal(cursorTarget.getAttribute('projectid'), '2')

  t.end()
});

test('move down from open to a closed project child project', t => {
  const dom = new JSDOM(`<!DOCTYPE html>
    <body>
      <div class="project open" projectid="1">
        <div class="name"><div class="content" contenteditable data-test="cursor">something</div></div>
        <div class="children">
          <div class="project" projectid="2"><div class="name"><div class="content" contenteditable>something else</div></div></div>
        </div>
      </div>
    </body>
  `)

  const cursorTarget = moveCursorDown(dom.window.document.querySelector(`div[data-test='cursor']`))

  t.equal(cursorTarget.getAttribute('projectid'), '2')

  t.end()
});

test('move from open project\'s children to next closed project', t => {
  const dom = new JSDOM(`<!DOCTYPE html>
    <body>
      <div class="project open" projectid="1">
        <div class="name"><div class="content" contenteditable>something</div></div>
        <div class="children">
          <div class="project" projectid="2"><div class="name"><div class="content" data-test="cursor" contenteditable>something else</div></div></div>
        </div>
      </div>
      <div class="project" projectid="3"><div class="name"><div class="content" contenteditable>end here</div></div></div>
    </body>
  `)

  const cursorTarget = moveCursorDown(dom.window.document.querySelector(`div[data-test='cursor']`))

  t.equal(cursorTarget.getAttribute('projectid'), '3')

  t.end()
});

test('move from open project\'s children to next closed project two levels above', t => {
  const dom = new JSDOM(`<!DOCTYPE html>
    <body>
      <div class="project open" projectid="1">
        <div class="name"><div class="content" contenteditable>something</div></div>
        <div class="children">
          <div class="project open" projectid="2">
            <div class="name"><div class="content"contenteditable>something else</div></div>
            <div class="children">
              <div class="project" projectid="3"><div class="name"><div class="content" data-test="cursor" contenteditable>cursor here</div></div></div>
            </div>
          </div>
        </div>
      </div>
      <div class="project" projectid="4"><div class="name"><div class="content" contenteditable>end here</div></div></div>
    </body>
  `)

  const cursorTarget = moveCursorDown(dom.window.document.querySelector(`div[data-test='cursor']`))

  t.equal(cursorTarget.getAttribute('projectid'), '4')

  t.end()
});

test('should return the same element if sibling projects cannot be found', t => {
  const dom = new JSDOM(`<!DOCTYPE html>
    <body>
      <div class="mainTreeRoot project">
        <div class="project" projectid="4"><div class="name"><div class="content" contenteditable data-test="cursor">end here</div></div></div>
      </div>
    </body>
  `)

  const cursorTarget = moveCursorDown(dom.window.document.querySelector(`div[data-test='cursor']`))

  t.equal(cursorTarget.getAttribute('projectid'), '4')

  t.end()
});

test('should return the same element if sibling projects cannot be found', t => {
  const dom = new JSDOM(`<!DOCTYPE html>
    <body>
      <div class="mainTreeRoot project">
        <div class="project open" projectid="1">
          <div class="name"><div class="content" contenteditable>start</div></div>
        </div>
        <div class="children">
          <div class="project" projectid="2"> <div class="name"><div class="content" data-test="cursor" contenteditable>start</div></div> </div>
        </div>
      </div>
    </body>
  `)

  const cursorTarget = moveCursorDown(dom.window.document.querySelector(`div[data-test='cursor']`))

  t.equal(cursorTarget.getAttribute('projectid'), '2')

  t.end()
});
