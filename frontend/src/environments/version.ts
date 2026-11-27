import packageJson from '../../package.json';

declare const __APP_VERSION__: string | undefined;
declare const __BUILD_TIME__: string | undefined;

export const version = typeof __APP_VERSION__ === 'undefined' ? packageJson.version : __APP_VERSION__;
export const buildTime = typeof __BUILD_TIME__ === 'undefined' ? '' : __BUILD_TIME__;
export const sourceUrl = 'https://github.com/CentreForDigitalHumanities/parseport';
