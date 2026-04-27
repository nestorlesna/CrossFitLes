// Versión actual — mantener sincronizada con versionName en android/app/build.gradle
export const APP_VERSION = '1.0.14';

// Repositorio GitHub donde se publican las releases con la APK
// TODO: reemplazar con tu usuario y repo de GitHub
const GITHUB_OWNER = 'nestorlesna';
const GITHUB_REPO = 'CrossFitLes';
export const VERSION_CHECK_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;
