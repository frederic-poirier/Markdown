const editor = document.getElementById("editor");
const menu = document.getElementById("menu");
const arrow = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']
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


editor.addEventListener("beforeinput", (event) => {
  const selection = window.getSelection();
  const range = event.getTargetRanges()[0];
  const startContainer = range.startContainer;
  const offset = range.startOffset;

  if (event.data === " " && startContainer.textContent.startsWith("[]") && offset === 2) return addList(event, "ul", "checkbox")
  if (event.data === " " && startContainer.textContent.startsWith("-") && offset === 1) return addList(event, "ul")
  if (event.data === " " && startContainer.textContent.startsWith("1.") && offset === 2) return addList(event, "ol")
  if (startContainer.textContent.startsWith("1.")) return addList(event, "ol")
  if (startContainer.textContent.startsWith("- ")) return addList(event, "ul")
  if (event.inputType === "insertParagraph" && startContainer.parentNode.nodeName === "LI") {
   if (startContainer.parentNode.parentNode?.getAttribute("data-type") === "checkbox") {
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      startContainer.parentNode.appendChild(checkbox);
    }
  }

  if (event.data === "/") openMenu(event)


})

function openMenu(event) {

  const range = document.createRange();
  const eventRange = event.getTargetRanges()[0];
  const span = document.createElement("span");
  span.innerText = event.data;
  span.classList.add("menu-search");
  event.preventDefault();
  range.setStart(eventRange.startContainer, eventRange.startOffset);
  range.insertNode(span);
  setCaretPosition(span, "setStart", 1);

  menu.showPopover();
}

editor.addEventListener("keydown", (event) => {
  if (arrow.includes(event.key)) caretManager(event)
});



function insertManager(event) {
}

function rangeManager(event) {
}



let savedCaretX = null;

function caretManager(event) {
  let selection = window.getSelection();
  let node = selection.focusNode.nodeType === Node.TEXT_NODE ? selection.focusNode.parentNode : selection.focusNode;
  let direction = event.key === "ArrowUp" || event.key === "ArrowLeft" ? "up" : event.key === "ArrowDown" || event.key === "ArrowRight" ? "down" : null;  
  let next = getNextNode(node, direction);
  if (event.key === "ArrowLeft" || event.key === "ArrowRight" || savedCaretX === null) {
    savedCaretX = selection.getRangeAt(0).getBoundingClientRect().x;
  }

  requestAnimationFrame(() => {
    let newSelection = window.getSelection();
    let newNode = newSelection.focusNode.nodeType === Node.TEXT_NODE ? newSelection.focusNode.parentNode : newSelection.focusNode;
    console.log(newNode, node, next)
    if (newNode.hasAttribute("data-editable") || newNode.closest("[data-editable]")) return;
    console.log('passed!')
    if (event.key === "ArrowUp" || event.key === "ArrowDown" && next) {
      console.log(next)
      let rect = next.getBoundingClientRect();
      let y = event.key === "ArrowUp" ? rect.top + 1 : rect.bottom - 1;
      let clampedX = Math.max(rect.left, Math.min(savedCaretX, rect.right));
      let range = document.caretPositionFromPoint(clampedX, y);
      
      console.log(range)
      setCaretPosition(range.offsetNode, "setStart", range.offset);
    }
  })
}


function getNextNode(element, direction) {
  let node = element.closest("[data-editable]");
  let index = editablesNodes.indexOf(node);
  return direction === "up" ? editablesNodes[index - 1] : editablesNodes[index + 1]
}






function setCaretPosition(node, method, position) {
    if (!node) throw new Error("Node does not exist");
    let range = document.createRange();
    let sel = window.getSelection();
    if (node.nodeType !== Node.TEXT_NODE) node = node.childNodes[0] || node;
    if (position > node.length) position = node.length;
    
    if (['setStart', 'setEnd'].includes(method)) {
      range[method](node, position);
    } else {
      range[method](node);
    }

    sel.removeAllRanges();
    sel.addRange(range);
    // editor.normalize();
}

function getCaretPosition() {
const sel = window.getSelection();
if (sel.rangeCount > 0) {
  const range = sel.getRangeAt(0);
  if (range.collapsed) {
    return { container: range.startContainer, offset: range.startOffset };
  }
  return {
    startContainer: range.startContainer,
    startOffset: range.startOffset,
    endContainer: range.endContainer,
    endOffset: range.endOffset,
  };
}
return null;
}
  