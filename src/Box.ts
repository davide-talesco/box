import _ from 'lodash';
import assert from './assert';

interface ErrorSpec {
  message?: string;
  statusCode?: number;
  reason?: string;
}
type IBox = { [key: string]: any };
type Requestor = (b: IBox) => any;
type Assertion = (b: IBox) => boolean | Promise<boolean> | undefined;

class BoxError extends Error {
  statusCode: number;
  reason?: string;
  constructor ({
    message = 'Assert Box Error',
    statusCode = 500,
    reason
  }: ErrorSpec = {}) {
    super(message);
    this.statusCode = statusCode;
    if (reason) this.reason = reason;
    Error.captureStackTrace(this, BoxError);
  }
}

class BoxEarlyReturnError extends Error {
  code: string;
  returnValue?: any;
  constructor (res?: any) {
    const message = 'Box Triggered Early Return';
    super(message);
    this.code = 'ERR_BOX_EARLY_RETURN';
    this.returnValue = res;
  }
}

function Unauthorized (message?: string) {

  message ? message = `Unauthorized: ${message}` : 'Unauthorized'
  return {
    statusCode: 403,
    message
  };
}

function NotFound (type: any) {
  return {
    statusCode: 404,
    message: `${type} not found`
  };
}

function validateRequestors (requestors: Requestor[]) {
  requestors.map((requestor, index) =>
    assert(
      typeof requestor === 'function',
      `Requestor at index: ${index} is not a function`
    )
  );
}

class Box {
  value?: any;
  _requestors: Requestor[];

  constructor (value?: any) {
    this.value = value;
    this._requestors = [];
  }

  static errors = {
    BoxError,
    BoxEarlyReturnError,
    Unauthorized,
    NotFound
  };

  if (assertion: Assertion, onTrue: Requestor) {
    validateRequestors([assertion, onTrue]);

    // enforce all are async
    const [assertionP, onTrueP] = [assertion, onTrue].map(
      fn => async (box: IBox) => fn(box)
    );

    this._requestors.push((box: IBox) =>
      assertionP(box).then((flag: any) => {
        if (flag) return onTrueP(box);
        return;
      })
    );
    return this;
  }

  ifElse (assertion: Assertion, onTrue: Requestor, onFalse: Requestor) {
    validateRequestors([assertion, onTrue, onFalse]);

    this._requestors.push(
      async (box: any): Promise<any> => {
        const flag = await assertion(box);
        return flag ? await onTrue(box) : await onFalse(box);
      }
    );

    return this;
  }

  exec () {
    return this._requestors
      .reduce((promise, requestor) => {
        return promise.then(async () => {
          return requestor(this);
        });
      }, Promise.resolve())
      .catch(err => {
        if (err instanceof BoxEarlyReturnError) {
          return err.returnValue;
        }
        throw err;
      });
  }

  ifReturn (assertion: Assertion, ret: Requestor = () => {}) {
    validateRequestors([assertion, ret]);

    // enforce all are async
    const [assertionP, retP] = [assertion, ret].map(fn => async (box: IBox) =>
      fn(box)
    );

    this._requestors.push((box: IBox) =>
      // @ts-ignore Forgive me
      assertionP(box).then((flag: boolean) => {
        if (flag)
          return retP(box).then((res: any) => {
            throw new BoxEarlyReturnError(res);
          });
      })
    );

    return this;
  }

  assert (requestors: Requestor[] | Requestor, errorSpec: ErrorSpec) {
    if (!Array.isArray(requestors)) requestors = [requestors];

    validateRequestors(requestors);

    // enforce requestors are async
    var requestorsAsync = requestors.map(requestor => async (box: IBox) =>
      requestor(box)
    );

    this._requestors.push((box: IBox) =>
      Promise.all(requestorsAsync.map(requestor => requestor(box)))
        .then(assertions =>
          assertions.reduce(
            (acc, current) => acc === true || current === true,
            false
          )
        )
        .then(assertion => {
          if (assertion !== true) throw new BoxError(errorSpec);
        })
    );

    return this;
  }

  map (requestor: Requestor, errorExtend?: any) {
    validateRequestors([requestor]);

    if (!errorExtend) {
      this._requestors.push(requestor);
    } else {
      this._requestors.push(function (box: IBox) {
        try {
          return Promise.resolve(requestor(box)).catch(err => {
            throw Object.assign(err, errorExtend);
          });
        } catch (err) {
          throw Object.assign(err, errorExtend);
        }
      });
    }
    return this;
  }

  compose (...requestors: Requestor[]) {
    requestors = _.flatten(requestors);

    validateRequestors(requestors);

    // close all requestor but first over this box
    requestors = requestors.map(
      (requestor, i) => (i !== 0 ? requestor(this) : requestor),
      this
    );

    validateRequestors(requestors);

    // build composed requestor function
    const requestor = (box: any) =>
      requestors.reduce((promise, requestor) => {
        return promise.then(async (value: any) => requestor(value));
      }, Promise.resolve(box));

    this._requestors.push(requestor);

    return this;
  }

  static of(value?: any){
    return new Box(value);
  }
}

export default Box;
