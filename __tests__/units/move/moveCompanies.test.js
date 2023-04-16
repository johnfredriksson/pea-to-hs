const moveCompanies = require('../../../src/models/move')
    .moveCompanies;
const hubspot = require('@hubspot/api-client');

const hubspotClient = new hubspot.Client({accessToken: 'test'});
hubspotClient.crm.companies.batchApi.create = jest.fn(() =>
  Promise.resolve(
      'finished',
  ),
);

hubspotClient.crm.companies.batchApi.update = jest.fn(() =>
  Promise.resolve(
      'finished',
  ),
);

test('should return two existing companies, no new', async () => {
  const companies = [
    {
      properties: {
        name: 'company one',
        owneremail: 'companyone@email.test',
        phone: '1111111111',
        domain: 'email.test',
        address: 'company one first address',
        address2: 'company one second address',
        zip: 'company one zip code',
        state: 'company one state',
        country: 'company one country',
      },
    },
    {
      properties: {
        name: 'company two',
        owneremail: 'companytwo@email.com',
        phone: '2222222222',
        domain: 'email.com',
        address: 'company two first address',
        zip: 'company two zip code',
        country: 'company two country',
      },
    },
  ];

  const hsClients = {
    'company one': 123,
    'company two': 456,
  };

  const data = await moveCompanies(companies, hubspotClient, hsClients);
  expect(data.existingCompanies.length).toEqual(2);
  expect(data.newCompanies.length).toEqual(0);
});

test('should return two new companies, no existing', async () => {
  const companies = [
    {
      properties: {
        name: 'company three',
        owneremail: 'companythree@email.test',
        phone: '3333333333',
        domain: 'email.test',
        address: 'company three first address',
        address2: 'company three second address',
        zip: 'company three zip code',
        state: 'company three state',
        country: 'company three country',
      },
    },
    {
      properties: {
        name: 'company four',
        owneremail: 'companyfour@email.com',
        phone: '2222222222',
        domain: 'email.com',
        address: 'company four first address',
        zip: 'company four zip code',
        country: 'company four country',
      },
    },
  ];

  const hsClients = {
    'company one': 123,
    'company two': 456,
  };

  const data = await moveCompanies(companies, hubspotClient, hsClients);
  expect(data.newCompanies.length).toEqual(2);
  expect(data.existingCompanies.length).toEqual(0);
});

test('should return one new company, one existing', async () => {
  const companies = [
    {
      properties: {
        name: 'company one',
        owneremail: 'companyone@email.test',
        phone: '3333333333',
        domain: 'email.test',
        address: 'company one first address',
        address2: 'company one second address',
        zip: 'company one zip code',
        state: 'company one state',
        country: 'company one country',
      },
    },
    {
      properties: {
        name: 'company four',
        owneremail: 'companyfour@email.com',
        phone: '2222222222',
        domain: 'email.com',
        address: 'company four first address',
        zip: 'company four zip code',
        country: 'company four country',
      },
    },
  ];

  const hsClients = {
    'company one': 123,
    'company two': 456,
  };

  const data = await moveCompanies(companies, hubspotClient, hsClients);
  expect(data.newCompanies.length).toEqual(1);
  expect(data.existingCompanies.length).toEqual(1);
});

test('should return one new company', async () => {
  const companies = [
    {
      properties: {
        name: 'company three',
        owneremail: 'companythree@email.test',
        phone: '3333333333',
        domain: 'email.test',
        address: 'company three first address',
        address2: 'company three second address',
        zip: 'company three zip code',
        state: 'company three state',
        country: 'company three country',
      },
    },
  ];

  const hsClients = {
    'company one': 123,
    'company two': 456,
  };

  const data = await moveCompanies(companies, hubspotClient, hsClients);
  expect(data.newCompanies.length).toEqual(1);
  expect(data.existingCompanies.length).toEqual(0);
});

test('should return one new company', async () => {
  const companies = [
    {
      properties: {
        name: 'company one',
        owneremail: 'companyone@email.test',
        phone: '3333333333',
        domain: 'email.test',
        address: 'company one first address',
        address2: 'company one second address',
        zip: 'company one zip code',
        state: 'company one state',
        country: 'company one country',
      },
    },
  ];

  const hsClients = {
    'company one': 123,
    'company two': 456,
  };

  const data = await moveCompanies(companies, hubspotClient, hsClients);
  expect(data.existingCompanies.length).toEqual(1);
  expect(data.newCompanies.length).toEqual(0);
});
