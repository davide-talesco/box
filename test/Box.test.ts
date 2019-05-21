import Lab from '@hapi/lab';
const { it, describe } = exports.lab = Lab.script();
import { expect } from '@hapi/code';
import Box from '../src/Box';

describe('Box().if', () => {
  it('should run function if assertion returns true', async (flags: any) => {
    const fn = flags.mustCall(() => {}, 1);
    await Box().if(() => true, fn).exec();
  });

  it('should not run function if assertion returns false', async(flags: any) => {
    const fn = flags.mustCall(() => {}, 0);
    await Box().if(() => false, fn);    
  });
});

describe('Box().ifElse', () => {
  it('should only run if function if assertion returns true', async (flags: any) => {
    const onTrue = flags.mustCall(() => {}, 1);
    const onFalse = flags.mustCall(() => {}, 0);
    await Box().ifElse(() => true, onTrue, onFalse).exec();
  });

  it('should only run else function if assertion returns false', async (flags: any) => {
    const onTrue = flags.mustCall(() => {}, 0);
    const onFalse = flags.mustCall(() => {}, 1);
    await Box().ifElse(() => false, onTrue, onFalse).exec();
  });

  it('should handle async functions', async (flags: any) => {
    const onFalse = flags.mustCall(() => {}, 1);
    const onTrue = flags.mustCall(() => {}, 0);
    await Box().ifElse(async () => false, onTrue, onFalse).exec();
  });
});