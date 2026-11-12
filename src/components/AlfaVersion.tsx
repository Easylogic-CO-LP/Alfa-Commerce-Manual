import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

type Props = {
  /** The Alfa Commerce release this page was last checked against, for example "2.2.0". */
  verified: string;
};

/**
 * The version line under a page's title. The documented release is set once for the whole site
 * (customFields.alfaVersion in docusaurus.config.ts); each page states only the release it was last
 * checked against.
 */
export default function AlfaVersion({verified}: Props): React.ReactElement {
  const {siteConfig} = useDocusaurusContext();
  const documented = String(siteConfig.customFields?.alfaVersion ?? '');

  return (
    <p className="alfa-version">
      This manual documents Alfa Commerce {documented}. This page was last verified against {verified}.
    </p>
  );
}
