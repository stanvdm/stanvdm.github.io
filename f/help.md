# Help page - Portfolio Stan Vandamme
**`WARNING`: If you don't know vim please `read this page carefully`**

As a portfolio website I recreated the VIM text editor from scratch using only vanilla JS, html and css. All navigation is done with the keyboard (I added some mouse functionality for non vim users).

All articles are written in markdown and stored on git in the `/f/` directory. This directory is automatically indexed and presented in the form of a file explorer (netrw clone). Press `x` on any `.md` file to show it in a readable format. Press enter on a directory or file to open it (in raw text format).

The folder structure is as follows:
- **about-me.md** - an about me document
- **blog-posts** - directory containing various blog posts
- **help.md** - this document
- **the-making-of.md** - an explanation of how this site was made and its feature set

This help menu can be opened again any time by pressing `F1` or by opening the `help.md` file.

## Navigating the site
**If you already know vim**, then all you need to know is that `<ctrl>` has been replaced by `<alt>` since a lot of browser shortcuts use `<ctrl>` (e.g. `<ctrl> + w + j` becomes `<alt> + w + j`).

**If you don't know vim**, then read the short introduction below:

Vim is a keyboard driven text editor, the idea being that your hands never leave the keyboard. At the core of the text editor are the "vim motions" which allow you to move around a document. When pressing any of these keys, the cursor will move around.

Vim has multiple modes, the current mode can be viewed on the bottom left. Since this is a blog post we don't need to edit text, so only **Normal** and **Command** mode will be used.

### Command mode
Of the two, command mode is the easiest to understand. Simply type colin (:) and a word or letter then press enter to execute it. For example, to exit a file, type `:q` then enter. To open the file explorer type `:Explore`.

Commands can also be shortened. As long as a single command exists that starts with the typed letters, it will be executed. For example `:E` does the same thing as `:Explore` since there are no other commands that start with `:E`.

Currently implemented commands:
- `:q` - quit the current active buffer
- `:Explore` - open the file explorer
- `:Preview` - toggle markdown preview (i.e. toggle between raw text and formatted text)
- `:123` - go to line 123, `123` can be any whole number

To exit command mode press `<Esc>`.

### Normal mode
In normal mode, any key pressed is a command. For example, the `:` key switches to command mode. Most of these commands are "motions" to move around the document.

Not all vim motions are currently implemented (that would be a lot of time). I implemented the motions that I use a lot.

#### Movement
These motions move the cursor. They can be preceded with a number to do the action n times. For example `33j` will move the cursor down 33 lines. 

- `h` - move cursor left
- `j` - move cursor down
- `k` - move cursor up
- `l` - move cursor right
- `gg` - go to the first line of the document
- `G` - go to the last line of the document
- `0` - jump to the start of the line
- `$` - jump to the end of the line
- `w` - jump forwards to the start of a word
- `b` - jump backwards to the start of a word
- `zz` - center cursor on screen
- `zt` - position cursor on top of the screen
- `zb` - position cursor on bottom of the screen
- `<A-e>` - move screen down one line (without moving cursor)
- `<A-y>` - move screen up one line (without moving cursor)
- `<A-f>` - move screen down one page (cursor to first line)
- `<A-b>` - move screen up one page (cursor to last line)
- `<A-d>` - move cursor and screen down 1/2 page
- `<A-u>` - move cursor and screen up 1/2 page

#### Window manipulation
You can have multiple windows open at the same time. Currently only horizontal splits are possible.

- `<A-w>s` - split window horizontally
- `<A-w>w` - switch windows
- `<A-w>q` - quit a window
- `<A-w>j` - move cursor to window below
- `<A-w>k` - move cursor to window above

#### File explorer
The file explorer has some custom motions. For some, the cursor needs to be on a file or directory.
- `o` - open file or directory in new window
- `<Enter>` - open file or directory in current window
- `-` - move up one directory
- `x` - open a file using special parser if there is one. Currently only works with markdown files. Will open a rendered version of the markdown document.

#### Other
- `F1` - Open the help screen
