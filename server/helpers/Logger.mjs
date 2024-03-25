
import chalk from 'chalk';

export default class Logger {
    separator = " : ";

    logInformation(... args) {
        var prefix = chalk.gray("[INFO] " + new Date().toISOString());
        console.log(prefix + this.separator + chalk.blueBright.apply(chalk, args))
    }

    logError(... args) {
        var prefix = chalk.gray("[ERROR] " + new Date().toISOString());
        console.log(prefix + this.separator + chalk.red.apply(chalk, args))
    }

    logWarning(... args) {
        var prefix = chalk.gray("[WARNING] " + new Date().toISOString());
        console.log(prefix + this.separator + chalk.yellow.apply(chalk, args))
    }

    logSuccess(... args) {
        var prefix = chalk.gray("[SUCCESS] " + new Date().toISOString());
        console.log(prefix + this.separator + chalk.green.apply(chalk, args))
    }
}