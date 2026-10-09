module.exports = ({ config }) => {
  const baseUrl = process.env.GITHUB_PAGES_BASE_URL;

  return {
    ...config,
    plugins: [...(config.plugins ?? []), 'expo-video'],
    ...(baseUrl
      ? { experiments: { ...config.experiments, baseUrl } }
      : {}),
  };
};
