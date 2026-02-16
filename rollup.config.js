import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import dts from 'rollup-plugin-dts';

export default [
    // JavaScript bundle
    {
        input: 'src/controls.ts',
        output: {
            file: 'js/controls.js',
            format: 'es',
            sourcemap: true
        },
        plugins: [
            resolve(),
            typescript({
                tsconfig: './tsconfig.json',
                declaration: false,
                declarationMap: false
            })
        ]
    },
    // TypeScript declarations bundle
    {
        input: 'src/controls.ts',
        output: {
            file: 'js/controls.d.ts',
            format: 'es'
        },
        plugins: [
            dts()
        ]
    }
];
