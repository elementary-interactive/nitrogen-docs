// astro.config.mjs
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import svelte from '@astrojs/svelte';

export default defineConfig({
    site: 'https://kb.elementary-interactive.dev',
    integrations: [
        starlight({
            title: 'Nitrogen',
            description: 'Frontend Ecosystem for the Nitrogen platform',
            social: {
                gitlab: 'https://gitlab.elementary-interactive.com/nitrogen/nitrogen-docs'
            },
            sidebar: [
                {
                    label: 'Getting Started',
                    items: [
                        { label: 'Overview', slug: 'getting-started/overview' },
                        { label: 'Quickstart', slug: 'getting-started/quickstart' }
                    ]
                },
                {
                    label: 'Packages',
                    items: [
                        { label: 'frontend-seo', autogenerate: { directory: 'packages/frontend-seo' } },
                        { label: 'frontend-tracking', autogenerate: { directory: 'packages/frontend-tracking' } },
                        { label: 'frontend-legal', autogenerate: { directory: 'packages/frontend-legal' } }
                    ]
                },
                {
                    label: 'Skills & Cookbook',
                    autogenerate: { directory: 'skills' }
                },
                {
                    label: 'ADR (Architecture Decisions)',
                    autogenerate: { directory: 'adr' }
                },
                {
                    label: 'Reference',
                    autogenerate: { directory: 'reference' }
                }
            ],
            customCss: ['./src/styles/custom.css'],
            head: [
                // Ironikusan: NEM rakunk tracking-et a doksi site-ra első körben
                // (ne legyen consent banner egy doksin)
            ],
            defaultLocale: 'en',
            locales: {
                en: { label: 'English' }
                // Magyar lokalizáció későbbi ticketben
            }
        }),
        svelte() // for embedding Svelte component demos
    ]
});
