module.exports = ({ config }) => {
  const baseUrl = process.env.GITHUB_PAGES_BASE_URL;

  return {
    ...config,
    ...(baseUrl
      ? { experiments: { ...config.experiments, baseUrl } }
      : {}),
  };
};

