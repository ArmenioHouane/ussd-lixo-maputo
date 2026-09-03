'use strict';
// Pre-load: stub AsyncStorage para que qualquer import subsequente o utilize.
const Module = require('node:module');

const store = new Map();
const stub = {
  default: {
    getItem: async (k) => (store.has(k) ? store.get(k) : null),
    setItem: async (k, v) => {
      store.set(k, v);
    },
    removeItem: async (k) => {
      store.delete(k);
    },
    clear: async () => store.clear(),
    getAllKeys: async () => Array.from(store.keys()),
    multiGet: async (keys) => keys.map((k) => [k, store.get(k) ?? null]),
    multiSet: async (pairs) => pairs.forEach(([k, v]) => store.set(k, v)),
    multiRemove: async (keys) => keys.forEach((k) => store.delete(k)),
  },
  getItem: async (k) => (store.has(k) ? store.get(k) : null),
  setItem: async (k, v) => {
    store.set(k, v);
  },
  removeItem: async (k) => {
    store.delete(k);
  },
  clear: async () => store.clear(),
  getAllKeys: async () => Array.from(store.keys()),
  multiGet: async (keys) => keys.map((k) => [k, store.get(k) ?? null]),
  multiSet: async (pairs) => pairs.forEach(([k, v]) => store.set(k, v)),
  multiRemove: async (keys) => keys.forEach((k) => store.delete(k)),
};

const asyncStoragePath = require.resolve('@react-native-async-storage/async-storage');
require.cache[asyncStoragePath] = {
  id: asyncStoragePath,
  filename: asyncStoragePath,
  loaded: true,
  exports: stub,
  children: [],
  paths: [],
};

const origResolve = Module._resolveFilename;
Module._resolveFilename = function (req) {
  if (req === '@react-native-async-storage/async-storage') return asyncStoragePath;
  return origResolve.apply(this, arguments);
};