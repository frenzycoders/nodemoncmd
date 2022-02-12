#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runner = void 0;
const child = __importStar(require("child_process"));
const chokidar_1 = require("chokidar");
const readline_sync_1 = __importDefault(require("readline-sync"));
const promises_1 = require("fs/promises");
const chalk_1 = __importDefault(require("chalk"));
const cli_spinner_1 = require("cli-spinner");
const caporal_1 = __importDefault(require("caporal"));
const package_json_1 = require("./package.json");
const lodash_debounce_1 = __importDefault(require("lodash.debounce"));
const readline_1 = __importDefault(require("readline"));
const spinner = new cli_spinner_1.Spinner({
    stream: process.stderr,
    onTick: function (msg) {
        this.clearLine(this.stream);
        this.stream.write(msg);
    }
});
spinner.setSpinnerString('|/-\\');
caporal_1.default
    .version(package_json_1.version)
    .argument('<path>', 'path which you want to listen change.')
    .action(({ path }) => __awaiter(void 0, void 0, void 0, function* () {
    const p = {
        path: path,
        ref: null,
    };
    console.log(chalk_1.default.green('> [process]: ') + chalk_1.default.gray('checking path state ') + chalk_1.default.blue(p.path));
    spinner.start();
    try {
        const state = yield (0, promises_1.stat)(path);
        spinner.stop(true);
        console.log(chalk_1.default.green('> [OK]: ') + chalk_1.default.gray('path status OK ') + chalk_1.default.blue(p.path) + chalk_1.default.gray(' path type ') + chalk_1.default.blue(state.isDirectory() ? 'Directory' : 'File'));
    }
    catch (error) {
        spinner.stop(true);
        console.log(chalk_1.default.redBright('> [error]: ') + chalk_1.default.red(error));
        process.exit();
    }
    let ans = readline_sync_1.default.question(chalk_1.default.green('> enter command you want to execute on change: '));
    let cmds = ans.split(' ');
    let s = cmds[0];
    ans = ans.replace(s, '');
    cmds = ans.split(' ');
    cmds = cmds.filter((e) => {
        if (e != ' ')
            return e;
    });
    const start = (0, lodash_debounce_1.default)(() => __awaiter(void 0, void 0, void 0, function* () {
        console.log(chalk_1.default.yellow('> starting nodemoncmd ') + chalk_1.default.green(package_json_1.version.toString()));
        spinner.start();
        (0, exports.runner)(p, s, cmds);
        spinner.stop(true);
        p.ref && p.ref.on('exit', () => {
            if (p.ref.exitCode === 0) {
                const r1 = readline_1.default.createInterface({
                    input: process.stdin,
                    output: process.stdout,
                });
                r1.on('line', (ans) => {
                    if (ans === 'rs') {
                        r1.close();
                        start();
                    }
                });
            }
        });
    }), 100);
    (0, chokidar_1.watch)(path).on('all', () => {
        start();
    });
}));
caporal_1.default.parse(process.argv);
const runner = (path, cmd, srgs) => __awaiter(void 0, void 0, void 0, function* () {
    if (path.ref) {
        console.log(chalk_1.default.red('>>> closing the program change detected <<<'));
        path.ref.kill();
    }
    try {
        console.log(chalk_1.default.green('> [process]: ') + chalk_1.default.green('executing command ') + chalk_1.default.gray(cmd + ' ' + srgs.join('')));
        path.ref = child.spawn(cmd, srgs, { stdio: 'inherit', });
        console.log(chalk_1.default.green('> [OK]: ') + chalk_1.default.green('command executed with 0 error.'));
        console.log(chalk_1.default.greenBright('> [process]') + chalk_1.default.blueBright(' enter `rs` for restart process'));
    }
    catch (error) {
        console.log(chalk_1.default.red('> [error]') + chalk_1.default.red(' in loading the program'));
        console.log(chalk_1.default.red(error.stderr));
        path.ref.kill();
    }
});
exports.runner = runner;
//# sourceMappingURL=index.js.map