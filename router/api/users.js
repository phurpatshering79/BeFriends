const express = require('express')
const { body, validationResult } = require('express-validator')
const gravatar = require('gravatar')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const config = require('config')
const router = express.Router()

const User = require('../../model/User')

// @route   GET api/Users
// @desc    Test route
// @acc     Public
router.get(
  '/',
  [
    //validation of req body to see if criteria is met
    body('name', 'Name is required').not().isEmpty(),
    body('email', 'Please input a valid e-mail').isEmail(),
    body(
      'password',
      'Please enter password with 6 or more characters'
    ).isLength({ min: 6 })
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ erros: errors.array() })
    }

    const { name, email, password } = req.body
    try {
      //Check if the user exists or not while registering
      let user = await User.findOne({ email })
      if (user) {
        return res.status(400).json({ erros: [{ msg: 'User Already Exists' }] })
      }

      //Create a new avatar for the user
      const avatar = gravatar.url(email, {
        s: '200',
        r: 'pg',
        d: 'mm'
      })

      //Create a new user instance using the User model
      user = new User({
        name,
        email,
        password,
        avatar
      })

      //encrypt the pw
      const salt = await bcrypt.genSaltSync(10)

      user.password = await bcrypt.hash(password, salt)
      //save the user to the database, it returns a promise so we need to await
      await user.save()

      //Return jwt to the user
      const payload = { user: { id: user.id } }
      jwt.sign(
        payload,
        config.get('jwtSecret'),
        { expiresIn: 360000 },
        (err, token) => {
          if (err) throw err
          res.json({ token })
        }
      )

      //res.send('User Registered')
    } catch (error) {
      console.error(error.message)
      res.status(500).send('Server Error')
    }
  }
)

module.exports = router
