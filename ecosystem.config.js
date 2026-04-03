module.exports = {
  apps: [
    {
      name: 'voxcite-api',
      script: 'packages/server/dist/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
    },
  ],
};
