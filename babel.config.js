module.exports = {
    presets: [
        ['@babel/preset-env', {
            targets: {
                browsers: [
                    '> 1%',
                    'last 2 versions',
                    'not dead',
                    'not ie <= 11'
                ]
            },
            useBuiltIns: 'usage',
            corejs: {
                version: 3,
                proposals: true
            },
            modules: false,
            debug: process.env.NODE_ENV === 'development'
        }]
    ],
    plugins: [
        '@babel/plugin-proposal-class-properties',
        '@babel/plugin-proposal-optional-chaining',
        '@babel/plugin-proposal-nullish-coalescing-operator',
        ['@babel/plugin-transform-runtime', {
            corejs: false,
            helpers: true,
            regenerator: true,
            useESModules: false
        }]
    ],
    env: {
        test: {
            presets: [
                ['@babel/preset-env', {
                    targets: {
                        node: 'current'
                    }
                }]
            ]
        }
    }
};
