// import * as http from 'http'
// import * as mysql from 'mysql2'
// import axios from 'axios'
// import * as dotenv from "dotenv";
const http = require('http')
const mysql = require('mysql2')
const axios = require('axios')
const dotenv = require('dotenv')

dotenv.config()

const server = http.createServer()

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME
});
connection.query('truncate stories', (err, result, fields) => {
  if (err) {
    console.log(err)
  } else {
    console.log('table truncated')
  }
})

let data = {
  missing: []  
}
function insert(values) {
  return new Promise((resolve, reject) => {
    connection.query('INSERT INTO stories (id, data, parent_id, title, text, no_of_children, type, created_at) VALUES ?', [values], async (err) => {
      if (err) {
        reject(err)
      }
      resolve(1)
    });
  })
}

async function fetchItem(id) {
    try {
      return await axios.get(`${process.env.API_URL}/v0/item/${id}.json`)
    } catch (err) {
      console.log(`${process.env.API_URL}/v0/item/${id}.json`, err.message)
      data.missing.push(id)
      return null
    }
}

function fetchData(ids) {
  console.log('processing: ', ids.length)
  return new Promise(async (resolve, reject) => {
    let promises = []
    ids.forEach(id => {
      promises.push(fetchItem(id))
    });

    let result = await Promise.all(promises)
    let results = result.map(res => {
      if (res) {
        return res.data
      }
      return null
    }).filter(res => res )
    
    let values = results.map(res => {
      return [
        res.id,
        JSON.stringify(res),
        res.parent ?? null,
        res.title,
        res.text,
        res.kids ? res.kids.length : 0,
        res.type,
        new Date(res.time * 1000)
      ]
    })

    await insert(values)
    
    let children = []

    results.map(res => {
      if (res.kids) {
        children = children.concat(res.kids)
      }
    })
    while (children.length) {
      await fetchData(children.splice(0, 1000))
    }
    
    resolve(1)
  })
} 

server.on('request', async (request, response) => {
  if (request.method == 'POST') {
    let result = await axios.get(`${process.env.API_URL}/v0/topstories.json`)
    let storyIds = result.data
    await fetchData(storyIds)

    if (data.missing.length) {
      console.log('processng not found')
      await fetchData(data.missing)
      response.end(JSON.stringify(data.missing))
    } else {
      response.end('done')
    }
  }
})

server.listen(process.env.PORT, () => {
  console.log(`server running at localhost:${process.env.PORT}`)
})