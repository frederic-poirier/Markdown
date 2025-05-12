const editor = document.getElementById("editor");
const menu = document.getElementById("menu");
const arrow = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']
 let height = window.visualViewport.height;
      const viewport = window.visualViewport;
let savedX = null;
let editablesNodes = Array.from(document.querySelectorAll("[data-editable]"));
const isWhitespaceOrPunct = (char) => !char || /\s|[.,!?;:'"(){}[\]]/.test(char);

const components = {
  'Heading 1': {
    tag: 'h1',
    attribute: null,
    shorcut: '# ',
    markdown: '# ',
    editable: true,
    onEnter: 'regular',
  },
  'Heading 2': {
    tag: 'h2',
    attribute: null,
    shorcut: '## ',
    markdown: '## ',
    editable: true,
    onEnter: 'regular',
  },
  'Heading 3': {
    tag: 'h3',
    attribute: null,
    shorcut: '### ',
    markdown: '### ',
    editable: true,
    onEnter: 'regular',
  },
  'Paragraph': {
    tag: 'p',
    attribute: null,
    shorcut: '',
    markdown: '',
    editable: true,
    onEnter: 'regular',
  },
  'Ordered List': {
    tag: 'ol',
    attribute: null,
    shorcut: '1. ',
    markdown: '1. ',
    child: {
      tag: 'li',
      attribute: null,
      editable: true,
      onEnter: 'list-item',
    }
  },
  'Unordered List': {
    tag: 'ul',
    attribute: null,
    shorcut: '- ',
    markdown: '- ',
    child: {
      tag: 'li',
      attribute: null,
      editable: true,
      onEnter: 'list-item',
    }
  },
  'Checkbox List': {
    tag: 'ul',
    attribute: 'checkbox',
    shorcut: '[]',
    markdown: '[]',
    child: {
      tag: 'li',
      attribute: 'data-list',
      child: [
        {
          tag: 'input',
          attribute: { type: 'checkbox' },
        },
        {
          tag: 'p',
          attribute: null,
          onEnter: 'list-item',
          editable: true,
        }
      ]
    }
  }
}


function insertManager(event) {
}

function rangeManager(event) {
}



let savedCaretX = null;

function caretManager(event) {
  let selection = window.getSelection();
  let node = selection.focusNode.nodeType === Node.TEXT_NODE ? selection.focusNode.parentNode : selection.focusNode;
  node = node.closest("[data-editable]")
  let direction = event.key === "ArrowUp" || event.key === "ArrowLeft" ? "up" : event.key === "ArrowDown" || event.key === "ArrowRight" ? "down" : null;  
  let next = getNextNode(node, direction);
  if (event.key === "ArrowLeft" || event.key === "ArrowRight" || savedCaretX === null) savedCaretX = selection.getRangeAt(0).getBoundingClientRect().x;
  if (event.key === "ArrowLeft" && selection.focusNode === node.firstChild && selection.focusOffset === 0 && next) {
    if (event.shiftKey) setCaret(next, 'end', true);
    else setCaret(next, 'end');
  } else if (event.key === "ArrowRight" && selection.focusNode === node.lastChild && selection.focusOffset === node.lastChild.length && next) {
    if (event.shiftKey) setCaret(next, 'start', true);
    else setCaret(next, 'start');
  }
  requestAnimationFrame(() => {
    let newSelection = window.getSelection();
    let newNode = newSelection.focusNode.nodeType === Node.TEXT_NODE ? newSelection.focusNode.parentNode : newSelection.focusNode;

    if (node === newNode || node.contains(newNode)) return
    console.log(node, newNode)
    if ((event.key === "ArrowUp" || event.key === "ArrowDown") && next) {
      let rect = next.getBoundingClientRect();
      let y = event.key === "ArrowDown" ? rect.top + 1 : rect.bottom - 1; 
      if (event.shiftKey) setCaret(next, { x: savedCaretX, y: y }, true);
      else setCaret(next, { x: savedCaretX, y: y });
    }
    })
}

editor.addEventListener("keydown", (event) => {
  if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') savedCaretX = null
  if (arrow.includes(event.key)) caretManager(event)
});

document.addEventListener("mouseup", (event) => {
  let selection = window.getSelection();
  if (selection.rangeCount === 0) return
  let node = selection.focusNode.nodeType === Node.TEXT_NODE ? selection.focusNode.parentNode : selection.focusNode;
  if (!selection.isCollapsed) return
  if (!node.closest("[data-editable]")) {
    let block = node?.closest('.block > *')
    if (block) {
      let newNode = block.hasAttribute('data-editable') ? block : block.querySelector("[data-editable]")
      if (!newNode) return selection
      setCaret(newNode, {x: event.clientX, y: event.clientY})
    }
  }
})

function getNextNode(element, direction) {
  let node = element.closest("[data-editable]");
  let index = editablesNodes.indexOf(node);
  return direction === "up" ? editablesNodes[index - 1] : editablesNodes[index + 1]
}

// Parcourt tous les TextNodes de root et renvoie le TextNode et l’offset correspondant à la position donnée
function findTextNodeAtPosition(root, position) {
  let count = 0
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null)
  while (walker.nextNode()) {
    const node = walker.currentNode
    const len = node.length
    if (count + len >= position) {
      return { node, offset: position - count }
    }
    count += len
  }
  return null
}

function setCaret(root, position, extend = false) {
  if (!root) throw new Error("No root element");
  const sel = window.getSelection();
  // si on étend, on mémorise l’ancre actuelle
  let anchorNode, anchorOffset;
  if (extend && sel.rangeCount) {
    anchorNode   = sel.anchorNode;
    anchorOffset = sel.anchorOffset;
  }

  const range = document.createRange();
  // — gestion start/end
  if (position === 'start' || position === 'end') {
    const nodes = Array.from(root.childNodes);
    if (position === 'start') {
      const first = nodes[0];
      if (nodes.length === 1 && first.tagName === 'BR') range.setStartAfter(first);
      else if (first.nodeType === Node.TEXT_NODE) range.setStart(first, 0);
      else range.setStartBefore(first);
    } else {
      const last = nodes[nodes.length - 1];
      if (last && last.tagName === 'BR') range.setStartAfter(last);
      else if (last && last.nodeType === Node.TEXT_NODE) range.setStart(last, last.length);
      else if (last) range.setStartAfter(last);
      else range.setStart(root, 0);
    }
  }
  // — gestion offset numérique
  else if (typeof position === 'number') {
    const found = findTextNodeAtPosition(root, position);
    if (found) range.setStart(found.node, found.offset);
    else if (position <= 0) return setCaret(root, 'start', extend);
    else return setCaret(root, 'end', extend);
  }
  // — gestion coordonnées
  else if (position && position.x != null && position.y != null) {
    const rect = root.getBoundingClientRect();
    const x = Math.min(Math.max(position.x, rect.left),  rect.right - 1);
    const y = Math.min(Math.max(position.y, rect.top),   rect.bottom - 1);
    const posInfo = document.caretPositionFromPoint(x, y);
    if (posInfo) range.setStart(posInfo.offsetNode, posInfo.offset);
    else return setCaret(root, 'start', extend);
  }

  // on fixe le point actif
  range.collapse(true);

  if (extend && anchorNode) {
    // on rétablit l’ancre puis on étend jusqu’à la nouvelle position
    sel.collapse(anchorNode, anchorOffset);
    sel.extend(range.startContainer, range.startOffset);
  } else {
    sel.removeAllRanges();
    sel.addRange(range);
  }
}



