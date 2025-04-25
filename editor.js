const editor = document.getElementById("editor");
const menu = document.getElementById("menu");
const isWhitespaceOrPunct = (char) => !char || /\s|[.,!?;:'"(){}[\]]/.test(char);
let zwsNodes = [];
let zwsTimeout;


const formatEvent = ['formatBold', 'formatItalic', 'formatUnderline', 'formatRemove']
const blockEvent = ['insertParagraph', 'insertOrderedListItem', 'insertUnorderedListItem', 'insertHorizontalRule']

const componentDefinitions = {
    blocks: {
      paragraph: {
        tag: "p",
        md: "",
        caret: true,
        shortcut: null,
        attributes: {}
      },
      heading1: {
        tag: "h1",
        md: "# ",
        caret: true,
        shortcut: "# ",
        attributes: {}
      },
      heading2: {
        tag: "h2",
        md: "## ",
        caret: true,
        shortcut: "## ",
        attributes: {}
      },
      heading3: {
        tag: "h3",
        md: "### ",
        caret: true,
        shortcut: "### ",
        attributes: {}
      },
    },
  
    lists: {
      unordered: {
        tag: "ul",
        blockMd: "- ",
        shortcut: "- ",
        attributes: {},
        children: [
          {
            tag: "li",
            caret: true,
            attributes: {},
            content: ""
          }
        ]
      },
      ordered: {
        tag: "ol",
        blockMd: "1. ",
        shortcut: "1. ",
        attributes: {},
        children: [
          {
            tag: "li",
            caret: true,
            attributes: {},
            content: ""
          }
        ]
      },
      task: {
        tag: "ul",
        blockMd: "- [ ] ",
        shortcut: "[] ",
        attributes: {},
        children: [
          {
            tag: "li",
            attributes: {},
            children: [
              {
                tag: "input",
                attributes: { type: "checkbox" }
              },
              {
                tag: "label",
                caret: true,
              }
            ]
          }
        ]
      }
    },
  };
  
  function getFirst(a, b) {
    return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_PRECEDING ? b : a;
  }
  

editor.addEventListener("beforeinput", (event) => {
  const range = event.getTargetRanges()[0];
  const {startContainer, startOffset, endContainer, endOffset } = range;
  const data = event.data;
  const type = event.inputType;
  console.log(range)
  if (zwsNodes) scheduleZwsCleanup(zwsNodes);
  let node = startContainer.nodeType === 3 ? startContainer.parentNode : startContainer;
  
  if (!node.getAttribute("data-write") && range.collapsed) {
    let block = node.closest(".block > *");
    let writeNode = block.querySelector("[data-write='true']");
    console.log(writeNode.compareDocumentPosition(node))
    let position = getFirst(node, writeNode) === node ? 0 : writeNode.textContent.length;
    setCaretPosition(writeNode, "setStart", position);
  }

  if (data === "/" && range.collapsed) {
    const prev = isWhitespaceOrPunct(startContainer.textContent.charAt(startOffset - 1));
    const next = isWhitespaceOrPunct(startContainer.textContent.charAt(startOffset)); 
    if (prev && next) openCommand(range, event);
  }

  if (!range.collapsed && !formatEvent.includes(type)) rangeManager(event);
  if (blockEvent.includes(type)) blockManager(event);
})

function openCommand(range, event) {
  event.preventDefault();
  menu.showPopover();
}

function rangeManager(event) {
  const eventRange = event.getTargetRanges()[0];
  const {startContainer, startOffset, endContainer, endOffset } = eventRange;
  let action;

  if (startContainer !== endContainer) action = "internode";
  else if (startOffset === 0 && endOffset === endContainer.textContent.length && !event.data) action = "fullnode";
  else return;
  console.log(action)

  const range = document.createRange();
  range.setStart(startContainer, startOffset);
  range.setEnd(endContainer, endOffset);
  event.preventDefault();
  if (action === "internode") {
    range.deleteContents(); // Supprime le contenu sélectionné

    startContainer.textContent += (event.data || "") + endContainer.textContent;
    endContainer.remove(); // Supprime le nœud de fin
    setCaretPosition(startContainer, "setStart", event.data ? startOffset + 1 : startOffset);
  } else if (action === "fullnode") {
      const block = startContainer.parentNode.closest(".block > *");
      const previous = block.previousElementSibling.querySelector("[data-write='true']");
    if (previous && startContainer.textContent === "\u200B") {
      block.remove();
      setCaretPosition(previous, "setStart", previous.textContent.length);
    } else {
      console.log("add")
      startContainer.textContent = "\u200B";
      zwsNodes.push(startContainer);
      setCaretPosition(startContainer, "setStart", 1);
    }
  }
}

function blockManager(event) {
  const eventRange = event.getTargetRanges()[0];
  const {startContainer, startOffset, endContainer, endOffset } = eventRange;
  const block = startContainer.target.closest(".block > *");

  const blockType = block.getAttribute("data-type");
}




















function scheduleZwsCleanup(zwsNode) {
  clearTimeout(zwsTimeout);
  zwsTimeout = setTimeout(() => {
    zwsManager(zwsNode);
  }, 1000);
}

function zwsManager(zwsNodes) {
  zwsNodes.forEach(node => {
    if (node.textContent.length > 1) {
      let sel = window.getSelection();
      if (sel.focusNode === node) {
        let position = sel.focusOffset > node.textContent.indexOf("\u200B") ? sel.focusOffset - 1 : sel.focusOffset;
        node.textContent = node.textContent.replace(/\u200B/g, "");
        setCaretPosition(node, "setStart", position);
      } else {
        node.textContent = node.textContent.replace(/\u200B/g, "");
      }
      zwsNodes = zwsNodes.filter(n => n !== node);
    }
  });
}


  
  































// Caret management functions
  
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
  