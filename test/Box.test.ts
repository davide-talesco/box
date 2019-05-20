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