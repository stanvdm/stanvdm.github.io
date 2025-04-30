function setCursor(lines, cursorPos) {
    const currentLine = document.querySelector(`.selected`);
    if(currentLine) currentLine.classList.toggle('selected');
    lines[cursorPos.y].classList.toggle('selected');

    const currentCursor = document.querySelector(`#cursor`);
    if(currentCursor) currentCursor.replaceWith(...currentCursor.childNodes);

    setCursorNthCharInLine(lines[cursorPos.y], cursorPos.x);
}

function setCursorNthCharInLine(line, n) {
    const walker = document.createTreeWalker(line, NodeFilter.SHOW_TEXT);
    let node;
    let totalLen = 0;
    while(node = walker.nextNode()) {
        const nodeLen = node.nodeValue.length;

        if(totalLen + nodeLen > n) {
            const i = n - totalLen;

            const before = node.nodeValue.substring(0, i);
            const char = node.nodeValue.charAt(i);
            const after = node.nodeValue.substring(i + 1);

            const nodeWithCursor = document.createElement("div");
            nodeWithCursor.innerHTML = `${before}<span id="cursor">${char}</span>${after}`;
            node.replaceWith(...nodeWithCursor.childNodes);
        }

        totalLen += nodeLen;
    }
}

function updateBottomBar(cursorPos, fileLen) {
    document.querySelector(`.cursor-info`).innerHTML = `${cursorPos.y + 1},${cursorPos.x + 1} All`
}

function main() {
    const lines = document.querySelectorAll(`section > *`);
    const cursorPos = { x: 0, y: 0 };
    setCursor(lines, cursorPos);
    
    window.addEventListener("keydown", function(e) {
        switch(e.key) {
            case 'j':
                cursorPos.y = Math.min(cursorPos.y + 1, lines.length - 1);
                setCursor(lines, cursorPos);
                break;
            case 'k':
                cursorPos.y = Math.max(cursorPos.y - 1, 0);
                setCursor(lines, cursorPos);
                break;
            case 'h':
                cursorPos.x = Math.max(cursorPos.x - 1, 0);
                setCursor(lines, cursorPos);
                break;
            case 'l':
                cursorPos.x = Math.min(cursorPos.x + 1, lines[cursorPos.y].textContent.length - 1);
                setCursor(lines, cursorPos);
                break;
            case 'j':
                cursorPos.y = 0;
                setCursor(lines, cursorPos);
                break;
        }
        updateBottomBar(cursorPos, lines.length);
    });
}

document.addEventListener("DOMContentLoaded", main);