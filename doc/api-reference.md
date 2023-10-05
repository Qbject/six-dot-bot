# API Reference

## Main concepts

Some concepts are mentioned throughout the app and it's useful to understand their meaning:

### Page

The central abstraction the app is built around. Both client and server sides interact with pages. Pages are also stored in the database. Pages is what the users can create, edit and share. Each page have some data associated with it. The most important are: id, ownerId and schema. Each page has unique 16-character id that is generated on page creation. OwnerId associates each page with Telegram user. Only the page owner can edit the page. Also, the pages owned by the user are listed in their home activity.

### Page schema

...or just schema is a (usually json-encoded) object containing all the information about the page contents. All the info needed to display the page is stored in schema. On the other hand then the user edits the page, they change the schema. Server only treats it as a string and its parsing and composing is made only on the client.

This means that the server can't validate it and user can technically submit anything as a schema. This means, the client code should be careful while applying the schema as it may contain malicious code. For example the markdown block uses DOMPurify library to sanitize the HTML before inserting it into the page.

The schema object contains the only property `children` which contains a list of block schemas. Block schema contains the following properties:
- `typeName`: blocks typeName (more in block section)
- `props`: block props (more in block section)
- `children`: list of clildren block schemas as block may have children blocks

## Block

WIP

### Block props

WIP

## Client-Server architecture

The app consists of 2 parts - python server made on Bottle framework and JavaScript client.

### Server

The server is written in python. It uses Bottle framework to handle HTTP logic and implements WSGI interface to allow the app to be running on the remote hosting servers. Server code is located in python files directly under `src` directory. Basically, the server does 4 essential things:

- hosting static front-end under `src/static`
- handles Telegram updates and API interaction
- provides REST API for the client to interact with persistent database records. This also includes validating Telegram MiniApp initData as the client blindly trust it.
- exposes some environment variables to the client as Javascript module `/js/config.js`.

The entry file if `src/app.py`. It exports `application` object that is hendy while connecting with WSGI interfaces. It can be also run in CLI mode, but the behavior is defined by the flags:
- `--init` - causes to create SQLite database file if not created yet, setup Telegram menu button and set the Telegram webhook for the current web address
- `--run` - starts the server. Useful for starting the server locally
If no arguments are provided - nothing happens.

Other server files:
- `src/rest_api.py` incapsulates REST API logic for interaction with pages.
- `src/pages.py` library of functions for CRUD interaction with pages without direct database interaction.
- `src/tgapi.py` library of functions for interaction with the Telegram API.
- `src/util.py` library of functions that are reusable throughout the code and can't be categorized.

### Client

The client files are located under `src/static`. The entry point is `index.html` file that includes a list of [3-party libraries](#third-party-libraries) as well as the app code itself. The app doesn't change the browser location, all the routing is made on client, so the app stays on `index.html` at all times.

#### Third-party libraries

The app utilizes a list of third-party libraries to provide reliable solution to some issues:
- [long-press-event](https://github.com/john-doherty/long-press-event) is needed to detect use long touch on mobile. It is quite a tricky task to reliably implement this with DOM-provided methods, so this is where well-maintainet time-tested solution helps. The library isn't available on wide-known CDNs, so it's hosted within the project.
- `telegram-web-app.js` - provides an official API for incorporating MiniApp features.
- [SortableJS](https://github.com/SortableJS/Sortable) - a great library that handles block drag-and-drop behavior.
- [marked](https://github.com/markedjs/marked) - another beautiful library that allows converting markdown to HTML.
- [DOMPurify](https://github.com/cure53/DOMPurify) - stays on a guard from XSS attacks by sanitizing marked output.
- [lottie](https://airbnb.io/lottie/) - allows rendering lottie graphics to improve the feeling of the pages.
- [rippleJS](https://github.com/samthor/rippleJS) - allows adding ripple effect to interactive elements to enhance the visual feedback.

#### Main MiniApp code

The code responsible of displaying a MiniApp is located under `src/static/js` directory. The entry point is `app.js` file. It defines the `App` class as well as starting the app initialization process. The project utilizes ES imports to load in other needed classes.

#### Styles

Style files are located under `src/static/css` directory. The html page liads inly `styles.css` file which defines some global styles and includes other css files:
- `reset.css` - eliminates browser default styling to ensure consistent look across different browser web views
- `activities.css` - for styling activities and their layout
- `blocks.css` - contains styling related to blocks
- `control-panel.css` - contains styling for control panel
- `telegram.css` - styles elements to apply styling, aesthetics, look and feel of the Telegram
