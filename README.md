# Proxy Server Application

## Overview

A Node.js and Express.js-based proxy server that handles redemption codes, interfacing with Airtable to manage and update redemption statuses. It implements robust error handling, efficient caching, secure HTTP headers, and persistent connections via HTTP keep-alive to reduce timeout errors.

## Features

- **Receive Order Data:** Processes incoming order data, extracts redemption codes from order line items, updates their status in Airtable, and caches the result. See [`routes/receiveOrderData.js`](routes/receiveOrderData.js).
- **Get Redemption Status:** Retrieves the status of redemption codes by first checking an in-memory cache (via [`utils/cache.js`](utils/cache.js)) and, if necessary, querying Airtable. See [`routes/getRedemptionStatus.js`](routes/getRedemptionStatus.js).
- **Security:** Uses [`helmet`](https://helmetjs.github.io/) to secure HTTP headers, [`cors`](https://github.com/expressjs/cors) for Cross-Origin Resource Sharing, and [`express-rate-limit`](https://github.com/nfriedly/express-rate-limit) to mitigate abuse.
- **Connection Management:** Implements HTTP and HTTPS keep-alive in [`app.js`](app.js) to manage persistent connections and help avoid ETIMEDOUT errors.
- **Error Handling:** Uses [`winston`](https://github.com/winstonjs/winston) for robust logging to both the console and a log file (`error.log`), while providing global error handling.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Project Structure](#project-structure)
- [Dependencies](#dependencies)
- [Environment Variables](#environment-variables)
- [License](#license)

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v12 or later)
- [npm](https://www.npmjs.com/)
- [Git](https://git-scm.com/)

### Steps

1. **Clone the repository:**

   ```sh
   git clone <repository-url>
   ```

2. **Navigate to the project directory:**

   ```sh
   cd <project-directory>
   ```

3. **Install dependencies:**

   ```sh
   npm install
   ```

4. **Configure Environment Variables:**

   Create a `.env` file in the root directory and define the following variable:

   - `AIRTABLE_API_KEY`: Your Airtable API key.

   Example:

   ```env
   AIRTABLE_API_KEY=your_airtable_api_key_here
   ```

## Running the Application

1. **Start the server:**

   ```sh
   npm start
   ```

   The server will run on the port defined in the `.env` file or default to port 3000. You can verify the server is running by navigating to [http://localhost:3000](http://localhost:3000).

## API Endpoints

### POST `/api/order-data`

- **Purpose:** Receives order data, extracts redemption codes, and updates each corresponding Airtable record's status to "Already Redeemed". It also caches the updated status.
- **Implementation:** [`routes/receiveOrderData.js`](routes/receiveOrderData.js)

### GET `/api/redemption-code-status/:redemptionCode`

- **Purpose:** Retrieves the redemption status for a given code. The endpoint first checks an in-memory cache (to reduce redundant calls to Airtable) and then falls back to an Airtable query if necessary.
- **Implementation:** [`routes/getRedemptionStatus.js`](routes/getRedemptionStatus.js)

## Project Structure

- [`app.js`](app.js): Main entry point that sets up the Express server, configures middleware, registers routes, and handles connection keep-alive.
- [`routes/receiveOrderData.js`](routes/receiveOrderData.js): Handles incoming order data and updates Airtable redemption statuses.
- [`routes/getRedemptionStatus.js`](routes/getRedemptionStatus.js): Handles retrieval of redemption statuses with caching logic.
- [`utils/airtable.js`](utils/airtable.js): Contains functions to interact with the Airtable API (retrieving and updating records).
- [`utils/cache.js`](utils/cache.js): Implements an in-memory cache using NodeCache to improve performance.
- [`package.json`](package.json): Lists project dependencies and scripts.
- [`Procfile`](Procfile): Configuration for deploying the application.
- [`.env`](.env): File for securely storing environment variables (e.g., `AIRTABLE_API_KEY`).

## Dependencies

- **Express:** Web framework used to create the server.
- **Airtable:** API client for interacting with Airtable.
- **dotenv:** Loads environment variables from a `.env` file.
- **helmet:** Secures Express apps by setting various HTTP headers.
- **cors:** Enables Cross-Origin Resource Sharing.
- **express-rate-limit:** Provides rate limiting to mitigate abuse.
- **node-cache:** Implements in-memory caching to reduce API call frequency.
- **winston:** Logging library to capture and log errors.

For a complete list and version details, refer to [`package.json`](package.json).

## Environment Variables

- `AIRTABLE_API_KEY`: Your Airtable API key, used for authenticating and interacting with the Airtable API.

## License

Licensed under the terms specified in the project license.

