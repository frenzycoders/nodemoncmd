#!/usr/bin/env node
import * as child from 'child_process';
import { watch } from 'chokidar';
import readline from 'readline-sync';
import { stat } from 'fs/promises';
import chalk from 'chalk';
import { Spinner } from 'cli-spinner';
import program from 'caporal';
import { version } from './package.json';
import debounce from 'lodash.debounce';
import line from 'readline';
const spinner = new Spinner({
    stream: process.stderr,
    onTick: function (msg) {
        this.clearLine(this.stream);
        this.stream.write(msg);
    }
});
spinner.setSpinnerString('|/-\\');

program
    .version(version)
    .argument('<path>', 'path which you want to listen change.')
    .action(async ({ path }) => {
        const p: pathType = {
            path: path,
            ref: null,
        }
        console.log(chalk.green('> [process]: ') + chalk.gray('checking path state ') + chalk.blue(p.path))
        spinner.start();
        try {
            const state = await stat(path);
            spinner.stop(true);
            console.log(chalk.green('> [OK]: ') + chalk.gray('path status OK ') + chalk.blue(p.path) + chalk.gray(' path type ') + chalk.blue(state.isDirectory() ? 'Directory' : 'File'))
        } catch (error) {
            spinner.stop(true);
            console.log(chalk.redBright('> [error]: ') + chalk.red(error));
            process.exit();
        }
        let ans = readline.question(chalk.green('> enter command you want to execute on change: '));

        let cmds: string[] = ans.split(' ');
        let s = cmds[0];
        ans = ans.replace(s, '');
        cmds = ans.split(' ');
        cmds = cmds.filter((e) => {
            if (e != ' ') return e;
        });

        const start = debounce(async () => {
            console.log(chalk.yellow('> starting nodemoncmd ') + chalk.green(version.toString()));
            spinner.start();
            runner(p, s, cmds);
            spinner.stop(true);

            p.ref && p.ref.on('exit', () => {
                if (p.ref.exitCode === 0) {
                    const r1 = line.createInterface({
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
        }, 100);
        watch(path).on('all', () => {
            start();
        })
    });

program.parse(process.argv);


export type pathType = {
    path: string;
    ref: any;
}

export const runner = async (path: pathType, cmd: string, srgs: string[]) => {
    if (path.ref) {
        console.log(chalk.red('>>> closing the program change detected <<<'));
        path.ref.kill();
    }

    try {
        console.log(chalk.green('> [process]: ') + chalk.green('executing command ') + chalk.gray(cmd + ' ' + srgs.join('')));
        path.ref = child.spawn(cmd, srgs, { stdio: 'inherit', });
        console.log(chalk.green('> [OK]: ')+chalk.green('command executed with 0 error.'))
        console.log(chalk.greenBright('> [process]') + chalk.blueBright(' enter `rs` for restart process'));
    } catch (error) {
        console.log(chalk.red('> [error]')+chalk.red(' in loading the program'))
        console.log(chalk.red(error.stderr))
        path.ref.kill();
    }
}