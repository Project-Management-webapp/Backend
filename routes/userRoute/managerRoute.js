const express = require('express');
const { handleManagerLogin, handleManagerSignUp, handleManagerLogout } = require('../../controller/userController/managerController');
const router = express.Router();


router.post('/manager/signup', handleManagerSignUp);
router.post('/manager/login', handleManagerLogin);
router.post('/manager/logout', handleManagerLogout);


module.exports = router;