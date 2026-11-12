// Trên Render (Node.js Web Service), dùng Next.js server thông thường.
// Với Docker local, giữ standalone để tương thích Dockerfile.frontend.
// Render đặt RENDER=true trong cả giai đoạn build và chạy.
const isRenderNode = process.env.RENDER === 'true' && process.env.BREWLITE_RENDER_DOCKER !== 'true';

const nextConfig = {
    reactStrictMode: true,
    ...(isRenderNode ? {} : { output: 'standalone' }),
};

export default nextConfig;
