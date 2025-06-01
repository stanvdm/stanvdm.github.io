# The Making Of
While working on another project I thought: "Wouldn't it be nice to have a markdown preview in NeoVim?". This is, of course not possible or would be incredably complicated and slow. Since NeoVim is terminal based and terminals and markup don't really mix well.

This got me thinking, what if I made a web based version of vim? Then I remembered that I needed to make a blog for a school project. Combining the two, I created a vim like environment in the browser, that allows users to preview markdown files.

I first started by creating a basic window with some hardcoded text and tried programming the basic movement keys (h, j, k, l). This went quite smoothly, so I added a second window and allowed for movement between the two.

![Gif of the first itiration with movement working](/assets/images/the-making-of/first-movement.gif)

I then wanted the user to be able to browse a directory and read the files in this directory. This turned out to be quite hard, since JS is client side and the files are stored server side. Since I used GitHub pages, I didn't want to write some convoluted scraper that could get me banned. After some searching I decided to use GitHub actions to create an index.json file that would contain a directory listing of all files and subdirectories in the folder.

After implementing this, I did some styling and added a file explorer. By now the site was already looking quite nice.

![Gif of the project whith most styling done](/assets/images/the-making-of/after-styling.gif)

You might have noticed that in the initial gif, the windows were split vertically and in the second they are split horizontally. Orriginally I had planned to fully recreate the window tiling mechanics vim has. This turned out to be very complicated. My initial plan was to use css grid layouts. This worked, but the algorithm to generate these layouts did not. I spent a really long time trying to get this to work and eventually decided to limit window splitting to the vim default, which is horizontal.

The next challenge was the markdown previews. For these I decided to use a third party library called [marked](https://marked.js.org/). As for how to view the preview I decided to use the "special" function in vim, where a function is executed using a file when pressing `x` in netrw (the file explorer in vim). For quality of life I added the `:Preview` command that toggles any markdown file between preview and raw mode.

What followed was a lot of experimenting with styling until i got the look and feel I was hoping for. When editing markdown I usualy use VSCode to preview the files, so I copied some of their styling. Most notably the cursor on the left of the current line. For all other styling I started with the retro theme from the [markdowncss project](https://github.com/markdowncss/retro) and slowly changed everything to my liking.

During this entire process I added commands and motions when I felt like it (usualy when I got annoyed that something wasn't there during testing :P).

The code for this project can be found on my [GitHub](https://github.com/stanvdm/stanvdm.github.io).

## Future development
This was a very fun project, so I might continue working on it. I have a few things that I want to get working, the biggest are:
- Show the date a file was created/last edited
- Other commands/motions (see [vim cheat sheet](https://vim.rtorr.com/))
- Vertical splitting of windows
- Other modes (i.e. insert, visual, replace)
- Dummy filesystem in localstorage, where user can create and edit files
- Vimrc like file that user can edit, to change settings

