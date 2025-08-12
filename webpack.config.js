const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const WebpackPwaManifest = require('webpack-pwa-manifest');
const WorkboxPlugin = require('workbox-webpack-plugin');

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
    mode: isProduction ? 'production' : 'development',
    
    entry: {
        main: './script.js',
        dashboard: './js/dashboard.js',
        services: './js/services.js',
        payment: './js/payment.js',
        auth: './js/auth.js'
    },
    
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: isProduction ? '[name].[contenthash].js' : '[name].js',
        chunkFilename: isProduction ? '[name].[contenthash].chunk.js' : '[name].chunk.js',
        publicPath: '/',
        clean: true
    },
    
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    
    optimization: {
        minimize: isProduction,
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    compress: {
                        drop_console: isProduction,
                        drop_debugger: isProduction
                    }
                }
            }),
            new CssMinimizerPlugin()
        ],
        splitChunks: {
            chunks: 'all',
            cacheGroups: {
                vendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    chunks: 'all',
                    priority: 10
                },
                common: {
                    name: 'common',
                    minChunks: 2,
                    chunks: 'all',
                    priority: 5
                },
                default: {
                    minChunks: 2,
                    priority: -10,
                    reuseExistingChunk: true
                }
            }
        },
        runtimeChunk: {
            name: 'runtime'
        }
    },
    
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            ['@babel/preset-env', {
                                targets: {
                                    browsers: ['> 1%', 'last 2 versions', 'not ie <= 8']
                                },
                                useBuiltIns: 'usage',
                                corejs: 3
                            }]
                        ],
                        plugins: [
                            '@babel/plugin-proposal-class-properties',
                            '@babel/plugin-proposal-optional-chaining',
                            '@babel/plugin-proposal-nullish-coalescing-operator'
                        ]
                    }
                }
            },
            {
                test: /\.css$/,
                use: [
                    isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            importLoaders: 1,
                            sourceMap: !isProduction
                        }
                    },
                    {
                        loader: 'postcss-loader',
                        options: {
                            postcssOptions: {
                                plugins: [
                                    'autoprefixer',
                                    isProduction ? 'cssnano' : null
                                ].filter(Boolean)
                            }
                        }
                    }
                ]
            },
            {
                test: /\.(png|jpe?g|gif|svg|webp)$/i,
                type: 'asset',
                parser: {
                    dataUrlCondition: {
                        maxSize: 8 * 1024 // 8KB
                    }
                },
                generator: {
                    filename: 'images/[name].[hash:8][ext]'
                }
            },
            {
                test: /\.(woff|woff2|eot|ttf|otf)$/i,
                type: 'asset/resource',
                generator: {
                    filename: 'fonts/[name].[hash:8][ext]'
                }
            }
        ]
    },
    
    plugins: [
        new CleanWebpackPlugin(),
        
        // HTML 페이지들
        new HtmlWebpackPlugin({
            template: './index.html',
            filename: 'index.html',
            chunks: ['runtime', 'vendors', 'common', 'main'],
            minify: isProduction ? {
                collapseWhitespace: true,
                removeComments: true,
                removeRedundantAttributes: true,
                removeScriptTypeAttributes: true,
                removeStyleLinkTypeAttributes: true,
                useShortDoctype: true,
                minifyCSS: true,
                minifyJS: true
            } : false
        }),
        
        new HtmlWebpackPlugin({
            template: './dashboard.html',
            filename: 'dashboard.html',
            chunks: ['runtime', 'vendors', 'common', 'dashboard', 'auth'],
            minify: isProduction ? {
                collapseWhitespace: true,
                removeComments: true,
                removeRedundantAttributes: true,
                removeScriptTypeAttributes: true,
                removeStyleLinkTypeAttributes: true,
                useShortDoctype: true,
                minifyCSS: true,
                minifyJS: true
            } : false
        }),
        
        new HtmlWebpackPlugin({
            template: './services.html',
            filename: 'services.html',
            chunks: ['runtime', 'vendors', 'common', 'services', 'auth'],
            minify: isProduction ? {
                collapseWhitespace: true,
                removeComments: true,
                removeRedundantAttributes: true,
                removeScriptTypeAttributes: true,
                removeStyleLinkTypeAttributes: true,
                useShortDoctype: true,
                minifyCSS: true,
                minifyJS: true
            } : false
        }),
        
        new HtmlWebpackPlugin({
            template: './payment.html',
            filename: 'payment.html',
            chunks: ['runtime', 'vendors', 'common', 'payment', 'auth'],
            minify: isProduction ? {
                collapseWhitespace: true,
                removeComments: true,
                removeRedundantAttributes: true,
                removeScriptTypeAttributes: true,
                removeStyleLinkTypeAttributes: true,
                useShortDoctype: true,
                minifyCSS: true,
                minifyJS: true
            } : false
        }),
        
        // CSS 추출
        ...(isProduction ? [
            new MiniCssExtractPlugin({
                filename: '[name].[contenthash].css',
                chunkFilename: '[name].[contenthash].chunk.css'
            })
        ] : []),
        
        // 정적 파일 복사
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: 'server',
                    to: 'server',
                    globOptions: {
                        ignore: ['**/node_modules/**']
                    }
                },
                {
                    from: '*.html',
                    to: '[name][ext]',
                    globOptions: {
                        ignore: ['**/index.html', '**/dashboard.html', '**/services.html', '**/payment.html']
                    }
                },
                {
                    from: '*.css',
                    to: '[name][ext]',
                    globOptions: {
                        ignore: ['**/styles.css']
                    }
                },
                {
                    from: 'sw.js',
                    to: 'sw.js'
                }
            ]
        }),
        
        // PWA Manifest - 아이콘 파일이 준비되면 활성화
        // new WebpackPwaManifest({
        //     name: 'MarketGrow - SNS 마케팅 서비스',
        //     short_name: 'MarketGrow',
        //     description: '전문적인 SNS 마케팅 서비스 플랫폼',
        //     background_color: '#ffffff',
        //     theme_color: '#007bff',
        //     start_url: '/',
        //     display: 'standalone',
        //     orientation: 'portrait',
        //     icons: [
        //         {
        //             src: path.resolve('assets/icon.png'),
        //             sizes: [96, 128, 192, 256, 384, 512],
        //             destination: path.join('icons'),
        //             purpose: 'any maskable'
        //         }
        //     ],
        //     publicPath: '/'
        // }),
        
        // Service Worker (프로덕션만)
        ...(isProduction ? [
            new WorkboxPlugin.InjectManifest({
                swSrc: './sw.js',
                swDest: 'sw.js',
                maximumFileSizeToCacheInBytes: 5 * 1024 * 1024 // 5MB
            })
        ] : [])
    ],
    
    resolve: {
        extensions: ['.js', '.json'],
        alias: {
            '@': path.resolve(__dirname, './'),
            '@js': path.resolve(__dirname, './js'),
            '@css': path.resolve(__dirname, './css'),
            '@assets': path.resolve(__dirname, './assets')
        }
    },
    
    devServer: {
        static: {
            directory: path.join(__dirname, 'dist')
        },
        port: 3000,
        hot: true,
        open: true,
        historyApiFallback: true,
        compress: true,
        proxy: {
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true,
                secure: false
            }
        }
    },
    
    performance: {
        hints: isProduction ? 'warning' : false,
        maxEntrypointSize: 512000,
        maxAssetSize: 512000
    },
    
    stats: {
        colors: true,
        modules: false,
        children: false,
        chunks: false,
        chunkModules: false
    }
};