import terser from '@rollup/plugin-terser';
import serve from 'rollup-plugin-serve';
import livereload from 'rollup-plugin-livereload';

const isProduction = process.env.NODE_ENV === 'production';

export default {
  input: 'src/index.js',
  output: [
    {
      file: 'dist/newchartjs.umd.js',
      format: 'umd',
      name: 'NewChart',
      sourcemap: !isProduction
    },
    {
      file: 'dist/newchartjs.esm.js',
      format: 'es',
      sourcemap: !isProduction
    },
    {
      file: 'dist/newchartjs.cjs.js',
      format: 'cjs',
      sourcemap: !isProduction
    }
  ],
  plugins: [
    isProduction && terser(),
    !isProduction && serve({
      contentBase: ['dist', 'demo'],
      host: 'localhost',
      port: 3000,
      historyApiFallback: true
    }),
    !isProduction && livereload({
      watch: ['dist', 'demo']
    })
  ]
};
