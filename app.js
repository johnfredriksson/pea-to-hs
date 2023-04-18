/**
 * -- PeaToHs --
 *
 * - A web application that automates the transfer of clients from
 *   PE Accounting into HubSpot companies.
 *
 * - Application main script.
 *   Execute by running 'node app.js while in root folder,
 *   application is then accessed at localhost:4000
 *
 * @author John Fredriksson
 *
 */

// =====IMPORTS================================================================

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const hubspot = require('@hubspot/api-client');
const bodyParser = require('body-parser');
const authModel = require('./src/models/auth.js');
const moveModel = require('./src/models/move.js');
const fetcherModel = require('./src/models/fetcher.js');
const path = require('path');
const flash = require('express-flash-notification');
const cookieParser = require('cookie-parser');
const NodeCache = require( 'node-cache' );

// Testing purposes only
// const mockClients = require('./mockdata/clients/clients.js');

// =====ENVIRONMENTAL VARIABLES================================================

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const SCOPE = (process.env.SCOPE.split(/ |, ?|%20/)).join(' ');

// =====MISC===================================================================

let accessToken = new NodeCache({deleteOnExpire: true});
let refreshToken = {};
let companies;
let hubspotClient;
let peaClients;
let hsClients;


// =====EXPRESS SETUP/MIDDLEWARE===============================================

const app = express();
const urlencodedParser = bodyParser.urlencoded({extended: false});
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(session({
  secret: Math.random().toString(36).substring(2),
  resave: false,
  saveUninitialized: true,
}));
app.use(flash(app));

// =====TOKEN HANDLING=========================================================

/**
 * Checks if the access token is still valid
 * - if not, the token is refreshed using the refreshToken
 *
 * @param   {object} req - The express request object
 *
 * @return {string}      - A string explaining outcome
 */
async function validateToken(req) {
  if (!accessToken.get(req.sessionID)) {
    const formData = {
      grant_type: 'refresh_token',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      refresh_token: refreshToken[req.sessionID],
    };
    const tokens = await authModel.exchangeForToken(formData);

    setTokens(req, tokens);

    return 'Refreshed';
  }
  return 'Valid';
}

/**
 * - Sets various tokens:
 *   access token to Node Cache with specified TTL
 *   and refresh token to refreshToken.
 *
 * @param  {object} req    - The express request object
 * @param  {object} tokens - The token object containing access, refresh and TTL
 *
 * @return {void}
 */
function setTokens(req, tokens) {
  accessToken.set(
      req.sessionID,
      tokens.access_token,
      Math.round(tokens.expires_in * 0.75),
  );
  refreshToken[req.sessionID] = tokens.refresh_token;
  hubspotClient = new hubspot.Client({accessToken: tokens.access_token});
}

/**
 * - Resets all data
 *
 * @param  {object} req
 *
 * @return {void}
 */
function logout(req) {
  accessToken = new NodeCache({deleteOnExpire: true});
  refreshToken = {};
  companies = [];
  hubspotClient = undefined;
  peaClients = undefined;
  hsClients = undefined;
}

// =====ROUTES=================================================================


/**
* - Index
*
* - If authorized, the user will be prompted to enter PEA credentials
*   to proceed. If not authorized, the user will be prompted to authorize
*   through HubSpot to proceed.
*/
app.get('/', async (req, res) => {
  if (authModel.isAuthorized(req.sessionID, refreshToken)) {
    await validateToken(req);

    return res.render('index');
  }
  const data = {
    authUrl: authModel.authUrl(CLIENT_ID, SCOPE, REDIRECT_URI),
  };

  return res.render('auth', data);
});

/**
 * - OAuth Callback
 *
 * - Catches the redirect from OAuth, proceeds to exchange
 *   received code for access token. If failed, redirects
 *   to index with error message.
 */
app.get('/auth/oauth-callback', async (req, res) => {
  if (req.query.code) {
    try {
      const formData = {
        grant_type: 'authorization_code',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        code: req.query.code,
      };

      const tokens = await authModel.exchangeForToken(formData);

      setTokens(req, tokens);

      return res.redirect('/');
    } catch (error) {
      return req.flash('error', error.message, '/');
    }
  }
  return req.flash('error', 'OAuth code missing', '/');
});

/**
 * - Clients fetch
 *
 * - Collects PEA clients and HubSpot companies by using access
 *   token and credentials from form.
 *
 */
app.post('/clients', urlencodedParser, async (req, res) => {
  if (authModel.isAuthorized(req.sessionID, refreshToken)) {
    await validateToken(req);
    if (req.body.companyId && req.body.apiKey) {
      try {
        peaClients = await fetcherModel.getPeaClients(
            req.body.companyId,
            req.body.apiKey,
        );

        // peaClients = mockClients; // FOR TESTING PURPOSES

        hsClients = await fetcherModel.getHsCompanies(hubspotClient);

        companies = [];

        peaClients.forEach((client) =>
          companies.push(moveModel.createCompanyObject(client)));

        return res.redirect('/clients');
      } catch (error) {
        return req.flash('error', error.message, '/');
      }
    }
    return req.flash('error', 'Company id or API key missing', '/');
  }
  return req.flash('error', 'Not authorized', '/');
});

/**
 * Clients display
 *
 * - Displays all clients in the application, presents a
 *   form to supply domain names.
 */
app.get('/clients', (req, res) => {
  if (authModel.isAuthorized(req.sessionID, refreshToken)) {
    const data = {
      peaClients: companies,
      hsClients: hsClients,
    };

    return res.render('clients', data);
  }
  return req.flash('error', 'Not authorized', '/');
});

/**
 * - Move the clients
 *
 * - Performs the transfer of the new company objects towards HubSpot
 *   and delivers a status page after transfer is complete.
 */
app.post('/move', urlencodedParser, async (req, res) => {
  try {
    if (authModel.isAuthorized(req.sessionID, refreshToken)) {
      await validateToken(req);
      companies.forEach((company) => {
        company.properties.domain = req.body[company.properties.name];
      });

      await moveModel.moveCompanies(companies, hubspotClient, hsClients);

      return res.render('complete');
    }
  } catch (error) {
    req.flash('error', 'An error occured', '/');
  }

  return req.flash('error', 'Not authorized', '/');
});

/**
 * - Logout
 *
 * - Reset all data and variables and return to index.
 */
app.get('/logout', (req, res) => {
  logout();

  return req.flash('success', 'You\'ve been logged out', '/');
});

/**
 * 404 Route
 *
 * - Catches all non existent routes and redirects to index.
 */
app.get('*', (req, res) => {
  res.redirect('/');
});

// =====RUNNING================================================================

// Start the server
app.listen(4000);
