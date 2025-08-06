module.exports = {
    plugins: [
        require('autoprefixer')({
            overrideBrowserslist: [
                '> 1%',
                'last 2 versions',
                'not dead',
                'not ie <= 11'
            ],
            grid: true
        }),
        ...(process.env.NODE_ENV === 'production' ? [
            require('cssnano')({
                preset: ['default', {
                    discardComments: {
                        removeAll: true
                    },
                    normalizeWhitespace: false,
                    colormin: false,
                    minifySelectors: false
                }]
            })
        ] : [])
    ]
};