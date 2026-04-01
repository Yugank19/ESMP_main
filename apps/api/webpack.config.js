const nodeExternals = require('webpack-node-externals');

module.exports = function (options) {
    return {
        ...options,
        externals: [
            nodeExternals({
                allowlist: [/^@esmp\/shared/],
            }),
            {
                '@fastify/static': 'commonjs @fastify/static',
                'cache-manager': 'commonjs cache-manager',
            },
        ],
        plugins: [
            ...(options.plugins || []),
        ],
        ignoreWarnings: [
            { module: /@nestjs\/common/ },
            { module: /@nestjs\/core/ },
            { module: /express/ },
            /Critical dependency/
        ],
        stats: {
            errorDetails: true,
        },
    };
};
