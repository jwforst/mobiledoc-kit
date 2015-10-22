import { Editor } from 'content-kit-editor';
import Helpers from '../test-helpers';

const { module, test } = Helpers;

let editor, editorElement;

module('Acceptance: Editor - PostEditor', {
  beforeEach() {
    editorElement = $('<div id="editor"></div>')[0];
    $('#qunit-fixture').append($(editorElement));
  },
  afterEach() {
    if (editor) { editor.destroy(); }
  }
});

test('#insertSectionAtEnd inserts the section at the end', (assert) => {
  let newSection;
  const mobiledoc = Helpers.mobiledoc.build(({post, markupSection, marker}) => {
    newSection = markupSection('p', [marker('123')]);
    return post([markupSection('p', [marker('abc')])]);
  });
  editor = new Editor({mobiledoc});
  editor.render(editorElement);

  //precond
  assert.hasElement('#editor p:contains(abc)');
  assert.hasNoElement('#editor p:contains(123)');

  editor.run(postEditor => postEditor.insertSectionAtEnd(newSection));
  assert.hasElement('#editor p:eq(1):contains(123)', 'new section added at end');
});

test('#insertSection inserts after the cursor active section', (assert) => {
  let newSection;
  const mobiledoc = Helpers.mobiledoc.build(({post, markupSection, marker}) => {
    newSection = markupSection('p', [marker('123')]);
    return post([
      markupSection('p', [marker('abc')]),
      markupSection('p', [marker('def')])
    ]);
  });
  editor = new Editor({mobiledoc});
  editor.render(editorElement);

  //precond
  assert.hasElement('#editor p:eq(0):contains(abc)');
  assert.hasElement('#editor p:eq(1):contains(def)');
  assert.hasNoElement('#editor p:contains(123)');

  Helpers.dom.selectText('b', editorElement);

  editor.run(postEditor => postEditor.insertSection(newSection));
  assert.hasElement('#editor p:eq(0):contains(abc)', 'still has 1st section');
  assert.hasElement('#editor p:eq(1):contains(123)',
                    'new section added after active section');
  assert.hasElement('#editor p:eq(2):contains(def)', '2nd section -> 3rd spot');
});

test('#insertSection inserts at end when no active cursor section', (assert) => {
  let newSection;
  const mobiledoc = Helpers.mobiledoc.build(({post, markupSection, marker}) => {
    newSection = markupSection('p', [marker('123')]);
    return post([
      markupSection('p', [marker('abc')]),
      markupSection('p', [marker('def')])
    ]);
  });
  editor = new Editor({mobiledoc});
  editor.render(editorElement);

  //precond
  assert.hasElement('#editor p:eq(0):contains(abc)');
  assert.hasElement('#editor p:eq(1):contains(def)');
  assert.hasNoElement('#editor p:contains(123)');

  Helpers.dom.clearSelection();
  editor.run(postEditor => postEditor.insertSection(newSection));
  assert.hasElement('#editor p:eq(0):contains(abc)', 'still has 1st section');
  assert.hasElement('#editor p:eq(2):contains(123)', 'new section added at end');
  assert.hasElement('#editor p:eq(1):contains(def)', '2nd section -> same spot');
});

test('#insertSection can insert card, render it in display mode', (assert) => {
  const mobiledoc = Helpers.mobiledoc.build(({post, markupSection, marker}) => {
    return post([markupSection('p', [marker('abc')])]);
  });

  let displayedCard = false;
  let cards = [{
    name: 'sample-card',
    display: {
      setup() {
        displayedCard = true;
      }
    }
  }];

  editor = new Editor({mobiledoc, cards});
  editor.render(editorElement);

  editor.run(postEditor => {
    let cardSection = postEditor.builder.createCardSection('sample-card');
    postEditor.insertSection(cardSection);
  });

  assert.ok(displayedCard, 'rendered card in display mode');
});

