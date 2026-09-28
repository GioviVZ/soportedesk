import nxPlugin from '@nx/eslint-plugin';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: ['dist/**', '.angular/**', '.nx/**', '.tmp/**', 'node_modules/**'],
  },
  {
    files: ['**/*.ts'],
    linterOptions: {
      reportUnusedDisableDirectives: false,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@nx': nxPlugin,
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: false,
          allow: [],
          depConstraints: [
            {
              sourceTag: 'scope:auditoria',
              onlyDependOnLibsWithTags: ['scope:core', 'scope:ui'],
            },
            {
              sourceTag: 'scope:auth',
              onlyDependOnLibsWithTags: ['scope:core', 'scope:ui'],
            },
            {
              sourceTag: 'scope:wifi',
              onlyDependOnLibsWithTags: ['scope:core', 'scope:ui'],
            },
            {
              sourceTag: 'scope:usuarios-sistema',
              onlyDependOnLibsWithTags: ['scope:core', 'scope:ui'],
            },
            {
              sourceTag: 'scope:correos',
              onlyDependOnLibsWithTags: ['scope:core', 'scope:ui'],
            },
            {
              sourceTag: 'scope:licencias',
              onlyDependOnLibsWithTags: ['scope:core', 'scope:ui'],
            },
            {
              sourceTag: 'scope:impresoras',
              onlyDependOnLibsWithTags: ['scope:core', 'scope:ui'],
            },
            {
              sourceTag: 'scope:equipos',
              onlyDependOnLibsWithTags: ['scope:core', 'scope:ui'],
            },
            {
              sourceTag: 'scope:herramientas',
              onlyDependOnLibsWithTags: ['scope:core', 'scope:ui'],
            },
            {
              sourceTag: 'scope:usuarios-red',
              onlyDependOnLibsWithTags: ['scope:core', 'scope:ui'],
            },
            {
              sourceTag: 'scope:vpn',
              onlyDependOnLibsWithTags: [
                'scope:core',
                'scope:ui',
                'scope:equipos',
              ],
            },
            {
              sourceTag: 'scope:catalogos',
              onlyDependOnLibsWithTags: [
                'scope:core',
                'scope:ui',
                'scope:vpn',
              ],
            },
            {
              sourceTag: 'scope:dashboard',
              onlyDependOnLibsWithTags: ['scope:core', 'scope:ui'],
            },
            {
              sourceTag: 'type:ui',
              onlyDependOnLibsWithTags: ['type:ui', 'type:data-access'],
            },
            {
              sourceTag: 'type:data-access',
              onlyDependOnLibsWithTags: ['type:data-access'],
            },
            {
              sourceTag: 'type:app',
              onlyDependOnLibsWithTags: ['*'],
            },
          ],
        },
      ],
    },
  },
];
