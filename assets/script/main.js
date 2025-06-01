async function fetchFileIndex(callback) {
    return fetch("/f/index.json").then(res => res.json()).then(json => callback(json));
}

/**
 * @param {HTMLElement} e
 * @param {HTMLElement} scrollContainer
 * @param {Boolean} includeMargins if true, will count element's scrollmargin in calculations
 */
function elementNotVisibleInScroll(e, scrollContainer, includeMargins=true) {
    const styles = getComputedStyle(e);
    const scrollMarginTop = Number(styles.scrollMarginTop.slice(0, -2)) || 0;
    const scrollMarginBottom = Number(styles.scrollMarginBottom.slice(0, -2)) || 0;

    const computedScrollMarginTop = (includeMargins && e.offsetTop > scrollMarginTop) ? scrollMarginTop : 0;
    const computedScrollMarginBottom = (includeMargins && e.offsetTop + e.clientHeight + scrollMarginBottom  < scrollContainer.scrollHeight) ? scrollMarginBottom : 0;

    const topBound = scrollContainer.scrollTop + computedScrollMarginTop;
    const bottomBound = scrollContainer.scrollTop + scrollContainer.clientHeight - computedScrollMarginBottom;

    if(e.offsetTop < topBound) return "top";
    if(e.offsetTop + e.clientHeight > bottomBound) return "bottom";
    return false;
}

/**
 * @param {HTMLElement} e
 * @param {HTMLElement} scrollContainer
 */
function scrollIntoViewIfNotVisible(e, scrollContainer) {
    const eNotVisible = elementNotVisibleInScroll(e, scrollContainer);

    if(eNotVisible === "top") e.scrollIntoView();
    if(eNotVisible === "bottom") e.scrollIntoView(false);
}

/**
 * @param {HTMLElement} scrollContainer
 * @param {boolean} [first=true] return first if true else return last
 * @param {Boolean} includeMargins if true, will count element's scrollmargin in calculations
 */
function getFirstLastVisibleElement(scrollContainer, first=true, inludeMargins=true) {
    const elements = scrollContainer.children;
    let last = null;

    for(let i = 0; i < elements.length; i++) {
        const e = elements[i];

        if(elementNotVisibleInScroll(e, scrollContainer, inludeMargins) === false) {
            if(first) return {e, i};
            last = i;
        }
    }

    return {e: elements[last], i: last};
}

/**
 * @param {Interpreter} interpreter
 */
function updateScrollEventListeners(interpreter) {
    interpreter.getAllVisibleBuffers().forEach(b => {
        b.getScrollContainer().addEventListener("scroll", (ev) => { 
            const scrollContainer = ev.currentTarget;
            const e  = scrollContainer.querySelector(`:scope > *:has(.cursor)`);
            const eNotVisible = elementNotVisibleInScroll(e, scrollContainer);

            if(eNotVisible === "top" || eNotVisible === "bottom") {
                const cursor = new Cursor(new Buffer(ev.currentTarget.parentElement, interpreter));
                const y = getFirstLastVisibleElement(scrollContainer, eNotVisible === "top").i;
                cursor.setY(y);
            }
        });
    });
}

/**
 * @param {Interpreter} interpreter
 */
function updateNotrwClickEventListeners(interpreter) {
    document.querySelectorAll(`section[data-type=notrw] p[data-path]`).forEach(p => {
        p.addEventListener("click", e => {
            const selectedPath = e.currentTarget.dataset.path;
            const buffer = interpreter.getAllVisibleBuffers().find(b => b.e.contains(e.currentTarget))
            const extension = fileExtensionFromPath(selectedPath);

            if(extension in BufferTypes) {
                BufferTypes[extension]?.special(buffer, selectedPath);
            } else {
                replaceBuffer(buffer, selectedPath);
            }
        });
    });
}

function fileExtensionFromPath(path) {
    return /(?<=\.)[a-zA-Z0-9]+$/.exec(path)?.at(0) || "";
}

function getFileDir(filePath) {
    return filePath.replace(/\/[^\/]*$/, "/");
}

