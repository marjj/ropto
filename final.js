const http = require('http')
const mysql = require('mysql2')
const axios = require('axios')
const dotenv = require('dotenv')

dotenv.config()

const server = http.createServer()

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD
});

let data = {
  missing: []  
}
function insert(values) {
  return new Promise((resolve, reject) => {
    let sql = 'INSERT INTO stories (id, parent_id, title, text, no_of_children, type, created_at) VALUES ?'
    connection.query(sql, [values], async (err) => {
      if (err) {
        reject(err)
      }
      resolve(true)
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
    
    resolve(true)
  })
} 

server.on('request', async (request, response) => {
  if (request.method == 'POST') {
    let result = await axios.get(`${process.env.API_URL}/v0/topstories.json`)
    let storyIds = result.data
    await fetchData(storyIds)

    if (data.missing.length) {
      await fetchData(data.missing)
    }

    response.end('done')
  }
})

server.listen(process.env.PORT, () => {
  console.log(`server running at localhost:${process.env.PORT}`)
})