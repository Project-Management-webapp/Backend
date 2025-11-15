const express = require('express');
const { handleEmployeeSignUp, handleEmployeeLogin, handleEmployeeLogout } = require('../../controller/userController/employeController');
const { checkForAuthenticationCookie } = require('../../middleware/authMiddleware');
const { verifyManagerOrAdmin } = require('../../middleware/roleMiddleware');
const router = express.Router();


router.post('/employee/signup', checkForAuthenticationCookie(), verifyManagerOrAdmin, handleEmployeeSignUp);
router.post('/employee/login', handleEmployeeLogin);
router.post('/employee/logout', handleEmployeeLogout);


module.exports = router;