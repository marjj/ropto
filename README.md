# ropto test

## Installation

```bash
npm install
```

## Setup
Copy sample env and input db details

```bash
cp .env-sample .env
```
```bash
API_URL=https://hacker-news.firebaseio.com
PORT=3000
DB_HOST=localhost
DB_NAME=ropto_test
DB_USER=root
DB_PASSWORD=
```

## Migrate and Run
Create database table and start running application
```bash
npm run start
```

Local server should be running at http://localhost:3000