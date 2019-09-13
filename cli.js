#!/usr/bin/env node
const cp = require('child_process')
const cluster = require('cluster')
const os = require('os')
const fs = require('fs')

const yargs = require('yargs')
const chalk = require('chalk')
const psTree = require('ps-tree');

const logFileName = "processlog.log"
var isWin = /^win/.test(process.platform);


// setting up the version
yargs.version('1.1.0')

// serve
yargs.command({
    command: 'serve',
    describe: 'Run the node server',
    builder: {
        file: {
            describe: 'File to serve',
            alias: 'f',
            demandOption: true
        },
        port: {
            describe: 'Setting the port of the server'
        },
        watch: {
            describe: 'Watches the file changes and auto-reload'
        },
        i: {
            describe: 'Number of process to run. Default is equal to the number of the CPU'
        }
    },
    handler: function(argv) {
        startServer(argv)
    }
})

// list
yargs.command({
    command: 'list',
    describe: 'Listing the process status',
    handler: function() {
        showLogData()
    }
})

//monit
yargs.command({
    command: 'monit',
    describe: 'Monitor CPU and Memory usage',
    handler: function() {
        showCpuMemoryUsage()
    }
})



function startServer (argv) {
    if(cluster.isMaster) {
        console.log(chalk.green("[proman] is starting the server") )
        clearLogData()
        let numWorkers = os.cpus().length
        
        if (yargs.argv.i && yargs.argv.i > 0) {
            if (yargs.argv.i <= numWorkers) {
                numWorkers = yargs.argv.i
            }
        }

        logData({
            message: 'Master cluster setting up ' + numWorkers + ' workers...'
        })

        for(var i = 0; i < numWorkers; i++) {
            cluster.fork();
        }

        cluster.on('online', function(worker) {
            logData({
                pid: worker.process.pid,
                processType: 'fork',
                status: 'Online',
                message: 'Worker ' + worker.process.pid + ' is online'
            })
        });

        cluster.on('exit', function(worker, code, signal) {
            logData({
                pid: worker.process.pid,
                processType: 'fork',
                status: 'Offline',
                message: 'Worker ' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal
            })

            logData({
                message: 'Starting a new worker'
            })
            cluster.fork();
        });
    } else {
        let portOpt = '';
        if(typeof argv.port !== 'undefined') {
            let platFrm = os.platform()

            if (platFrm == 'win32') {
                portOpt = `set PORT=${argv.port} && `
            } else {
                portOpt = `export PORT=${argv.port}; `
            }
        }

        var server = launchServer(portOpt, argv.file)

        if(typeof argv.watch !== 'undefined' && argv.watch == true) {
            // Watching the file changes
            fs.watch('./', "utf8", function (event, trigger) {
                console.log(chalk.red('Detecting file changes...'))
                console.log(chalk.red('Restarting the server...'))
                if(isWin) {
                    var cp = require('child_process');
                    cp.exec('taskkill /PID ' + server.pid + ' /T /F', function (error, stdout, stderr) {
                        //launching the server again
                        server = launchServer(portOpt, argv.file)
                    });
                } else {
                    kill(server.pid, 'SIGKILL', function() {
                        //launching the server again
                        server = launchServer(portOpt, argv.file)
                    })
                }
            })
        }
    }
}

// child process killing function
function kill (pid, signal, callback) {
    signal   = signal || 'SIGKILL';
    callback = callback || function () {};
    var killTree = true;
    if(killTree) {
        psTree(pid, function (err, children) {
            [pid].concat(
                children.map(function (p) {
                    return p.PID;
                })
            ).forEach(function (tpid) {
                try { process.kill(tpid, signal) }
                catch (ex) { }
            });
            callback();
        });
    } else {
        try { process.kill(pid, signal) }
        catch (ex) { }
        callback();
    }
};

// launch server
function launchServer (portOpt, fileName) {
    let child = cp.exec(`${portOpt} node ${fileName}`)

    child.stdout.on('data', function(data) {
        console.log(chalk.yellow(data.toString()))
    })

    return child
}

// logging the data
function logData (content) {
    let baseContent = fs.readFileSync(logFileName).toString()

    if (baseContent) {
        baseContent = JSON.parse(baseContent)
    }
    let baseContentArr = []
    if (!baseContent) {
        baseContentArr.push(content)
    } else {
        baseContentArr = baseContent
        baseContentArr.push(content)
    }

    let baseContentStr = JSON.stringify(baseContentArr)
    fs.writeFileSync(logFileName, baseContentStr )
}

// show the log
function showLogData () {
    let baseContent = fs.readFileSync(logFileName).toString()
    if (baseContent) {
        baseContent = JSON.parse(baseContent)
    }
    
    for(eachLog of baseContent) {
        if (!eachLog.pid) {
            console.log(chalk.yellow(eachLog.message))
        } else {
            if (eachLog.status == 'Offline') {
                console.log(chalk.red(`PID: ${eachLog.pid}, Process Type: ${eachLog.processType}, Status: ${eachLog.status}`))
            } else {
                console.log(chalk.green(`PID: ${eachLog.pid}, Process Type: ${eachLog.processType}, Status: ${eachLog.status}`))
            }
        }
    }
}

// clear the log
function clearLogData () {
    fs.writeFileSync(logFileName, '' )
}

// showing cpu and memory usage
function showCpuMemoryUsage () {
    let cpus = os.cpus();
    for(var i = 0, len = cpus.length; i < len; i++) {
        console.log("CPU %s:", i);
        var cpu = cpus[i], total = 0;
    
        for(var type in cpu.times) {
            total += cpu.times[type];
        }
    
        for(type in cpu.times) {
            console.log("\t", type, Math.round(100 * cpu.times[type] / total));
        }
    }
    console.log("Total Memory: ", os.totalmem())
    console.log("Free Memory: ", os.freemem())
    
}

yargs.argv

