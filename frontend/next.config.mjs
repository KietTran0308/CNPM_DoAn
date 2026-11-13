const isRenderNode = process.env.RENDER === 'true' && process.env.BREWLITE_RENDER_DOCKER !== 'true';

const nextConfig = {
    reactStrictMode: true,
    ...(isRenderNode ? {} : { output: 'standalone' }),
};

export default nextConfig;
