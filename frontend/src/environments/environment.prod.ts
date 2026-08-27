import { buildTime, version, sourceUrl } from "./version";

export const environment = {
    production: true,
    assets: "/static/assets",
    apiUrl: "/api/",
    vulcanUrl: "/vulcan/",
    buildTime,
    version,
    sourceUrl,
};
