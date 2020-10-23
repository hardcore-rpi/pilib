import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import builtinModules from 'builtin-modules';
import { terser } from 'rollup-plugin-terser';

export default {
  input: 'src/index.ts',
  output: {
    file: 'dist/apt-wizard.js',
    format: 'cjs',
  },
  external: builtinModules,
  plugins: [
    commonjs(),
    resolve(),
    typescript({ tsconfig: './tsconfig.build.rollup.json' }),
    json(),
    terser(),
  ],
};
