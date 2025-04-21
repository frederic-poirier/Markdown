const editor = document.getElementById("editor");
const blockOptions = {
    "Heading 1": { tag: "h1", label: "Heading 1" },
    "Heading 2": { tag: "h2", label: "Heading 2" },
    "To-do":     { tag: "input", type: "checkbox" },
    "Ordered List": { tag: "ol", label: "Ordered List" },
  };

function setCaretPosition(node, method, position) {
      if (!node) throw new Error("Node does not exist");
      let range = document.createRange();
      let sel = window.getSelection();

      
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

const isWhitespaceOrPunct = (char) => !char || /\s|[.,!?;:'"(){}[\]]/.test(char);


editor.addEventListener("keydown", (event) => {
    if (event.key === "/") openCommandPalette(event);
});

editor.addEventListener("beforeinput", (event) => {
    const data = event.data;
    const caretPosition = getCaretPosition();
    const node = caretPosition.container;
    const offset = caretPosition.offset;

    if (data === " " && node.textContent.startsWith("-") && offset === 1) add(node, "UL")
    if (data === " " && node.textContent.startsWith("1.") && offset === 2) add(node, "OL")
})

function add(node, type) {
    const list = document.createElement(type);
    const li = document.createElement("li");
    list.appendChild(li);
    if (node.textContent.length > 1) {
        li.textContent = node.textContent.slice(2);
    }
    node.parentNode.replaceWith(list);
}

function openCommandPalette(event) {
    let selection = window.getSelection();
    let node = selection.focusNode;
    let offset = selection.focusOffset;
    event.preventDefault();
    insertBlockChooser(node, offset);
    console.log(getCaretCoordinates())
    
}

const datalist = document.createElement("datalist");
datalist.id = "block-options";

for (const key in blockOptions) {
  const option = document.createElement("option");
  option.value = key;
  datalist.appendChild(option);
}

document.body.appendChild(datalist);

function insertBlockChooser(node, offset) {
    const range = document.createRange();

    const input = document.createElement("input");
    input.setAttribute("list", "block-options");
    input.setAttribute("placeholder", "/...");
  
    range.setStart(node, offset);
    range.insertNode(input);
    input.focus();
  
    // One-time event listener
    input.addEventListener("change", () => {
      const selected = input.value;
      const config = blockOptions[selected];
      console.log('mamamia!')
  
      if (config) {
        let newNode;
        if (config.tag === "input" && config.type === "checkbox") {
          newNode = document.createElement("div");
          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          newNode.appendChild(checkbox);
          newNode.append(" To-do");
        } else if (config.tag === "img") {
          newNode = document.createElement("img");
          newNode.src = config.src;
          newNode.alt = selected;
          newNode.style.maxWidth = "100px";
        } else if (config.tag === "a") {
          newNode = document.createElement("a");
          newNode.href = config.href;
          newNode.textContent = config.text;
          newNode.target = "_blank";
        } else {
          newNode = document.createElement(config.tag);
        }
  
        newNode.appendChild(document.createElement("br")); // Add a line break after the new node
        input.parentNode.after(newNode); // Insert new node after input
        setCaretPosition(newNode, 'setStart', 0);
        input.parentNode.childNodes.length > 1 ? input.remove() : input.parentNode.remove();
      }

    }, { once: true });
  }
  