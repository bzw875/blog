module.exports = {
    "env": {
        "browser": true,
        "commonjs": true,
        "es6": true,
        "amd": true,
        "mocha": true,
        "commonjs": true
    },
    "parser": "babel-eslint",
    "extends": "eslint:recommended",
    "globals": {
        "$": true,
        "wx": true,
        "yog": true,
        "getCurrentPages": true,
        "Page": true,
        "getApp": true,
        "App": true,
        "fis": true,
        "__dirname": true,
        "jQuery": true,
        "process": true,
        "importScript": true,
        "importScriptList": true
    },
    "parserOptions": {
        "ecmaVersion": 6,
        "sourceType": "module",
        "ecmaFeatures": {
            "jsx": true
        }
    },
    "rules": {

        //双引号错误提示
        "quotes": [
            "warn",
            "single",
            { "allowTemplateLiterals": true }
        ],

        //空格和tab混用
        "no-mixed-spaces-and-tabs": ["warn", "smart-tabs"],

        //空语句块
        "no-empty": ["error", {
            "allowEmptyCatch": true //允许catch语句中空语句
        }],

        //变量声明后出现空行
        //"newline-after-var": ["warn", "always"],

        //分号
        "semi": ["warn", "always"],

        //没有使用的变量
        "no-unused-vars": ["error"],

        //禁止在代码中出现console
        "no-console": ['error', {
            allow: ["warn", "error", "dir", "log"]
        }],
        "no-alert": ['warn'],

        //es6 模版字符串中不出现空格
        "template-curly-spacing": ["error", "never"],


        //禁用多余的空格
        //"no-multi-spaces": "warn"

        //禁止花括号使用空格
        "object-curly-spacing": ["error", "never", { "objectsInObjects": true }],

        //在数组元素的开始盒末尾不使用空格
        "array-bracket-spacing": ["error", "never"],

        //在开始注释的地方后出现一个空格
        "spaced-comment": ["error", "always"],

        //构造函数中的super调用
        "constructor-super": "error"
    }
}