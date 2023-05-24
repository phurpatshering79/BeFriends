const express = require('express')
const Profile = require('../../model/Profile')
const User = require('../../model/User')
// bring in normalize to give us a proper url, regardless of what user entered
const normalize = require('normalize-url')
const auth = require('../../middleware/auth')
const { body, validationResult } = require('express-validator')

const router = express.Router()

// @route   GET api/profile/me
// @desc    Get current user profile
// @acc     Private
router.get('/me', auth, async (req, res) => {
  //Using auth middleware to make this route private, needs authentication jwt token
  try {
    //Using the 'user' field from the Profile Model which stores the reference for the user id in the User profile, essentially
    //connects the user to it's profile. Here, using the req.user.id since after authentication we store the user id there
    const profile = await Profile.findOne({ user: req.user.id }).populate(
      'user',
      ['name', 'avatar']
    )
    if (!profile) {
      return res.status(400).json({ msg: 'There is no profile for this user' })
    }
  } catch (err) {
    console.error(err.message)
    res.status(500).send('Server Error')
  }
})

// @route   POST api/profile/me
// @desc    Update existing profile and create a new one
// @acc     Private
router.post(
  '/',
  [
    auth,
    body('status', 'Status is required').not().isEmpty(),
    body('skills', 'Skills is required').not().isEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ erros: errors.array() })
    }

    // destructure the request
    const {
      website,
      skills,
      youtube,
      twitter,
      instagram,
      linkedin,
      facebook,
      // spread the rest of the fields we don't need to check
      ...rest
    } = req.body

    // build a profile
    const profileFields = {
      user: req.user.id,
      website:
        website && website !== ''
          ? normalize(website, { forceHttps: true })
          : '',
      skills: Array.isArray(skills)
        ? skills
        : skills.split(',').map((skill) => ' ' + skill.trim()),
      ...rest
    }

    // Build socialFields object
    const socialFields = { youtube, twitter, instagram, linkedin, facebook }

    // normalize social fields to ensure valid url
    for (const [key, value] of Object.entries(socialFields)) {
      if (value && value.length > 0)
        socialFields[key] = normalize(value, { forceHttps: true })
    }
    // add to profileFields
    profileFields.social = socialFields

    try {
      //Using upsert option (Updates a doc, and Creates new doc if no match is found)
      let profile = await Profile.findOneAndUpdate(
        { user: req.user.id },
        { $set: profileFields },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      )
      return res.json(profile)
    } catch (err) {
      console.error(err.message)
      res.status(500).send('Server Error')
    }
  }
)

module.exports = router
