const dotenv = require('dotenv')
const mysql = require('mysql2')
dotenv.config()

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME
});


connection.query(`DROP TABLE IF EXISTS stories;`, (err) => {
  if (err) {
    throw err.message
  }
})

connection.query(`
  CREATE TABLE stories (
    id int(10) unsigned NOT NULL AUTO_INCREMENT,
    parent_id int(10) unsigned DEFAULT NULL,
    created_by text,
    text text,
    title text,
    url text,
    no_of_children int(10) DEFAULT NULL,
    created_at timestamp NULL DEFAULT NULL,
    type text,
    PRIMARY KEY (id),
    UNIQUE KEY id (id),
    KEY parent_id (parent_id) USING BTREE,
    CONSTRAINT fk_parent_id FOREIGN KEY (parent_id) REFERENCES stories (id)
  )`, (err) => {
  if (err) {
    throw err.message
  }
  console.log('Table created succesfully')
  connection.close()
})

