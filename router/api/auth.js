const express = require('express')
const auth = require('../../middleware/auth')
const { body, validationResult } = require('express-validator')
const User = require('../../model/User')
const config = require('config')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const router = express.Router()

// @route   GET api/auth
// @desc    Test route
// @acc     Public
router.get('/', auth, async (req, res) => {
  //After authentication return the user details
  try {
    const user = await User.findById(req.user.id).select('-password') //Exclude password from the req body payload
    res.json(user)
  } catch (err) {
    console.error(err.message)
    res.status(500).send('Server Error')
  }
})

// @route   POST api/auth
// @desc    Authenitcate user and return token
// @acc     Public - purpose of this route is to get the token so we can make request to private routes
router.post(
  '/',
  [
    //middleware validation of req body to see if criteria is met
    body('email', 'Please input a valid e-mail').isEmail(),
    body('password', 'Please enter password').not().isEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() })
    }

    const { email, password } = req.body

    // Get the user details
    const user = await User.findOne({ email })
    if (!user) {
      res.status(400).send({ errors: [{ msg: 'Invalid Credentials' }] })
    }

    //Verify the password
    const isPwMatch = await bcrypt.compare(password, user.password)

    if (!isPwMatch) {
      res.status(400).send({ errors: [{ msg: 'Invalid Credentials' }] })
    }

    const payload = {
      user: {
        id: user.id
      }
    }

    //Once the user exists and the pw is verified, return jwt to the user
    jwt.sign(
      payload,
      config.get('jwtSecret'),
      { expiresIn: 360000 },
      (error, token) => {
        if (error) throw error
        res.json({ token })
      }
    )
  }
)

module.exports = router
