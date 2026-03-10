const path = require('path');

module.exports = {
    mode: 'none',
    target: ['web', 'es2015'],
    entry: './src/dice-replacer-entry.ts',
    output: {
        filename: 'dice-replacer.js',
        path: path.resolve(__dirname, 'dist'),
        iife: false,
        environment: {
            arrowFunction: true,
            const: true,
            destructuring: true,
            forOf: true,
            dynamicImport: true,
            module: true
        }
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: [
                    {
                        loader: 'ts-loader',
                        options: {
                            transpileOnly: false
                        }
                    }
                ],
                exclude: /node_modules/
            }
        ]
    },
    optimization: {
        concatenateModules: true,
        minimize: false,
        moduleIds: 'named'
    },
    devtool: false
};
