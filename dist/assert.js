"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// simple wrapper around nodejs assert that redefine message property as enumerable so it can be serialized by pipe
var assert_1 = __importDefault(require("assert"));
var safeAssert = function (fn) { return function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    try {
        fn.apply(void 0, args);
    }
    catch (e) {
        Object.defineProperty(e, 'message', {
            enumerable: true
        });
        throw e;
    }
}; };
var myAssert = safeAssert(assert_1.default);
Object.keys(assert_1.default).map(function (key) {
    myAssert[key] = safeAssert(assert_1.default[key]);
});
exports.default = myAssert;
