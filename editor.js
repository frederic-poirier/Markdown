const editor = document.getElementById("editor");
const menu = document.getElementById("menu");
const arrow = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']
let savedX = null;
let editablesNodes = Array.from(document.querySelectorAll("[data-editable]"));
const isWhitespaceOrPunct = (char) => !char || /\s|[.,!?;:'"(){}[\]]/.test(char);


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
 
function addList(event, type, attribute) {
  event.preventDefault();
  const range = event.getTargetRanges()[0];
  const startContainer = range.startContainer;
  const list = document.createElement(type);
  const listItem = document.createElement("li");
  listItem.innerHTML = '<br>';
  list.appendChild(listItem);
  listItem.textContent = startContainer.textContent.slice(range.startOffset, startContainer.textContent.length);
  startContainer.parentNode.replaceWith(list);
  if(attribute) list.classList.add("list");
}


editor.addEventListener("keydown", (event) => {
  if (arrow.includes(event.key)) {
    let selection = window.getSelection();
    let offset = selection.focusOffset;
    let end = selection.focusNode?.length;
    if (event.key === "ArrowLeft" && offset === 0) caretManager(selection, event, "left")
    if (event.key === "ArrowRight" && offset === end) caretManager(selection, event, "right")
    if (event.key === "ArrowUp") caretManager(selection, event, "up")
    if (event.key === "ArrowDown") caretManager(selection, event, "down")
  }
})

function insertManager(event) {
}

function rangeManager(event) {
  console.log('a faire lol')
}

function caretManager(selection, event, direction) {
  console.log('edge:', edge(selection, direction))
}

function getCaretRect(selection) {
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  const caretRect = {
    top: rect.top + window.scrollY,
    left: rect.left + window.scrollX,
    width: rect.width,
    height: rect.height,
  };
  console.log('getCaretRect:', caretRect);
  return caretRect;
}

function getNextNode(selection, direction) {
  let node = selection.focusNode.parentNode;
  let index = editablesNodes.indexOf(node);
  console.log('getNextNode: index:', index, 'direction:', direction);
  return direction === "up" ? editablesNodes[index - 1] : editablesNodes[index + 1]
}


function edge(selection, direction) {
  if (!selection || selection.rangeCount === 0) return;
  const range = selection.getRangeAt(0);
  const caretRects = range.getClientRects();
  if (caretRects.length === 0) return;
  const caretRect = caretRects[0];
  const containerRect = selection.focusNode.parentNode.closest('[data-editable]').getBoundingClientRect();
  console.log(selection.focusNode.parentNode)
  const tolerance = 2;

  console.log(containerRect)

 if (direction === "up") {
      if (Math.abs(caretRect.top - containerRect.top) <= tolerance) {
          console.log("Le caret est sur le bord supérieur du conteneur.");
          return true;
      }
  } else if (direction === "down") {
      if (Math.abs(caretRect.bottom - containerRect.bottom) <= tolerance) {
          console.log("Le caret est sur le bord inférieur du conteneur.");
          return true;
      }
  }

  // Si aucune des conditions ci-dessus n'est remplie
  return false;
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
  