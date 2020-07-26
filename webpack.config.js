const path = require('path')

module.exports = {
    mode: "production",
    resolve: {
        mainFields: ['module', 'main']
    },
    entry: {
        main: './dist/express-app/app.js'
    },
    output: {
        path: path.join(__dirname, 'dist'),
        filename: 'index.js',
        libraryTarget: 'commonjs'
    },
    target: 'node',

    // Webpack 4 does not have a CSS minifier, although
    // Webpack 5 will likely come with one
    module: {
        rules: [
            {
                exclude: [
                    '/node_modules/',
                    '/src/bin/deploy/'
                ]

            }
        ]
    },
    externals: {
        'aws-sdk': 'aws-sdk'
    }
}
