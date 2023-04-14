# PE Accounting to HubSpot Client Transfer
This application was built as an artefact in a case study for a diploma of Higher Education in Software Engineering with Emphasis on Web Programming.

The paper explores the posibility to automate the proccess of migrating the PE Accounting Client property into the HubSpot Company property.

## Setup

### Environmental Variables

The application requires environmental variables to function, create new .env file in the root directory

```bash
touch .env
```

Fill the .env with the following variables, swapping the values to your credentials

```bash
CLIENT_ID='YOUR_CLIENT_ID'
CLIENT_SECRET='YOUR_CLIENT_SECRET'
SCOPE='YOUR_SCOPE'
REDIRECT_URI='YOUR_REDIRECT_URI'
```


### Install Dependencies

Navigate to the root folder and install dependencies

```bash
npm install
```

### Start The Application

Start the application

```bash
node app.js
```

### Go To Application

The application is now available at [localhost:4000](http://localhost:4000)

## How it works

The flow of the application starts by logging in, using Oauth2 with your HubSpot credentials. Upon successful authentication, you will be prompted to enter your PE Accounting credentials, company id and API-key. Upon correct successful authentication, all clients will be retreived from PE Accounting as well as all companies from HubSpot. Each client will be transformed into a company object. The application tries to populate the following properties in the company object

```js
name // Always populated
owneremail
phone
address
address2
state
zip
country

domain // If email is present
```

When the transformation is complete, you will be presented with a form to enter the URL to each company. It's not required to enter the URL, but if its populated, HubSpot can automatically fill additional properties.

Once confirmed, the application will transfer the clients to your HubSpot account. If the company already exists, it will be updated with the values supplied, if not, it will create a new entry.
