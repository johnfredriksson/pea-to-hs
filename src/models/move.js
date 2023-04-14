const move = {
  /**
     *
     * @param  {object} client - A PEA client object
     * @return {object}        - An object with PEA client data
     *                           in a format suited to HubSpot
     */
  createCompanyObject: (client) => {
    const companyObject = {
      properties: {},
    };

    for (const [key, value] of Object.entries(client)) {
      switch (key) {
        case 'name':
          companyObject.properties.name = value;
          break;
        case 'email':
          companyObject.properties.owneremail = value;
          companyObject.properties.domain = value.split('@')[1];
          break;
        case 'phone':
          companyObject.properties.phone = value;
          break;
        case 'address':
          companyObject.properties.address = value['address1'];
          companyObject.properties.address2 = value['address2'];
          companyObject.properties.state = value['state'];
          companyObject.properties.zip = value['zip-code'];
          companyObject.properties.country = value['country'];
      }
    }

    return companyObject;
  },
  moveCompanies: async (companies, hubspotClient, hsClients) => {
    const newCompanies = [];
    const existingCompanies = [];

    companies.forEach((company) => {
      if (hsClients[company.properties.name]) {
        company.id = hsClients[company.properties.name];
        existingCompanies.push(company);
      } else {
        newCompanies.push(company);
      }
    });
    await hubspotClient.crm.companies.batchApi.create(
        {inputs: newCompanies},
    );
    await hubspotClient.crm.companies.batchApi.update(
        {inputs: existingCompanies},
    );
  },
};

module.exports = move;
