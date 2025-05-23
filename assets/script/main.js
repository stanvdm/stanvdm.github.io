async function fetchFileIndex(callback) {
    return fetch("/f/index.json").then(res => res.json()).then(json => callback(json));
}

function scrollIntoViewIfNotVisible(e) {
    const styles = getComputedStyle(e);
    const bottomBound = window.innerHeight - (Number(styles.scrollMarginBottom.slice(0, -2)) || 0)
    const topBound = Number(styles.scrollMarginTop.slice(0, -2)) || 0
    if (e.getBoundingClientRect().bottom > bottomBound) e.scrollIntoView(false);
    if (e.getBoundingClientRect().top < topBound) e.scrollIntoView();
}

/**
 * @param {String} path to file or dir
 * @param {Array<String>} classList classes to add to buffer element
 * @param {Function} parser if path leads to a file, the contents of the file is passed through the parser before being added to the html
 */
async function generateBuffer(path="/", classList=[], parser=f => f.split("\n").map(l => `<p>${l} </p>`).join("")) {
    // TODO: allow empty buffer with no path
    if (!path) path = "/";
    if(path.endsWith("/")) {
        return fetchFileIndex(fi => {
            const files = fi.filter(f => f.file.startsWith(path)).reduce((prev, cur) => {
                const pathArr = cur.file.replace(path, '').split("/");
                const name = pathArr.length > 1 ? `${pathArr[0]}/` : pathArr[0];
                return {...prev, [name]: cur}
            }, {});
            return `
            <section class="active notrw ${classList.join(" ")}" data-path="${path}">
                <article>
                    <p>" ============================================================================</p>
                    <p>" Notrw Directory Listing                                          (notrw v1)</p>
                    <p>" ${path}</p>
                    <p>" Sorted by name</p>
                    <p>" Quick Help: <span class="highlight">&lt;F1&gt;</span>:help  -:go up dir  D:delete  R:rename  s:sort-by  x:special</p>
                    <p>" ==============================================================================</p>
                    <p data-path="${path.replace(/\/.*\/$/, "/")}"><span class="cursor" data-x="0" data-y="6">.</span>./</p>
                    <p data-path="${path}">./</p>
                    ${Object.entries(files).map(([k, v]) => `<p data-path="${path}${k}">${k}</p>`).join("")}
                </article>
                <aside></aside>
            </section>`;
        });
    } else {
        return fetch(path).then(res => res.text()).then(f => {
            return `
            <section class="active ${classList.join(" ")}" data-path="${path}">
                <article>
                    ${parser(f)}
                </article>
                <aside></aside>
            </section>`;
        });
    }
}

/**
 * @param {Buffer} oldBuffer
 * @param {String} path
 * @param {Array<String>} classList classes to add to buffer element
 * @param {Function} parser if path leads to a file, the contents of the file is passed through the parser before being added to the html
 */
async function replaceBuffer(oldBuffer, path="", classList=[], parser=undefined) {
    document.querySelector(`.active`)?.classList.toggle("active");
    const nodeWithNewBuffer = document.createElement("div");
    nodeWithNewBuffer.innerHTML = await generateBuffer(path, classList, parser);
    oldBuffer.e.replaceWith(...nodeWithNewBuffer.childNodes);

    const newBuffer = new Buffer(document.querySelector(`.active`), oldBuffer.interpreter);
    newBuffer.renderStatusLine();
    newBuffer.cursor.render();
}

/**
 * @param {Interpreter} interpreter
 * @param {String} path
 * @param {Array<String>} classList classes to add to buffer element
 * @param {Function} parser if path leads to a file, the contents of the file is passed through the parser before being added to the html
 */
