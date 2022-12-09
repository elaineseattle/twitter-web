"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PORT = exports.DB_FILE_PATH = exports.GRAPHQL_SCHEMA_PATH = exports.STATIC_ROOT_FOLDER_PATH = exports.CLIENT_ROOT_FOLDER_PATH = exports.ROOT_PKG_JSON_PATH = exports.SERVER_WORKSPACE_PKG_JSON_PATH = void 0;
const path_1 = require("path");
const pkgUp = require("pkg-up");
exports.SERVER_WORKSPACE_PKG_JSON_PATH = pkgUp.sync();
if (!exports.SERVER_WORKSPACE_PKG_JSON_PATH)
    throw new Error('package.json path could not be found');
exports.ROOT_PKG_JSON_PATH = (0, path_1.join)(exports.SERVER_WORKSPACE_PKG_JSON_PATH, '..', '..');
function rootBasedPath(name) {
    return (0, path_1.join)(exports.ROOT_PKG_JSON_PATH, name);
}
exports.CLIENT_ROOT_FOLDER_PATH = rootBasedPath('client');
exports.STATIC_ROOT_FOLDER_PATH = rootBasedPath('static');
exports.GRAPHQL_SCHEMA_PATH = rootBasedPath('schema.graphql');
exports.DB_FILE_PATH = rootBasedPath('db.json');
exports.PORT = process.env.PORT || 3000;