/**
 * @param {String} path to file or dir
 * @param {Array<String>} classList classes to add to buffer element
 * @param {Function} parser if path leads to a file, the contents of the file is passed through the parser before being added to the html
 */
async function generateBuffer(path="/", classList=[], parser=f => f.split("\n").map(l => `<p>${l} </p>`).join("")) {
    const type = path.endsWith("/") ? "notrw" : fileExtensionFromPath(path);

    let body = `<p> </p>`;
    if(type === "notrw") {
        body = await fetchFileIndex(fi => {
            const files = fi.filter(f => f.file.startsWith(path)).reduce((prev, cur) => {
                const pathArr = cur.file.replace(path, '').split("/");
                const name = pathArr.length > 1 ? `${pathArr[0]}/` : pathArr[0];
                return {...prev, [name]: cur}
            }, {});

            return `
                <p>" ============================================================================</p>
                <p>" Notrw Directory Listing                                          (notrw v1)</p>
                <p>" ${path}</p>
                <p>" Sorted by name</p>
                <p>" Quick Help: <span class="highlight">&lt;F1&gt;</span>:help  -:go up dir  D:delete  R:rename  s:sort-by  x:special</p>
                <p>" ==============================================================================</p>
                <p data-path="${path.replace(/\/[^\/]+\/$/, "/")}"><span class="cursor" data-x="0" data-y="6">.</span>./</p>
                <p data-path="${path}">./</p>
                ${Object.entries(files).map(([k, v]) => `<p data-path="${path}${k}">${k}</p>`).join("")}`;
        });
    } else {
        body = await fetch(path).then(res => res.text()).then(f => {
            return parser(f);
        }).catch(_ => {
            return body;
        });
    }

    return `
        <section class="active ${classList.join(" ")}" data-path="${path}" data-type="${type}">
            <article>
                ${body}
            </article>
            <aside></aside>
        </section>`;
}

/**
 * @param {Buffer} oldBuffer
 * @param {String} path
 * @param {Array<String>} classList classes to add to buffer element
 * @param {Function} parser if path leads to a file, the contents of the file is passed through the parser before being added to the html
 */
async function replaceBuffer(oldBuffer, path, classList, parser=undefined) {
    document.querySelector(`.active`)?.classList.toggle("active");
    const nodeWithNewBuffer = document.createElement("div");
    nodeWithNewBuffer.innerHTML = await generateBuffer(path, classList, parser);
    oldBuffer.e.replaceWith(...nodeWithNewBuffer.childNodes);

    const newBuffer = new Buffer(document.querySelector(`.active`), oldBuffer.interpreter);
    newBuffer.renderStatusLine();
    newBuffer.cursor.render();

    updateScrollEventListeners(oldBuffer.interpreter);
    updateNotrwClickEventListeners(oldBuffer.interpreter);
}

/**
 * @param {Interpreter} interpreter
 * @param {String} path
 * @param {Array<String>} classList classes to add to buffer element
 * @param {Function} parser if path leads to a file, the contents of the file is passed through the parser before being added to the html
 */
async function openBuffer(interpreter, path, classList, parser=undefined) {
    document.querySelector(`.active`)?.classList.toggle("active");
    document.querySelector(`main`).innerHTML += await generateBuffer(path, classList, parser);

    const newBuffer = interpreter.getActiveBuffer();
    newBuffer.cursor.render();
    interpreter.render();

    updateScrollEventListeners(interpreter);
    updateNotrwClickEventListeners(interpreter);
}

function updateCommandLine(partialCommand) {
    const commandLine = document.querySelector(`footer`);
    commandLine.querySelector(`.partial-command`).innerHTML = `${partialCommand}`;
}

function calculateViewportPosition(viewport) {
    const percentage = Math.ceil((viewport.scrollTop + viewport.clientHeight) / viewport.scrollHeight * 100);
    if(viewport.scrollHeight <= viewport.clientHeight) return 'All';
    else if(viewport.scrollTop === 0) return 'Top';
    else if(percentage >= 100) return 'Bot';
    return percentage + '%';
}

