const express = require('express');
const { 
  handleForgotPassword, 
  handleResetPassword,
} = require('../../controller/userController/commonManaEmp');

const router = express.Router();


router.post('/forgot-password', handleForgotPassword);
router.post('/reset-password/:resetToken', handleResetPassword);




module.exports = router;