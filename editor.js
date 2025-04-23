const editor = document.getElementById("editor");
const isWhitespaceOrPunct = (char) => !char || /\s|[.,!?;:'"(){}[\]]/.test(char);
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
      heading4: {
        tag: "h4",
        md: "#### ",
        caret: true,
        shortcut: "#### ",
        attributes: {}
      },
      heading5: {
        tag: "h5",
        md: "##### ",
        caret: true,
        shortcut: "##### ",
        attributes: {}
      },
      heading6: {
        tag: "h6",
        md: "###### ",
        caret: true,
        shortcut: "###### ",
        attributes: {}
      },
      codeBlock: {
        tag: "pre",
        blockMd: "```",
        mdClose: "```",
        shortcut: "```",
        caret: true,
        attributes: {},
      },
      blockquote: {
        tag: "blockquote",
        blockMd: "> ",
        caret: true,
        shortcut: "> ",
        attributes: {}
      },
      horizontalRule: {
        tag: "hr",
        md: "---",

        shortcut: "---",
        selfClosing: true,
        attributes: {}
      }
    },
  
    inlines: {
      bold: {
        tag: "b",
        md: "**",
        attributes: {}
      },
      italic: {
        tag: "i",
        md: "*",
        attributes: {}
      },
      code: {
        tag: "u", // Note: en général <code> et non <u> pour inline code
        md: "`",
        attributes: {}
      },
      link: {
        tag: "a",
        md: "[text](url)",
        attributes: { href: "" }
      }
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
        blockMd: "[ ] ",
        attributes: { "data-type": "task-list" },
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
  
    dynamics: {
      mention: {
        tag: "span",
        md: "@",
        attributes: { "data-type": "mention" },
        js: {
          onMount: "initMention"
        }
      },
      image: {
        tag: "img",
        md: "![alt](src)",
        selfClosing: true,
        attributes: {
          src: "",
          alt: ""
        }
      },
      embed: {
        tag: "div",
        md: "{{embed:url}}",
        attributes: {
          "data-url": ""
        },
        js: {
          onMount: "loadEmbed"
        }
      }
    }
  };
  

editor.addEventListener("beforeinput", (event) => {
    const data = event.data;
    const range = event.getTargetRanges()[0];
    const node = range.startContainer;
    const startOffset = range.startOffset;
    const endOffset = range.endOffset;

    let prevChar = isWhitespaceOrPunct(node?.textContent.charAt(startOffset - 1));
    let nextChar = isWhitespaceOrPunct(node?.textContent.charAt(startOffset));

    console.log(node)
    if (node.textContent.length > 1 && startOffset === 0 && endOffset === node.textContent.length && !data) node.textContent = "/u200b";
    if (node.textContent.indexOf("\u200b") !== -1) node.textContent = node.textContent.replace(/\u200b/g, "");
    if (data === "/" && nextChar && prevChar) openCommandPalette(event)
    if (data === " ") {
        if (!node || node.nodeType !== Node.TEXT_NODE) return;
        const text = node.textContent.slice(0, startOffset) + data;
        const match = matchShortcut(text);
      
        if (match) {
          event.preventDefault();
          const newNode = renderComponent(match.def);
          node.parentNode.replaceWith(newNode);
        }
    }

})



function matchShortcut(text) {
    const categories = ['blocks', 'lists']; // Les catégories à analyser
    for (const category of categories) {
      const defs = componentDefinitions[category];
      for (const key in defs) {
        const def = defs[key];
        const shortcut = def.shortcut || def.blockMd || def.md;
        if (shortcut && text.startsWith(shortcut)) {
          return { def, category, key };
        }
      }
    }
    return null;
  }
  

  function renderComponent(def) {
    const el = document.createElement(def.tag);
  
    if (def.attributes) {
      for (const [key, value] of Object.entries(def.attributes)) {
        if (value !== undefined) el.setAttribute(key, value);
      }
    }
  
    if (def.selfClosing) return el;
  
    // Render children recursively
    if (def.children && def.children.length > 0) {
      for (const childDef of def.children) {
        const child = renderComponent(childDef);
        el.appendChild(child);
      }
    }
  
    // Add placeholder content if needed
    if (!el.hasChildNodes() && !def.children && !def.selfClosing) {
      el.innerHTML = def.content || "";
    }
  
    // Place caret at the end with a final <br>
    if (def.caret) {
      const zws = document.createTextNode("\u200B"); // Zero-width space
      el.appendChild(zws);
  
      const range = document.createRange();
      console.log("el", el)
      console.log("el.lastChild", el.lastChild)
      range.setStart(zws, 1);
      console.log('I set the caret after the last child')
    }
  
    return el;
  }
  






  const isEmptyNode = (el) => {
    if (!el || el.nodeType !== 1) return false;
  
    const text = el.textContent.trim();
    const children = [...el.children];
    const onlyBr = children.length === 1 && children[0].tagName === 'BR';
    const onlyBrAndInput = (
      children.length === 2 &&
      children.some(c => c.tagName === 'BR') &&
      children.some(c => c.tagName === 'INPUT')
    );
  
    return !text && (onlyBr || onlyBrAndInput);
  };
  
  const updatePlaceholderClass = (el) => {
    if (!el || !el.closest('[contenteditable]')) return;
  
    if (isEmptyNode(el)) {
      el.classList.add('placeholder');
    } else {
      el.classList.remove('placeholder');
    }
  };
  
  const observer = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
      const targets = new Set();
  
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) targets.add(node);
        });
        targets.add(mutation.target);
      }
  
      if (mutation.type === 'characterData') {
        targets.add(mutation.target.parentNode);
      }
  
      targets.forEach(updatePlaceholderClass);
    }
  });
  
  // Start observing
  const root = document.querySelector('[contenteditable]');
  observer.observe(root, { childList: true, characterData: true, subtree: true });
  
  // Initial pass
  [...root.querySelectorAll('*')].forEach(updatePlaceholderClass);
  
  































// Caret management functions
  
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
  