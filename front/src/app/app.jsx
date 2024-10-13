// TODO : Remove whole? Use home-page as main?
import React from 'react';
import HomePage from './home-page';
import { getStableVersion, getLatestVersion, loadState } from '../lib/api'

async function getData({ query }) {
  let mainVersion;
  let stableVersion;
  let currentVersion = query.version || 'stable';
  let json = await loadState(currentVersion, query.state);

  if (currentVersion === 'main') {
    mainVersion = json.version;
    stableVersion = await getStableVersion();
  } else {
    stableVersion = json.version;
    mainVersion = await getLatestVersion();
  }

  return {
    props: {
      source: json.source_code,
      formatted: json.formatted_code,
      options: json.options,
      state: json.state,
      issueLink: json.issue_link,
      version: currentVersion,
      currentVersion:
        currentVersion === 'stable' ? `v${stableVersion}` : `@${mainVersion}`,
      versions: {
        stable: stableVersion,
        main: mainVersion,
      },
    },
  };
}

export default function App({ searchParams }) {
  // const { props } = await getData({ query: searchParams });  // TODO : Put it back
  const props = {version: 'f', currentVersion: 'g', options: {}};

  return <HomePage props={props} />;
}
