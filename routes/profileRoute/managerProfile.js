const express = require('express');
const {  handleManagerGetProfile, handleManagerUpdateProfile } = require('../../controller/userController/managerController');
const upload = require('../../cloudinaryServices/upload');
const router = express.Router();


router.get('/profile', handleManagerGetProfile);
router.put('/profile',upload.single('profileImage'), handleManagerUpdateProfile);

module.exports = router;