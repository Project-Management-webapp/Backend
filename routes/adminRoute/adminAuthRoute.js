const express = require('express');
const { 
  handleAdminSignUp, 
  handleAdminLogin, 
  handleAdminLogout 
} = require('../../controller/adminController/adminAuthController');

const router = express.Router();

// Admin authentication routes
router.post('/admin/signup', handleAdminSignUp);
router.post('/admin/login', handleAdminLogin);
router.post('/admin/logout', handleAdminLogout);

module.exports = router;
