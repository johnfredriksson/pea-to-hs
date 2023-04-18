const createCompanyObject = require('../../../src/models/move')
    .createCompanyObject;

test('should return a company object with all properties', () => {
  const client = {
    name: 'clientName',
    email: 'client@email.test',
    phone: '123-4 12 34 56',
    address: {
      'address1': 'first address',
      'address2': 'second address',
      'zip-code': 'zip code',
      'state': 'state',
      'country': 'country',
    },
  };

  const result = createCompanyObject(client);
  expect(result).toEqual({
    properties: {
      name: 'clientName',
      owneremail: 'client@email.test',
      phone: '123-4 12 34 56',
      domain: 'email.test',
      address: 'first address',
      address2: 'second address',
      zip: 'zip code',
      state: 'state',
      country: 'country',
    },
  });
});

test('should return a company object with some properties', () => {
  const client = {
    name: 'clientName',
    phone: '123-4 12 34 56',
    address: {
      address1: 'first address',
      state: 'state',
      country: 'country',
    },
  };

  const result = createCompanyObject(client);
  expect(result).toEqual({
    properties: {
      name: 'clientName',
      phone: '123-4 12 34 56',
      address: 'first address',
      state: 'state',
      country: 'country',
    },
  });
});

test('should return a company object with name property', () => {
  const client = {
    name: 'clientName',
  };

  const result = createCompanyObject(client);
  expect(result).toEqual({
    properties: {
      name: 'clientName',
    },
  });
});

test('should return a company object with some properties', () => {
  const client = {
    name: 'clientName',
    phone: '123-4 12 34 56',
    email: 'client.se',
    address: {
      address1: 'first address',
      state: 'state',
      country: 'country',
    },
  };

  const result = createCompanyObject(client);
  expect(result.properties.owneremail).toEqual('client.se');
  expect(result.properties.domain).toEqual(undefined);
});
