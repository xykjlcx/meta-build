import { defineConfig } from 'orval';

export default defineConfig({
  metaBuild: {
    input: {
      target: '../server/api-contract/openapi-v1.json',
    },
    output: {
      target: './packages/api-sdk/src/generated/endpoints',
      schemas: './packages/api-sdk/src/generated/models',
      clean: true,
      client: 'react-query',
      httpClient: 'fetch',
      mode: 'tags-split',
      mock: true,
      override: {
        fetch: {
          includeHttpResponseReturnType: false,
        },
        mutator: {
          path: './packages/api-sdk/src/mutator/custom-instance.ts',
          name: 'customInstance',
        },
        query: {
          useQuery: true,
          useMutation: true,
          signal: true,
        },
      },
    },
  },
});
