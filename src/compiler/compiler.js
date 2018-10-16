const fs = require("fs");
const path = require("path");

class Compiler {
    constructor() {

    }

    compile(rootPath) {
        let config = require(path.join(rootPath, "oem.config.js"));
        this._replaceByRules(config, rootPath);
    }

    _replaceByRules(projectConfig, rootPath) {
        let i, j, k;

        //遍历项目的oem.config.js文件来修改
        for (i = 0; i < projectConfig.length; i++) {
            for (j = 0; j < projectConfig[i].pageRules.length; j++) {
                //用户输入的配置
                let toReplaceValue = projectConfig[i].pageRules[j].testInput;
                //如果这个值不需要替换，那么就跳过
                if (!toReplaceValue) continue;

                for (k = 0; k < projectConfig[i].pageRules[j].rules.length; k++) {
                    //当前的配置规则
                    let curRule = projectConfig[i].pageRules[j].rules[k];

                    //遍历所有需要寻找的文件，进行替换
                    curRule.where.forEach(where => {
                        let content,
                            tagReg,
                            tagMatch,
                            curTag = reRenderTag(this._cloneDeep(curRule).tag, where),
                            curPath = path.join(rootPath, where);

                        //为tag加上注释的前后缀
                        content = fs.readFileSync(curPath, "utf-8");
                        //匹配tag标签中的内容
                        tagReg = new RegExp(curTag + "\r?\n?((.*\r?\n?)*?.*)\r?\n?\\s*" + curTag, "g");
                        tagMatch = tagReg.exec(content);

                        //遍历所有的匹配，将该文件内所有的匹配都替换掉
                        while (!!tagMatch) {
                            content = content.replace(tagMatch[1], curRule.how(tagMatch[1], toReplaceValue))
                            tagMatch = tagReg.exec(content);
                        }
                        fs.writeFileSync(curPath, content, "utf-8");
                    });

                }
            }
        }

        function reRenderTag(tag, fileName) {
            if (/(\.html|\.htm)$/.test(fileName)) {
                tag = "<!--" + tag + "-->";
            } else {
                //需要双重转义
                tag = "\\/\\*" + tag + "\\*\\/";
            }
            return tag;
        }
    }

    _cloneDeep(data, cloneFunction) {
        let type = typeof data,
            item = data,
            copy;
        switch (type) {
            case "object":
                {
                    if (Object.prototype.toString.call(item) == "[object Array]") {
                        copy = item.map(e => this._cloneDeep(e, cloneFunction));
                    } else if (Object.prototype.toString.call(item) == "[object Null]") {
                        copy = null;
                    } else if (Object.prototype.toString.call(item) == "[object Object]") {
                        copy = {};
                        for (let prop in data) {
                            copy[prop] = this._cloneDeep(item[prop], cloneFunction);
                        }
                    } else {
                        copy = item;
                    }
                }
                break;
            case "function":
                {
                    if (!!cloneFunction && item.constructor) {
                        copy = new item.constructor();
                    } else {
                        copy = item;
                    }
                }
                break;
            default:
                {
                    copy = item;
                }
        }
        return copy;
    }
}

module.exports = new Compiler();