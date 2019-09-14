const path = require('path')
const express = require('express')

const port = process.env.PORT || 3000

const app = express()

app.get('', (req, res) => {
    res.send('testing the changes!!!!')
})

app.listen(port, () => {
    console.log(`Server is running at port ${port}`)
})

