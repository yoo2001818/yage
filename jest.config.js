module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  automock: false,
  roots: ['<rootDir>/src/'],
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
};
