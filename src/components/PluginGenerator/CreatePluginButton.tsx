import React from 'react';
import Link from '@docusaurus/Link';

type Props = {
  /** The plugin type the generator opens with: payment, shipping, itemfield, formfield, media, adminscreen, adminpanel or system. */
  type: string;
};

/** The button at the top right of a plugin type's pages. It opens the plugin generator with that type chosen. */
export default function CreatePluginButton({type}: Props): React.ReactElement {
  return (
    <Link className="button button--primary button--sm alfa-create-plugin" to={`/docs/plugins/plugin-generator?type=${type}`}>
      Create this plugin
    </Link>
  );
}
