Development Workflow
====================

## Build

Running `make run` will build all the code and continuously watch the front-end JS and CSS/Sass for changes and rebuild accordingly.

## Tests

If you want to run the tests for a specific library in `client/` use:

```bash
> npm run test-client client/<subdirectory>/test
```

or for running all tests (client, server, test), use:

```bash
> npm test
```

The [test/README.md](../test/README.md) file documents how to create new tests, how to watch for file changes, and how to run all or just some tests from the test suite.

## Errors and Warnings

Errors and warning appear in the normal places – the terminal where you ran `make run` and the JavaScript console in the browser. If something isn’t going the way you expected it, look at those places first.

## Debugging

Calypso uses the [debug](https://github.com/visionmedia/debug) module to handle debug messaging. To turn on debug mode for all modules, type the following in the browser console:

```js
localStorage.setItem( 'debug', '*' );
```

You can also limit the debugging to a particular scope:

```js
localStorage.setItem( 'debug', 'calypso:*' );
```

The `node` server uses the `DEBUG` environment variable instead of `localStorage`. `make run` will pass along its environment, so you can turn on all debug messages with:

```bash
DEBUG=* make run
```

or limit it as before with:

```bash
DEBUG=calypso:* make run
```

### Debugging node

Since building and starting the express server is done via a make target, the normal method of passing argument to the node process won't work. However, you can start the debugger via the `NODE_ARGS` environment variable. The value of this variable is passed to the node command when executing `make run`.  This means you can run the built-in inspector by running `NODE_ARGS="--inspect" make run`.  Starting the debugger is similar: `NODE_ARGS="--debug=5858" make run`.  If you would like to debug the build process as well, it might be convenient to have the debugger/inspector break on the first line and wait for you.  In that case, you should also pass in the `--debug-brk` option like so: `NODE_ARGS="--inspect --debug-brk" make run` (note: `--debug-brk` can also be used with the `--debug` flag).

## Monitoring builds and tests

Throughout your Calypso development workflow, you will find yourself waiting — either for a build to finish or for tests to run. Rather than standing idle looking at terminals while you wait, you can use status indicators and/or system notifications.

One such tool is [AnyBar](https://github.com/tonsky/AnyBar) (_macOS only_), a very barebones menubar indicator. Here's a brief screencast of AnyBar reporting builds and tests for Calypso:

<video src="https://cldup.com/LOqXUo351n.mp4" controls>
<a href="https://cldup.com/LOqXUo351n.mp4">(video)</a>
</video>

### Set-up

- Install [AnyBar](https://github.com/tonsky/AnyBar): `brew cask install anybar`
- Run it at the default port: `open -a AnyBar`
- Obtain this [handler shell script](https://gist.github.com/mcsf/56911ae03c6d87ec61429cefc7707cb7/)
- Optionally, place the script somewhere memorable and make it executable: `chmod +x ~/bin/anybar-calypso`
- From now on, pipe your Calypso commands through it:
  * `make run | anybar-calypso`
  * `npm run test-client:watch client/my-component | anybar-calypso`
- Feel free to tweak the script and share improvements with the Calypso project

### Other platforms

`anybar-calypso` communicates with AnyBar by sending simple strings via UDP to a local port. This means that it can trivially be adapted to work with any other notification system, either by listening to UDP traffic or by altering `anybar-calypso` directly.
