const chokidar = require("chokidar");
const path = require("path");
const fs = require("fs");
const express = require("express");
const child_process = require("child_process");
const compiler = require("../compiler/compiler");

class Watcher {
    constructor() {
        this.app = null;
    }

    /**
     * Main function
     * 监听当前目录状态
     */
    watch(rootPath, port = 8080) {
        this.rootPath = rootPath;
        this.port = port;
        //开启http服务
        this.startServer(rootPath, port);
        //匹配goform请求
        this.matchRequest();
        //监听oem.config.js
        this.listenOemConfigFile();
    }

    startServer(rootPath, port) {
        !this.app && (this.app = new express());
        this.app.use(express.static(rootPath));
        //设置解析引擎为config中的模板
        this.app.set("views", rootPath);
        this.app.set("view engine", "html");
        this.server = this.app.listen(~~port, err => {
            console.log("Server is listening at http://localhost:" + port);
            child_process.exec(`open http://localhost:${port}`);
        });
    }

    matchRequest() {
        this.app.use((req, res, next) => {
            next();

            try {
                let fileName = req.originalUrl,
                    filePath = this._findFilePath(fileName),
                    parsedData;

                if (filePath != "not defined") {
                    parsedData = fs.readFileSync(filePath, "utf-8");
                    parsedData = JSON.stringify(parsedData);
                    res.send(parsedData);
                } else {}
            } catch (e) {
                console.log(e);
                throw e;
            }
        });
    }


    listenOemConfigFile() {
        if (fs.existsSync(path.join(this.rootPath, "oem.config.js"))) {
            require(path.join(this.rootPath, "oem.config.js"));
            let modules = this._resolveAllRequires(path.join(this.rootPath, "oem.config.js"));

            this.chokidarWatcher = chokidar.watch(modules)
            this.chokidarWatcher.on("change", filePath => {
                // this._clearCache(filePath);
                compiler.compile(this.rootPath);
            });
        }
    }

    _findFilePath(fileName) {
        if (!fileName || !this.rootPath) return "not defined";
        let prefix = path.join(this.rootPath, fileName);

        //如果请求路径是文件夹,则检查文件夹下是否有index.*类型文件，有则使用下面的文件作为数据源
        if (fs.existsSync(prefix) && fs.statSync(prefix).isDirectory()) {
            if (fs.existsSync(path.join(prefix, "index.html"))) {
                return path.join(prefix, "index.html");
            } else if (fs.existsSync(path.join(prefix, "index.json"))) {
                return path.join(prefix, "index.json");
            } else {
                return "not defined";
            }
        }

        //否则  检查是否存在数据源文件   文件优先级   js>json>html>txt
        //建议只放置一个文件
        if (fs.existsSync(`${prefix}.js`)) {
            return `${prefix}.js`;
        } else if (fs.existsSync(`${prefix}.json`)) {
            return `${prefix}.json`;
        } else if (fs.existsSync(`${prefix}.html`)) {
            return `${prefix}.html`;
        } else if (fs.existsSync(`${prefix}.txt`)) {
            return `${prefix}.txt`;
        } else {
            return "not defined";
        }
    }

    _watchRuleRequires() {

    }

    _resolveAllRequires(modulePath) {
        let ret = [],
            mod = require.resolve(modulePath);

        ret.push(modulePath);
        if (!!mod && require.cache[mod]) {
            require.cache[mod].children.forEach(child => {
                ret = ret.concat(this._resolveAllRequires(child.filename));
            });
        }
        return ret;
    }

    _clearCache(modulePath) {
        let mod = require.resolve(modulePath);

        if (!!mod && require.cache[mod]) {
            require.cache[mod].children.forEach(child => {
                clearCache(child.filename);
            });
            delete require.cache[mod];
        }
    }
}
let watcher = new Watcher();
// watcher.watch(path.join(__dirname, "../../AC6_/AC6_"), 8080);
module.exports = watcher;