const path = require('path');
const webpack = require('webpack');

module.exports = {
    // bundling mode
    mode: 'development',
    // entry files
    entry: './src/main.js',
    // output bundles (location)
    output: {
    path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js'
    },
    plugins: [
        // Ignore fs usage on the client-side bundle
        new webpack.IgnorePlugin({
            resourceRegExp: /^fs$/,
        }),
    ],
};