function isFirstVisit() {
    const hasVisited = localStorage.getItem("hasVisited");
    if(hasVisited === null) {
        localStorage.setItem("hasVisited", 1);
        return true;
    }
    return false;
}

class Cursor {
    /**
     * @param {Buffer} buffer
     */
    constructor(buffer) {
        this.buffer = buffer;
        const currentCursor = this.getCurrentCursor();
        this.x = Number(currentCursor?.dataset?.x ?? 0);
        this.y = Number(currentCursor?.dataset?.y ?? 0);
    }

    setX(newX) {
        this.x = Math.min(Math.max(0, newX), this.getCurrentLine().textContent.length - 1);
        this.render();
    }

    setY(newY) {
        this.y = Math.min(Math.max(0, newY), this.buffer.getLines().length - 1);
        this.render();
    }

    getCurrentCursor() {
        return this.buffer.e.querySelector(`.cursor`);
    }

    getCurrentLine() {
        return this.buffer.e.querySelector(`article > *:has(.cursor)`);
    }

    derender() {
        const currentCursor = this.getCurrentCursor();
        if(currentCursor) currentCursor.replaceWith(...currentCursor.childNodes);
    }

    moveYPxDown(px) {
        let line = this.getCurrentLine();
        const startingYPx = line.offsetTop+ this.getCurrentCursor().getBoundingClientRect().bottom - line.getBoundingClientRect().top;
        const target = startingYPx + px;

        while(line.nextElementSibling) {
            if(line.offsetTop + line.clientHeight > target) {
                break;
            }
            this.y++;
            line = line.nextElementSibling;
        }
        this.render();
    }

    moveYPxUp(px) {
        let line = this.getCurrentLine();
        const startingYPx = line.offsetTop+ this.getCurrentCursor().getBoundingClientRect().bottom - line.getBoundingClientRect().top;
        const target = startingYPx - px;

        while(line.previousElementSibling) {
            if(line.offsetTop + line.clientHeight < target) {
                break;
            }
            this.y--;
            line = line.previousElementSibling;
        }
        this.render();
    }

    moveForwardToRegex(regex) {
        const lines = this.buffer.getLines();
        let i = lines[this.y].textContent.search(RegExp(`(?<=.{${this.x + 1}})` + regex.source));

        while(i < 0 && this.y < lines.length - 1) {
            this.y++; 
            const text = lines[this.y].textContent;
            i = text.search(regex);
            if(text.trim() === "") i = 0;
        }
        const lineLen = lines[this.y].textContent.length;
        this.x = i < lineLen && i >= 0 ? i : lineLen - 1;
        this.render();
    }

    moveBackwardToRegex(regex) {
        function searchBackward(string) {
            const re = !regex.flags.includes("g") ? RegExp(re.source, re.flags + "g") : regex;
            const matches = [...string.matchAll(re)];
            return matches.length > 0 ? matches[matches.length - 1].index : -1;
        }

        const lines = this.buffer.getLines();
        let i = searchBackward(lines[this.y].textContent.substring(0, this.x));

        while(i < 0 && this.y > 0) {
            this.y--; 
            const text = lines[this.y].textContent;
            i = searchBackward(text);
            if(text.trim() === "") i = 0;
        }
        const lineLen = lines[this.y].textContent.length;
        this.x = i < lineLen && i >= 0 ? i : lineLen - 1;
        this.render();
    }

    render() {
        this.derender();
        const line = this.buffer.getLines()[this.y];

        if(this.buffer.e.classList.contains("markdown")) {
            line.insertAdjacentHTML("afterbegin", `<span class="cursor" data-x="${this.x}" data-y="${this.y}"></span>`);
        } else {
            // put cursor on nth char in line
            const n = Math.min(line.textContent.length - 1, this.x);
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
                    nodeWithCursor.innerHTML = `${before}<span class="cursor" data-x="${this.x}" data-y="${this.y}">${char}</span>${after}`;
                    node.replaceWith(...nodeWithCursor.childNodes);
                }

                totalLen += nodeLen;
            }
        }

        scrollIntoViewIfNotVisible(this.getCurrentLine(), this.buffer.getScrollContainer());
    }
}

