import React from 'react';

type Props = {
  /** The Alfa Commerce release this page was last checked against, for example "2.2.0". */
  verified: string;
};

/**
 * Each page records, in its source, the release it was last checked against: <AlfaVersion verified="2.2.0" />.
 * Nothing is printed on the page. The manual describes the current stable release, so a reader needs no version
 * line, and no page has to be touched when a release comes out. The record stays for whoever maintains the page.
 */
export default function AlfaVersion(_props: Props): React.ReactElement | null {
  return null;
}
