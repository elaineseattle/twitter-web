"use strict";
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPresent = exports.isDefined = void 0;
function isDefined(arg) {
    return typeof arg !== 'undefined';
}
exports.isDefined = isDefined;
function isPresent(arg) {
    return arg !== null && typeof arg !== 'undefined';
}
exports.isPresent = isPresent;
