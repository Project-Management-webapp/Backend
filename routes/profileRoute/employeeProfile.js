const express = require('express');
const { handleEmployeeGetProfile, handleEmployeeUpdateProfile } = require('../../controller/userController/employeController');
const upload = require('../../cloudinaryServices/upload');
const router = express.Router();


router.get('/profile',  handleEmployeeGetProfile);
router.put('/profile', upload.single('profileImage'), handleEmployeeUpdateProfile);


module.exports = router;