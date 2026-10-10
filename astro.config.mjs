import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { unified } from '@astrojs/markdown-remark';
import { remarqueTypo } from './src/lib/typo.mjs';

export default defineConfig({
  site: 'https://humianite.github.io',
  trailingSlash: 'always',
  // Le processeur unified est requis pour appliquer la typographie française au corps des articles.
  markdown: { processor: unified({ remarkPlugins: [remarqueTypo], remarkRehype: { footnoteLabel: 'Notes', footnoteBackLabel: 'Retour au texte' } }) },
  integrations: [mdx()],
});
