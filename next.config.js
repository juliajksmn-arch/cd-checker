/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'i.discogs.com', pathname: '/**' },
      { protocol: 'https', hostname: 'st.discogs.com', pathname: '/**' },
    ],
  },
};

module.exports = nextConfig;
