// simple wrapper around nodejs assert that redefine message property as enumerable so it can be serialized by pipe
import assert from 'assert';

const safeAssert = (fn: Function) => (...args: any[]) => {
  try {
    fn(...args);
  } catch (e) {
    Object.defineProperty(e, 'message', {
      enumerable: true
    });
    throw e;
  }
};

const myAssert = safeAssert(assert);

Object.keys(assert).map(key => {
  myAssert[key] = safeAssert(assert[key]);
});

export default myAssert;
