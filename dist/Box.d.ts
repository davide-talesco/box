interface ErrorSpec {
    message?: string;
    statusCode?: number;
    reason?: string;
}
declare type IBox = {
    [key: string]: any;
};
declare type Requestor = Function;
declare type Assertion = (b: IBox) => any;
declare class BoxError extends Error {
    statusCode: number;
    reason?: string;
    constructor({ message, statusCode, reason }?: ErrorSpec);
}
declare class BoxEarlyReturnError extends Error {
    code: string;
    returnValue?: any;
    constructor(res?: any);
}
declare function Unauthorized(): {
    statusCode: number;
    message: string;
};
declare function NotFound(type: any): {
    statusCode: number;
    message: string;
};
declare class Box {
    value?: any;
    _requestors: Requestor[];
    constructor(value?: any);
    static errors: {
        BoxError: typeof BoxError;
        BoxEarlyReturnError: typeof BoxEarlyReturnError;
        Unauthorized: typeof Unauthorized;
        NotFound: typeof NotFound;
    };
    if(assertion: Assertion, onTrue: Function): this;
    ifElse(assertion: Assertion, onTrue: Function, onFalse: Function): this;
    exec(): Promise<any>;
    ifReturn(assertion: Assertion, ret: Function): this;
    assert(requestors: Requestor[], errorSpec: ErrorSpec): this;
    map(requestor: Requestor, errorExtend?: any): this;
    compose(...requestors: Requestor[]): this;
}
declare const _default: (value?: any) => Box;
export default _default;
