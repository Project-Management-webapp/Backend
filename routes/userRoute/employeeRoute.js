const express = require('express');
const { handleEmployeeSignUp, handleEmployeeLogin, handleEmployeeLogout, handleEmployeeGetProfile, handleEmployeeUpdateProfile } = require('../../controller/userController/employeController');
const router = express.Router();


router.post('/employee/signup', handleEmployeeSignUp);
router.post('/employee/login', handleEmployeeLogin);
router.post('/employee/logout', handleEmployeeLogout);


module.exports = router;