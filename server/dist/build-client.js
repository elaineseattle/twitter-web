"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.watchClientBuild = void 0;
const constants_1 = require("./constants");
const execa = require("execa");
function watchClientBuild() {
    execa
        .command('yarn dev', {
        cwd: constants_1.CLIENT_ROOT_FOLDER_PATH,
        stdio: 'inherit',
    })
        .catch((err) => {
        console.error('Problem while building client project', err);
    });
}
exports.watchClientBuild = watchClientBuild;
