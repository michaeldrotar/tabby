export const getEnv = () => {
  return {
    IS_DEV: process.env['CLI_CEB_DEV'] === 'true',
    IS_PROD: process.env['CLI_CEB_DEV'] !== 'true',
    IS_FIREFOX: process.env['CLI_CEB_FIREFOX'] === 'true',
    IS_CI: process.env['CEB_CI'] === 'true',
    ENABLE_SOURCEMAPS: process.env['CLI_CEB_SOURCEMAPS'] === 'true',
    BUILD_OUT_DIR: process.env['CLI_CEB_OUT_DIR'] || 'dist',
  }
}
