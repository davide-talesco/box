// This is a Stamp that wrap a value in a Box
import _ from 'lodash';
// import assert  from './assert';
import assert from 'assert';

type IBox = { [key: string]: any };
type Requestor = Function;
type Assertion = (b: IBox) => any;

class BoxError extends Error {
  statusCode: number;
  reason?: string;
  constructor(errorSpec: { message: string; status: number; reason: string; }) {
    const message = _.get(errorSpec, 'message') || 'Assert Box Error';
    const statusCode = _.get(errorSpec, 'statusCode') || 400;
    const reason = _.get(errorSpec, 'reason');

    super(message)
    this.statusCode = statusCode;
    if (reason) this.reason = reason;
    Error.captureStackTrace(this, BoxError);
  }
}

class BoxEarlyReturnError extends Error {
  code: string;
  returnValue?: any;
  constructor(res?: any) {
    const message = 'Box Triggered Early Return'
    super(message)
    this.code = 'ERR_BOX_EARLY_RETURN';
    this.returnValue = res;
  }
}

function Unauthorized () {
  return { 
    statusCode: 403, 
    message: 'Unauthorized' 
  }
}

function NotFound (type: any) {
  return { 
    statusCode: 404, 
    message: `${type} not found`
  }
}

class Box {
  value?: any;
  _requestors: Requestor[];
  constructor (value?: any) {
    this.value = value;
    this._requestors = [];
  }

  if(assertion: Assertion, onTrue: Function){
    validateRequestors([assertion, onTrue]);

    // enforce all are async
    [assertion, onTrue] = [assertion, onTrue].map(fn => async box => fn(box))

    this._requestors.push( 
      (box: IBox) => assertion(box)
        .then((flag: boolean) => {
          if (flag) return onTrue(box);
          return;
        })
    )
    return this
  }
  exec () {
    return this._requestors.reduce((promise, requestor) => {
      return promise.then(( async () => {
        return requestor(this)
      } ));
    }, Promise.resolve())
    .catch(err => {
      if (err instanceof BoxEarlyReturnError){
        return err.returnValue;
      }
      throw err;
    })
  }
}

