import path from 'node:path';
import { fileURLToPath } from 'node:url';

const frontendRoot = path.dirname(
    fileURLToPath(import.meta.url)
);

const nextConfig = {
    output: 'standalone',
    outputFileTracingRoot: frontendRoot,

    turbopack: {
        root: frontendRoot,
    },

    reactStrictMode: true,

    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
            },
        ],
    },
};

export default nextConfig;