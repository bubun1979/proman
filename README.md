# Proman
## Simple Process Manager

This process manager will do the following:

### Please Note
To run the cli.js file as executable in *nix system, type the following command:
**<code>sudo chmod +x cli.js</code>**

### Run a express based node server
Basic format: **<code>node cli.js  serve -f <server-file-name.ext></code>**
**Example:** <code>node cli.js serve -f server.js</code>
### Fancy command
**Run: <code>npm link</code>**
Then you can use the command like following:
**<code>proman serve -f <server-file-name.ext></code>**
**Example:** <code>proman serve -f server.js</code>

## With configuring number of processes
**Example:** <code>proman serve -f server.js -i=4</code>
If -i not provided, then default number of processes will be number of the core of the system.

## With changing port number
**Example:** <code>proman serve -f server.js --port=8080</code>
## With automatic reload process
**Example:** <code>proman serve -f server.js --watch</code>

## Altogether
**Example:** <code>proman serve -f server.js -i=5 --port=8080 --watch</code>

## Getting the centralised log manager with PID’s
**Example:** <code>proman list</code>
## Monitoring CPU, Memory usage
**Example:** <code>proman monit</code>

<i>Created by Soumyajit Ghosh</i>