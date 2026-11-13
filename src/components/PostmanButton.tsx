import React from 'react';

type Props = {
  /** The collection's public address on Postman. */
  href: string;
  /** The button's text. */
  children?: React.ReactNode;
};

/** The link to the Postman collection, drawn as a button in Postman's orange so it is found at a glance. */
export default function PostmanButton({href, children}: Props): React.ReactElement {
  return (
    <a className="alfa-postman" href={href} target="_blank" rel="noopener noreferrer">
      <span className="alfa-postman__mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="18" height="18">
          <path d="M3.4 20.4 21 12 3.4 3.6l-.01 6.53L15 12 3.39 13.87z" fill="currentColor" />
        </svg>
      </span>
      <span className="alfa-postman__text">
        <strong>{children ?? 'Open the collection in Postman'}</strong>
        <small>Every route, with a test on each request</small>
      </span>
    </a>
  );
}