class Buffer {
    /**
     * @param {Element} element
     * @param {Interpreter} interpreter
     */
    constructor(element, interpreter) {
        this.e = element;
        this.interpreter = interpreter;
        this.cursor = new Cursor(this);
    }

    getLines() {
        return this.e.querySelectorAll(`article > *`);
    }

    getScrollContainer() {
        return this.e.querySelector(`article`);
    }

    getPath() {
        return this.e.dataset?.path ?? "";
    }

    getBufferType() {
        const type = this.e.dataset?.type ?? "";
        return BufferTypes[type];
    }

    isActive() {
        return this.e.classList.contains('active');
    }

    isVisible() {
        return !this.e.classList.contains('hidden');
    }

    makeActive() {
        if(!this.isActive()) {
            document.querySelector(`section.active`)?.classList?.toggle('active');
            this.e.classList.toggle('active');
        }
    }

    /**
     * @param {String} direction "h": left, "l": right, "k": up, "j": down
     */
    moveActive(direction="k") {
        const buffers = this.interpreter.getAllVisibleBuffers();
        const activeIndex = buffers.findIndex(b => b.e === this.e);
        switch(direction) {
            case "h":
                break;
            case "l":
                break;
            case "k":
                buffers[Math.max(activeIndex - 1, 0)].makeActive();
                break;
            case "j":
                buffers[Math.min(activeIndex + 1, buffers.length - 1)].makeActive();
                break;
        }
    }

    quit() {
        this.e.remove();
        const activeBuffers = this.interpreter.getAllVisibleBuffers();
        if(activeBuffers.length <= 0)
            openBuffer(this.interpreter, getFileDir(this.getPath()));
        else
            activeBuffers[activeBuffers.length - 1].makeActive();
    }

    toggleVisible() {
        this.e.classList.toggle("hidden");
    }

    renderStatusLine() {
        if(this.isVisible()) {
            const bufferTitle = this.e.dataset.path || "[No Name]";

            if(this.isActive()) {
                const viewportPosition = calculateViewportPosition(this.getScrollContainer());
                const mode = this.interpreter.mode;
                this.e.querySelector(`aside`).innerHTML = `<span><span class="highlight"> ${mode} </span> ${bufferTitle} </span><span class="highlight"> ${this.cursor.y + 1}:${this.cursor.x + 1} ${viewportPosition} </span>`;
            } else {
                this.e.querySelector(`aside`).innerHTML = `<span>${bufferTitle}</span>`;
            }
        }
    }
}

class CommandLine {
    /**
     * @param {Interpreter} interpreter
     */
    constructor(interpreter) {
        this.e = document.querySelector(`footer`);
        this.interpreter =  interpreter;
        this.command = "";
        this.logText = "";
    }

    log(text) {
        this.clear();
        this.logText = text;
    }

    logNYI() {
        this.log("Not yet implemented");
    }

    setInactive() {
        if(!this.e.classList.contains("active")) return;
        this.interpreter.getActiveBuffer().cursor.getCurrentCursor().classList.remove("not-focus");
        this.e.classList.remove("active");
    }

    setActive() {
        if(this.e.classList.contains("active")) return;
        this.interpreter.getActiveBuffer().cursor.getCurrentCursor().classList.add("not-focus");
        this.e.classList.add("active");
    }

    clear() {
        this.command = "";
        this.logText = "";
    }

    interpretCommand() {
        this.setInactive();

        if(this.command in Motions.COMMAND) {
            Motions.COMMAND[this.command](this.interpreter);
            return;
        } else if(/^:[0-9]+/.test(this.command)) {
            const n = (Number(this.command.substring(1)) - 1);
            this.interpreter.getActiveBuffer().cursor.setY(n > 0 ? n : 0);
            return;
        }

        const matchingCommands = Object.keys(Motions.COMMAND).filter(k => k.startsWith(this.command));

        if(matchingCommands.length === 1) {
            Motions.COMMAND[matchingCommands[0]](this.interpreter);
        } else if(matchingCommands.length > 1) {
            this.interpreter.commandLine.log(`Ambiguous command, did you mean ${matchingCommands.join(", ")}`);
        }
    }