async function openBuffer(interpreter, path="", classList=[], parser=undefined) {
    document.querySelector(`.active`)?.classList.toggle("active");
    document.querySelector(`main`).innerHTML += await generateBuffer(path, classList, parser);

    interpreter.render();
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

    render() {
        this.derender();
        const line = this.buffer.getLines()[this.y];
        if(line === "") line.innerHTML = `<span class="cursor" data-x="${this.x}" data-y="${this.y}" width=".5rem"></span>`;

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

        scrollIntoViewIfNotVisible(this.getCurrentLine());
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

    getPath() {
        return this.e.dataset?.path ?? "";
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
        console.log(activeIndex);
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
            openBuffer(this.interpreter);
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
                const viewportPosition = calculateViewportPosition(this.e.querySelector(`article`));
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
        this.logText = text;
    }

    setInactive() {
        this.interpreter.getActiveBuffer().cursor.getCurrentCursor().classList.remove("not-focus");
        this.e.classList.remove("active");
    }

    setActive() {
        this.interpreter.getActiveBuffer().cursor.getCurrentCursor().classList.add("not-focus");
        this.e.classList.add("active");
    }

    input(key) {
        if(key === "Enter") {
            //TODO: execute commands
            this.interpreter.toNormalMode();
        } else if(key === "Backspace") {
            this.command = this.command.substring(0, this.command.length - 1);
            if(this.command.length <= 0) this.interpreter.toNormalMode();
        } else {
            //TODO: check if key is valid
            this.command += key;
        }
    }

    render() {
        const commandLineText = this.command || this.logText || "";
        this.e.innerHTML = `<span>${commandLineText}<span class="cursor"> </span></span><span>${this.interpreter.mult}${this.interpreter.partialCommand}</span>`;
    }
}

const Parsers = {
    ".md": (f) => marked.parse(f),
}

function selectParserByExtension(path) {
    const extension = /\.[a-zA-Z0-9]+$/.exec(path)[0];
    console.log(extension);
    return Parsers[extension] || undefined;
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

const Motions = {
    MOVEMENT: {
        "h":    (cursor, n) => { cursor.setX(cursor.x - (n ?? 1)) },
        "j":    (cursor, n) => { cursor.setY(cursor.y + (n ?? 1)) },
        "k":    (cursor, n) => { cursor.setY(cursor.y - (n ?? 1)) },
        "l":    (cursor, n) => { cursor.setX(cursor.x + (n ?? 1)) },
        "gg":   (cursor, n) => { cursor.setY((n ?? 1) - 1) },
        "G":    (cursor, n) => { cursor.setY((n ?? cursor.buffer.getLines().length) - 1) },
        "0":    (cursor) => { cursor.setX(0) },
        "$":    (cursor) => { cursor.setX(cursor.getCurrentLine().textContent.length) },
    },
    INSERT: {},
    BUFFER_MANIPULATION: {
        "<A-w>s":    (buffer) => { openBuffer(buffer.interpreter, buffer.getPath()) }, //split window
        "<A-w>v":    (buffer) => {}, //split window vertically
        "<A-w>w":    (buffer) => {}, //switch windows
        "<A-w>q":    (buffer) => { buffer.quit() }, //quit a window
        "<A-w>h":    (buffer) => { buffer.moveActive("h") }, //move cursor to left window
        "<A-w>l":    (buffer) => { buffer.moveActive("l") }, //move cursor to right window
        "<A-w>j":    (buffer) => { buffer.moveActive("j") }, //move cursor to window below
        "<A-w>k":    (buffer) => { buffer.moveActive("k") }, //move cursor to window above
    },
    NOTRW: {
        "o":        (buffer, selectedPath) => { openBuffer(buffer.interpreter, selectedPath) }, //open in new buffer
        "Enter":    (buffer, selectedPath) => { replaceBuffer(buffer, selectedPath) }, //open in current buffer
        "-":        (buffer) => { replaceBuffer(buffer, buffer.getPath().replace(/\/.*\/$/, "/")) }, //go up dir
        "D":        (buffer) => { buffer.interpreter.commandLine.log("Permission denied") },
        "R":        (buffer) => { buffer.interpreter.commandLine.log("Permission denied") },
        "x":        (buffer, selectedPath) => { replaceBuffer(buffer, selectedPath, ["markdown"], selectParserByExtension(selectedPath)) },
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
        this.commandLine.command = "";
        this.commandLine.logText = "";
        this.commandLine.setInactive();
    }

    interpretNormal(key) {
        if(/^[1-9]$/.test(key) || (this.mult && key === "0")) {
            this.partialCommand = "";
            this.mult += key;
            return;
        }

        if(key === ":") {
            this.commandLine.setActive();
            this.commandLine.input(key);
            this.mode = Modes.COMMAND;
            return;
        }

        if(this.getActiveBuffer().e.classList.contains("notrw") && key in Motions.NOTRW) {
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
            return;
        }

        if(Object.keys(Motions.BUFFER_MANIPULATION).some(k => k.startsWith(`${this.partialCommand}${key}`))) {
            this.partialCommand += key;
        }
    }

    interpret(keyDownEvent) {
        let key = keyDownEvent.key;
        if(this.partialCommand === "" && keyDownEvent.altKey) key = `<A-${key}>`
        console.log(key);

        if(key === "Escape") {
            this.toNormalMode();
        } else {
            switch(this.mode) {
                case Modes.NORMAL:
                    this.interpretNormal(key);
                    this.interpretBufferManipulation(key);
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

async function main() {
    const interpreter = new Interpreter();

    document.querySelector(`main`).innerHTML = "";
    await openBuffer(interpreter, "/f/");

    interpreter.render();
    interpreter.getActiveBuffer().cursor.render();

    window.addEventListener("keydown", function(e) {
        interpreter.interpret(e); 
        interpreter.render();
    });
    //todo move cursor when scrolling
}

document.addEventListener("DOMContentLoaded", main);
