module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.spec.ts', '**/test/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  transform: {
    '^.+\\.(t|j)sx?$': [
      '@swc/jest',
      {
        module: {
          type: 'commonjs',
        },
      },
    ],
  },
  modulePathIgnorePatterns: ['<rootDir>/.next/'],
  verbose: true,
};