    input(key) {
        if(key === "Enter") {
            this.interpretCommand();
            this.interpreter.toNormalMode();
        } else if(key === "Backspace") {
            this.command = this.command.substring(0, this.command.length - 1);
            if(this.command.length <= 0) {
                this.clear();
                this.interpreter.toNormalMode();
            }
        } else if(/^.$/.test(key)) {
            this.command += key;
        }
    }

    render() {
        const commandLineText = this.command || this.logText || "";
        this.e.innerHTML = `<span>${commandLineText}<span class="cursor"> </span></span><span>${this.interpreter.mult}${this.interpreter.partialCommand}</span>`;
    }
}

const BufferTypes = {
    "notrw": {
        name: "notrw",
    },
    "md": {
        name: "Markdown",
        special: (buffer, selectedPath) => { replaceBuffer(buffer, selectedPath, ["markdown"], (f) => marked.parse(f)) },
    },
}

const Modes = {
    NORMAL: "Normal",
    INSERT: "Insert",
    VISUAL: "Visual",
    V_LINE: "V-Line",
    V_BLOCK: "V-Block",
    COMMAND: "Command",
    REPLACE: "Replace"
};

function repeat(n, callback) {
    n = n ?? 1;
    for(let i = 0; i < n; i++) {
        callback();
    }
}

const scrollIntoCenterOptions = { behavior: "instant", block: "center", inline: "center" };

/**
 * @param {HTMLElement} e
 * @param {HTMLElement} scrollContainer
 */
function centerElementInScroll(e, scrollContainer) {
    scrollContainer.style.scrollSnapType = "y mandatory";
    e.scrollIntoView(scrollIntoCenterOptions);
    scrollContainer.style.scrollSnapType = "none";
}