test('#insertSection inserts card, can render it in edit mode using #editCard', (assert) => {
  const mobiledoc = Helpers.mobiledoc.build(({post, markupSection, marker}) => {
    return post([markupSection('p', [marker('abc')])]);
  });

  let displayedCard = false,
      editCard = false;
  let cards = [{
    name: 'sample-card',
    display: {
      setup() {
        displayedCard = true;
      }
    },
    edit: {
      setup() {
        editCard = true;
      }
    }
  }];

  editor = new Editor({mobiledoc, cards});
  editor.render(editorElement);

  editor.run(postEditor => {
    let cardSection = postEditor.builder.createCardSection('sample-card');
    postEditor.insertSection(cardSection);
    editor.editCard(cardSection);
  });

  assert.ok(editCard, 'rendered card in edit mode');
  assert.ok(!displayedCard, 'did not render in display mode');
});

test('after inserting a section, can use editor#editCard to switch it to edit mode', (assert) => {
  const mobiledoc = Helpers.mobiledoc.build(({post, cardSection}) => {
    return post([cardSection('sample-card')]);
  });

  let displayedCard = false,
      editedCard = false;
  let cards = [{
    name: 'sample-card',
    display: {
      setup() {
        displayedCard = true;
      }
    },
    edit: {
      setup() {
        editedCard = true;
      }
    }
  }];

  editor = new Editor({mobiledoc, cards});
  editor.render(editorElement);
  assert.ok(displayedCard, 'called display#setup');
  assert.ok(!editedCard, 'did not call edit#setup yet');

  displayedCard = false;
  const card = editor.post.sections.head;
  editor.editCard(card);

  assert.ok(editedCard, 'called edit#setup');
  assert.ok(!displayedCard, 'did not call display#setup again');
});

test('can call editor#displayCard to swtich card into display mode', (assert) => {
  const mobiledoc = Helpers.mobiledoc.build(({post, cardSection}) => {
    return post([cardSection('sample-card')]);
  });

  let displayedCard = false,
      editedCard = false;

  let cards = [{
    name: 'sample-card',
    display: {
      setup() {
        displayedCard = true;
      }
    },
    edit: {
      setup() {
        editedCard = true;
      }
    }
  }];

  editor = new Editor({mobiledoc, cards});
  editor.render(editorElement);

  assert.ok(displayedCard, 'precond - called display#setup');
  assert.ok(!editedCard, 'precond - did not call edit#setup yet');

  displayedCard = false;
  const card = editor.post.sections.head;
  editor.editCard(card);

  assert.ok(!displayedCard, 'card not in display mode');
  assert.ok(editedCard, 'card in edit mode');

  editedCard = false;

  editor.displayCard(card);

  assert.ok(displayedCard, 'card back in display mode');
  assert.ok(!editedCard, 'card not in edit mode');
});

test('#toggleMarkup adds markup by tag name', (assert) => {
  const mobiledoc = Helpers.mobiledoc.build(({post, markupSection, marker}) => {
    return post([
      markupSection('p', [marker('abc'), marker('def')])
    ]);
  });
  editor = new Editor({mobiledoc});
  editor.render(editorElement);

  //precond
  assert.hasNoElement('#editor strong');

  Helpers.dom.selectText('bc', editorElement, 'd', editorElement);
  editor.run(postEditor => postEditor.toggleMarkup('strong'));
  assert.hasElement('#editor strong:contains(bcd)');
});

test('#toggleMarkup removes markup by tag name', (assert) => {
  const mobiledoc = Helpers.mobiledoc.build(({post, markupSection, marker, markup}) => {
    const strong = markup('strong');
    return post([
      markupSection('p', [marker('a'), marker('bcde', [strong]), marker('f')])
    ]);
  });
  editor = new Editor({mobiledoc});
  editor.render(editorElement);

  //precond
  assert.hasElement('#editor strong:contains(bcde)');

  Helpers.dom.selectText('bc', editorElement, 'd', editorElement);
  editor.run(postEditor => postEditor.toggleMarkup('strong'));
  assert.hasNoElement('#editor strong:contains(bcd)', 'markup removed from selection');
  assert.hasElement('#editor strong:contains(e)', 'unselected text still bold');
});

test('#toggleMarkup does nothing with an empty selection', (assert) => {
  const mobiledoc = Helpers.mobiledoc.build(({post, markupSection, marker}) => {
    return post([
      markupSection('p', [marker('a')])
    ]);
  });
  editor = new Editor({mobiledoc});
  editor.render(editorElement);

  editor.run(postEditor => postEditor.toggleMarkup('strong'));

  assert.hasNoElement('#editor strong', 'strong not added, nothing selected');
});