const express = require('express')

const router = express.Router()

// @route   GET api/Users
// @desc    Test route
// @acc     Public
router.get('/', (req, res) => res.send('Users Route'))

module.exports = router