const Motions = {
    MOVEMENT: {
        "h":        (cursor, n) => cursor.setX(cursor.x - (n ?? 1)),
        "j":        (cursor, n) => cursor.setY(cursor.y + (n ?? 1)),
        "k":        (cursor, n) => cursor.setY(cursor.y - (n ?? 1)),
        "l":        (cursor, n) => cursor.setX(cursor.x + (n ?? 1)),
        "gg":       (cursor, n) => cursor.setY((n ?? 1) - 1),
        "G":        (cursor, n) => cursor.setY((n ?? cursor.buffer.getLines().length) - 1),
        "0":        (cursor) => cursor.setX(0),
        "$":        (cursor) => cursor.setX(cursor.getCurrentLine().textContent.length),
        "w":        (cursor, n) => repeat(n, () => cursor.moveForwardToRegex(/(?<=\s|\b|^)\S/)),
        "b":        (cursor, n) => repeat(n, () => cursor.moveBackwardToRegex(/(?<=\s|\b|^)\S/g)),

        "zz":       (cursor) => centerElementInScroll(cursor.getCurrentLine(), cursor.buffer.getScrollContainer()), // center cursor on screen
        "zt":       (cursor) => cursor.getCurrentLine().scrollIntoView(), // position cursor on top of the screen
        "zb":       (cursor) => cursor.getCurrentLine().scrollIntoView(false), // position cursor on bottom of the screen
        "<A-e>":    (cursor, n) => {
            const bottomLine = getFirstLastVisibleElement(cursor.buffer.getScrollContainer(), false).e;
            bottomLine?.nextElementSibling?.scrollIntoView(false);
        }, // move screen down one line (without moving cursor)
        "<A-y>":    (cursor, n) => {
            const topLine = getFirstLastVisibleElement(cursor.buffer.getScrollContainer()).e;
            topLine?.previousElementSibling?.scrollIntoView();
        }, // move screen up one line (without moving cursor)
        "<A-f>":    (cursor, n) => { const sc = cursor.buffer.getScrollContainer(); sc.scrollBy(0, sc.clientHeight * (n ?? 1)) }, // move screen down one page (cursor to first line)
        "<A-b>":    (cursor, n) => { const sc = cursor.buffer.getScrollContainer(); sc.scrollBy(0, -sc.clientHeight * (n ?? 1)) }, // move screen up one page (cursor to last line)
        "<A-d>":    (cursor, n) => repeat(n ?? 1, () => {
            cursor.moveYPxDown(cursor.buffer.getScrollContainer().clientHeight / 2);
            centerElementInScroll(cursor.getCurrentLine(), cursor.buffer.getScrollContainer())
        }), // move cursor and screen down 1/2 page
        "<A-u>":    (cursor, n) => repeat(n ?? 1, () => {
            cursor.moveYPxUp(cursor.buffer.getScrollContainer().clientHeight / 2);
            centerElementInScroll(cursor.getCurrentLine(), cursor.buffer.getScrollContainer())
        }), // move cursor and screen up 1/2 page
    },
    INSERT: {},
    BUFFER_MANIPULATION: {
        "<A-w>s":   (buffer) => openBuffer(buffer.interpreter, buffer.getPath()), //split window
        "<A-w>v":   (buffer) => buffer.interpreter.commandLine.logNYI(), //split window vertically
        "<A-w>w":   (buffer) => {
            const ab = buffer.interpreter.getAllVisibleBuffers();
            ab.every((b, i) => {
                if(b.isActive()) {
                    const index = i + 1 < ab.length ? i + 1 : 0;
                    ab[index].makeActive();
                    return false;
                }
                return true;
            })
        }, //switch windows
        "<A-w>q":   (buffer) => buffer.quit(), //quit a window
        "<A-w>h":   (buffer) => buffer.moveActive("h"), //move cursor to left window
        "<A-w>l":   (buffer) => buffer.moveActive("l"), //move cursor to right window
        "<A-w>j":   (buffer) => buffer.moveActive("j"), //move cursor to window below
        "<A-w>k":   (buffer) => buffer.moveActive("k"), //move cursor to window above
    },
    NOTRW: {
        "o":        (buffer, selectedPath) => openBuffer(buffer.interpreter, selectedPath), //open in new buffer
        "Enter":    (buffer, selectedPath) => replaceBuffer(buffer, selectedPath), //open in current buffer
        "-":        (buffer) => replaceBuffer(buffer, buffer.getPath().replace(/\/[^\/]+\/$/, "/")), //go up dir
        "D":        (buffer) => buffer.interpreter.commandLine.log("Permission denied"),
        "R":        (buffer) => buffer.interpreter.commandLine.log("Permission denied"),
        "s":        (buffer) => buffer.interpreter.commandLine.logNYI(),
        "x":        (buffer, selectedPath) => BufferTypes[fileExtensionFromPath(selectedPath)]?.special(buffer, selectedPath),
    },
    COMMAND: {
        ":q":       (interpreter) => interpreter.getActiveBuffer().quit(),
        ":q!":      (interpreter) => interpreter.getActiveBuffer().quit(),
        ":Explore": (interpreter) => { const b = interpreter.getActiveBuffer(); replaceBuffer(b, getFileDir(b.getPath())) },
        ":Preview": (interpreter) => {
            const ab = interpreter.getActiveBuffer();
            if(ab.getBufferType().name === BufferTypes.md.name) {
                ab.e.classList.contains("markdown")
                    ? replaceBuffer(ab, ab.getPath())
                    : BufferTypes.md.special(ab, ab.getPath());
            } else {
                interpreter.commandLine.log("Active buffer is not a markdown file");
            }
        },
    }
};

class Interpreter {
    constructor() {
        this.commandLine = new CommandLine(this);
        this.mode = Modes.NORMAL;
        this.mult = "";
        this.partialCommand = "";
    }

    getAllVisibleBuffers() {
        return [...document.querySelectorAll(`section:not(.hidden)`)].map(e => new Buffer(e, this));
    }

    getActiveBuffer() {
        const e = document.querySelector(`section.active`);
        return new Buffer(e, this);
    }

    toNormalMode() {
        this.mode = Modes.NORMAL;
        this.mult = "";
        this.partialCommand = "";
        this.commandLine.setInactive();
    }

