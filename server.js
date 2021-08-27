const express = require('express')
const connectDB = require('./config/db')

const app = express()

//Connect the database
connectDB()

app.get('/', (req, res) => res.send('Sending data from API'))

// Define Routes
app.use('/api/auth', require('./router/api/auth'))
app.use('/api/users', require('./router/api/users'))
app.use('/api/profile', require('./router/api/profile'))
app.use('/api/posts', require('./router/api/posts'))

const PORT = process.env.PORT || 6000

app.listen(PORT, () => console.log(`Serve started on PORT ${PORT}`))
