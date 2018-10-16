#!/usr/bin/env node

const program = require("commander"); //a tool to parse command interface arguments
const fs = require("fs");
const path = require("path");
const watcher = require("../src/watcher/watcher");

program.command("watch")
    .description("Watch the files blow your current working directory while doing oem test")
    .option("-P,--port,http server port you want to listening on")
    .action(args => {
        watcher.watche(path.resolve(process.cwd(), ~~args.port));
    });

program.parse(process.argv);