    interpretNormal(key) {
        if(/^[1-9]$/.test(key) || (this.mult && key === "0")) {
            this.partialCommand = "";
            this.mult += key;
            return;
        }

        if(key === ":") {
            this.commandLine.clear();
            this.commandLine.setActive();
            this.commandLine.input(key);
            this.mode = Modes.COMMAND;
            return;
        }

        if(this.interpretBufferManipulation(key)) return;

        if(key in Motions.NOTRW && this.getActiveBuffer().getBufferType()?.name === "notrw") {
            const buffer = this.getActiveBuffer();
            const selectedPath = buffer.cursor.getCurrentLine()?.dataset?.path;
            if(selectedPath)
                Motions.NOTRW[key](buffer, selectedPath);
            return;
        }
        
        const cmd = `${this.partialCommand}${key}`;
        if(cmd in Motions.MOVEMENT) {
            const n = Number(this.mult) || undefined;
            const cursor = this.getActiveBuffer().cursor;
            Motions.MOVEMENT[cmd](cursor, n);
            this.mult = "";
            this.partialCommand = "";
            return;
        }

        if(Object.keys(Motions.MOVEMENT).some(k => k.startsWith(`${this.partialCommand}${key}`))) {
            this.partialCommand += key;
        }
    }

    interpretBufferManipulation(key) {
        const cmd = `${this.partialCommand}${key}`;
        if(cmd in Motions.BUFFER_MANIPULATION) {
            Motions.BUFFER_MANIPULATION[cmd](this.getActiveBuffer());
            this.mult = "";
            this.partialCommand = "";
            return true;
        }

        if(Object.keys(Motions.BUFFER_MANIPULATION).some(k => k.startsWith(`${this.partialCommand}${key}`))) {
            this.partialCommand += key;
            return true;
        }
    }

    interpret(keyDownEvent) {
        let key = keyDownEvent.key;
        if(this.partialCommand === "" && keyDownEvent.altKey) {
            keyDownEvent.preventDefault();
            key = `<A-${key}>`;
        }

        if(key === "Escape") {
            if(this.mode === Modes.COMMAND) this.commandLine.clear();
            this.toNormalMode();
        } else {
            switch(this.mode) {
                case Modes.NORMAL:
                    this.interpretNormal(key);
                    break;
                case Modes.COMMAND:
                    this.commandLine.input(key);
                    break;
                case Modes.INSERT:
                    this.commandLine.log("Insert mode is not yet implemented.");
                    break;
                case Modes.REPLACE:
                    this.commandLine.log("Replace mode is not yet implemented.");
                    break;
                case Modes.VISUAL:
                case Modes.V_LINE:
                case Modes.V_BLOCK:
                    this.commandLine.log("Visual mode is not yet implemented.");
                    this.interpretBufferManipulation(key);
                    break;
            }
        }
    }

    render() {
        this.getAllVisibleBuffers().forEach(b => b.renderStatusLine());
        this.commandLine.render();
    }
}

const modal = new class {
    constructor() {
        this.e = document.querySelector(`.modal`);
        this.e.querySelector(`.close-btn`).addEventListener("click", () => this.close());
        if(isFirstVisit()) {
            this.showHelp();
        }
    }

    showHelp() {
        if(this.isOpen()) return;

        fetch("/f/help.md").then(res => res.text()).then(f => { 
            this.e.querySelector(`.modal-content`).innerHTML = marked.parse(f);
        }).then(this.open());
    }

    isOpen() {
        return !this.e.classList.contains("hidden");
    }

    open() {
        this.e.classList.remove("hidden");
    }

    close() {
        this.e.classList.add("hidden");
    }
}

const preventDefaultKeys = ["F1"];

async function main() {
    const interpreter = new Interpreter();

    document.querySelector(`main`).innerHTML = "";
    await openBuffer(interpreter, "/f/");

    interpreter.render();
    interpreter.getActiveBuffer().cursor.render();

    window.addEventListener("keydown", function(e) {
        if(e.key === "F1") {
            e.preventDefault();
            modal.showHelp();
            return;
        }

        if(modal.isOpen()) {
            if(e.key === "Escape") modal.close();
            return;
        }

        interpreter.interpret(e); 
        interpreter.render();
    });
}

document.addEventListener("DOMContentLoaded", main);
