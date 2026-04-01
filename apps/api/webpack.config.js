const nodeExternals = require('webpack-node-externals');

module.exports = function (options) {
    return {
        ...options,
        externals: [
            nodeExternals(),
        ],
        plugins: [
            ...(options.plugins || []),
        ],
        resolve: {
            ...options.resolve,
            fallback: {
                ...(options.resolve?.fallback || {}),
            },
        },
        // Suppress optional peer dep warnings from @nestjs/serve-static
        ignoreWarnings: [/Module not found/],
        externalsPresets: { node: true },
    };
};
