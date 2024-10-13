// Modified version to use PyOxidizer
// May also allow to use a backend as was previously intended, so keeping any async function async

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

export function formatByVersion(version, data) {
  return {
    version: "TODO PARAMETERIZE",
    currentVersion: "TODO PARAMETERIZE ALSO",
    formatted_code: `Hello guyz!\n${data.source}`,
  };
}
