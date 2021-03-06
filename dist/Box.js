"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var lodash_1 = __importDefault(require("lodash"));
var assert_1 = __importDefault(require("./assert"));
var BoxError = /** @class */ (function (_super) {
    __extends(BoxError, _super);
    function BoxError(_a) {
        var _b = _a === void 0 ? {} : _a, _c = _b.message, message = _c === void 0 ? 'Assert Box Error' : _c, _d = _b.statusCode, statusCode = _d === void 0 ? 500 : _d, reason = _b.reason;
        var _this = _super.call(this, message) || this;
        _this.statusCode = statusCode;
        if (reason)
            _this.reason = reason;
        Error.captureStackTrace(_this, BoxError);
        return _this;
    }
    return BoxError;
}(Error));
var BoxEarlyReturnError = /** @class */ (function (_super) {
    __extends(BoxEarlyReturnError, _super);
    function BoxEarlyReturnError(res) {
        var _this = this;
        var message = 'Box Triggered Early Return';
        _this = _super.call(this, message) || this;
        _this.code = 'ERR_BOX_EARLY_RETURN';
        _this.returnValue = res;
        return _this;
    }
    return BoxEarlyReturnError;
}(Error));
function Unauthorized(message) {
    message ? message = "Unauthorized: " + message : 'Unauthorized';
    return {
        statusCode: 403,
        message: message
    };
}
function NotFound(type) {
    return {
        statusCode: 404,
        message: type + " not found"
    };
}
function validateRequestors(requestors) {
    requestors.map(function (requestor, index) {
        return assert_1.default(typeof requestor === 'function', "Requestor at index: " + index + " is not a function");
    });
}
var Box = /** @class */ (function () {
    function Box(value) {
        this.value = value;
        this._requestors = [];
    }
    Box.prototype.if = function (assertion, onTrue) {
        var _this = this;
        validateRequestors([assertion, onTrue]);
        // enforce all are async
        var _a = [assertion, onTrue].map(function (fn) { return function (box) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, fn(box)];
        }); }); }; }), assertionP = _a[0], onTrueP = _a[1];
        this._requestors.push(function (box) {
            return assertionP(box).then(function (flag) {
                if (flag)
                    return onTrueP(box);
                return;
            });
        });
        return this;
    };
    Box.prototype.ifElse = function (assertion, onTrue, onFalse) {
        var _this = this;
        validateRequestors([assertion, onTrue, onFalse]);
        this._requestors.push(function (box) { return __awaiter(_this, void 0, void 0, function () {
            var flag, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, assertion(box)];
                    case 1:
                        flag = _b.sent();
                        if (!flag) return [3 /*break*/, 3];
                        return [4 /*yield*/, onTrue(box)];
                    case 2:
                        _a = _b.sent();
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, onFalse(box)];
                    case 4:
                        _a = _b.sent();
                        _b.label = 5;
                    case 5: return [2 /*return*/, _a];
                }
            });
        }); });
        return this;
    };
    Box.prototype.exec = function () {
        var _this = this;
        return this._requestors
            .reduce(function (promise, requestor) {
            return promise.then(function () { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, requestor(this)];
                });
            }); });
        }, Promise.resolve())
            .catch(function (err) {
            if (err instanceof BoxEarlyReturnError) {
                return err.returnValue;
            }
            throw err;
        });
    };
    Box.prototype.ifReturn = function (assertion, ret) {
        var _this = this;
        if (ret === void 0) { ret = function () { }; }
        validateRequestors([assertion, ret]);
        // enforce all are async
        var _a = [assertion, ret].map(function (fn) { return function (box) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, fn(box)];
        }); }); }; }), assertionP = _a[0], retP = _a[1];
        this._requestors.push(function (box) {
            // @ts-ignore Forgive me
            return assertionP(box).then(function (flag) {
                if (flag)
                    return retP(box).then(function (res) {
                        throw new BoxEarlyReturnError(res);
                    });
            });
        });
        return this;
    };
    Box.prototype.assert = function (requestors, errorSpec) {
        var _this = this;
        if (!Array.isArray(requestors))
            requestors = [requestors];
        validateRequestors(requestors);
        // enforce requestors are async
        var requestorsAsync = requestors.map(function (requestor) { return function (box) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, requestor(box)];
        }); }); }; });
        this._requestors.push(function (box) {
            return Promise.all(requestorsAsync.map(function (requestor) { return requestor(box); }))
                .then(function (assertions) {
                return assertions.reduce(function (acc, current) { return acc === true || current === true; }, false);
            })
                .then(function (assertion) {
                if (assertion !== true)
                    throw new BoxError(errorSpec);
            });
        });
        return this;
    };
    Box.prototype.map = function (requestor, errorExtend) {
        validateRequestors([requestor]);
        if (!errorExtend) {
            this._requestors.push(requestor);
        }
        else {
            this._requestors.push(function (box) {
                try {
                    return Promise.resolve(requestor(box)).catch(function (err) {
                        throw Object.assign(err, errorExtend);
                    });
                }
                catch (err) {
                    throw Object.assign(err, errorExtend);
                }
            });
        }
        return this;
    };
    Box.prototype.compose = function () {
        var _this = this;
        var requestors = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            requestors[_i] = arguments[_i];
        }
        requestors = lodash_1.default.flatten(requestors);
        validateRequestors(requestors);
        // close all requestor but first over this box
        requestors = requestors.map(function (requestor, i) { return (i !== 0 ? requestor(_this) : requestor); }, this);
        validateRequestors(requestors);
        // build composed requestor function
        var requestor = function (box) {
            return requestors.reduce(function (promise, requestor) {
                return promise.then(function (value) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                    return [2 /*return*/, requestor(value)];
                }); }); });
            }, Promise.resolve(box));
        };
        this._requestors.push(requestor);
        return this;
    };
    Box.of = function (value) {
        return new Box(value);
    };
    Box.errors = {
        BoxError: BoxError,
        BoxEarlyReturnError: BoxEarlyReturnError,
        Unauthorized: Unauthorized,
        NotFound: NotFound
    };
    return Box;
}());
exports.default = Box;
