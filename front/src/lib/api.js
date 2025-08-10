// Modified version to use PyOxidizer
// May also allow to use a backend as was previously intended, so keeping any async function async

import { lintBlack } from './pyodide-consumer';

function urlByVersion(v) {
  return "TODO PARAMETERIZE";
}

export async function getStableVersion() {
  return "TODO PARAMETERIZE";
}

export async function getLatestVersion() {
  return "TODO PARAMETERIZE";
}

export async function loadState(version, state) {
  return {version: "TODO PARAMETERIZE", currentVersion: "TODO PARAMETERIZE ALSO", formatted_code: "Hello guyz"};
}

export async function formatByVersion(version, data) {
  const obj = await lintBlack(data.source);
  return {
    version: "TODO PARAMETERIZE",
    currentVersion: "TODO PARAMETERIZE ALSO",
    formatted_code: obj?.msg ?? '',  // TODO : Also something with .isError?
  };
}