/*
const Box = stampit({
  initializers:[
    function(value){
      this.value = value;
      this._requestors = [];
    }
  ],
  methods: {
    // if assertion return true onTrue function is executed
    // both assertion, and onTrue are invoked with a single argument being the box itself
    if(assertion, onTrue){
      
      validateRequestors([assertion, onTrue]);

      // enforce all are async
      [assertion, onTrue] = [assertion, onTrue].map(fn => async box => fn(box))

      this._requestors.push( 
        box => assertion(box)
          .then(flag => {
            if (flag) return onTrue(box);
            return;
          })
      )

      return this
    },
    // if assertion return true onTrue function is executed otherwise onFalse
    // all assertion, onTrue, onFalse are invoked with a single argument being the box itself
    ifElse(assertion, onTrue, onFalse){
      
      validateRequestors([assertion, onTrue, onFalse]);

      // enforce all are async
      [assertion, onTrue, onFalse] = [assertion, onTrue, onFalse].map(fn => async box => fn(box))

      this._requestors.push( 
        box => assertion(box)
          .then(flag => {
            if (flag) return onTrue(box);
            return onFalse(box);
          })
      )

      return this
    },
    // if assertion return true ret function is executed and its return value
    // is returned to the box caller stopping the pipeline execution
    // if no ret function is provided void will be returned by default
    ifReturn(assertion, ret){
      ret = ret || (() => { return })
      
      validateRequestors([assertion, ret]);

      // enforce all are async
      [assertion, ret] = [assertion, ret].map(fn => async box => fn(box))


      this._requestors.push( 
        box => assertion(box)
          .then(flag => {
            if (flag) return ret(box).then(res => {
              throw new Box.errors.BoxEarlyReturnError(res);
            });
          })
      )

      return this
    },
    // requestors can be a list of requestors or a single requestor
    // if a list of requestors they are logically OR
    // requestor will be invoked with this box as the only argument and should return a Boolean
    // if the return value is not === true it will throw a new Error of errorConstructor type
    assert(requestors, errorSpec ){
      requestors = _.castArray(requestors);
      if (!Array.isArray(requestors)) requestors = [requesto]

      validateRequestors(requestors);

      // enforce requestors are async
      var requestorsAsync = requestors.map(requestor => async box => requestor(box));
        
      this._requestors.push( 
        box => Promise.all(requestorsAsync.map(requestor => requestor(box)))
        .then(assertions => assertions.reduce((acc, current ) => acc === true || current === true , false))
        .then(assertion => {
          if (assertion !== true) throw new Box.errors.BoxError(errorSpec)}) 
      )

      return this
    },
    // requestor will be invoked with this box as the only argument
    // errorExtend is an optional object that will extend the error object in case requestor throws
    map(requestor, errorExtend){
      validateRequestors([requestor]);

      if (!errorExtend){
        this._requestors.push(requestor);
      }
      else {
        this._requestors.push(
          function(box){
            try {
              return Promise.resolve(requestor(box))
                .catch(err => {
                  throw Object.assign(err, errorExtend)
                })
            }
            catch(err){
              throw Object.assign(err, errorExtend)
            }
          } 
        );
      }
      return this;
    },
    // accept a single argument with an array of requestors or multiple requestor argument
    // the first requestor will be invoked with this box while all the following requestors will be first closed over this box
    // and with the value returned by the previous requestor
    compose(...requestors){
      requestors = _.flatten(requestors);

      validateRequestors(requestors);

      // close all requestor but first over this box
      requestors = requestors.map((requestor, i) => i !== 0 ? requestor(this) : requestor, this)
      
      validateRequestors(requestors);

      // build composed requestor function
      const requestor = box => 
        requestors.reduce((promise, requestor) => {
          return promise.then(( async value => requestor(value)));
        }, Promise.resolve(box))

      this._requestors.push(requestor);

      return this;
    },
    // return a Promise that run sequentially all registerd requestors functions 
    // every requestor will be invoked with this box as the only argument
    // every intermediate requestor return value is discarded but the last one which is returned to the caller
    exec(){
      const that = this;

      return this._requestors.reduce((promise, requestor) => {
        return promise.then(( async () => {
          return requestor(that)
        } ));
      }, Promise.resolve())
      .catch(err => {
        if (err instanceof Box.errors.BoxEarlyReturnError){
          return err.returnValue;
        }
        throw err;
      })
    }
  },
  statics: {
    errors: {
      BoxError: 
        class BoxError extends Error {
          constructor(errorSpec) {
            const message = _.get(errorSpec, 'message') || 'Assert Box Error';
            const statusCode = _.get(errorSpec, 'statusCode') || 400;
            const reason = _.get(errorSpec, 'reason');

            super(message)
            this.statusCode = statusCode;
            if (reason) this.reason = reason;
            Error.captureStackTrace(this, BoxError);
        }
      },
      BoxEarlyReturnError: 
        class BoxEarlyReturnError extends Error {
          constructor(res) {
            const message = 'Box Triggered Early Return'
            super(message)
            this.code = 'ERR_BOX_EARLY_RETURN';
            this.returnValue = res;
        }
      },
      Unauthorized(){
        return { 
          statusCode: 403, 
          message: 'Unauthorized' 
        }
      },
      NotFound(type){
        return { 
          statusCode: 404, 
          message: `${type} not found`
        }
      }
    },
    continue(){
      return () => {};
    },
    return(fn){
      const method = (...args) => fn(...args);
      method.stocazzo = true;
      return method;
    }
  }
});


*/

function validateRequestors(requestors: Requestor[]){
  requestors.map((requestor, index) => assert(typeof requestor === 'function', `Requestor at index: ${index} is not a function`))
}

export default (value?: any) => new Box(value);