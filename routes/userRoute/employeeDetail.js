const express = require('express');
const router = express.Router();
const { 
  handleGetAllEmployees,
  handleGetEmployeeById,
} = require('../../controller/userController/employeeDetails');

router.get('/employees',  handleGetAllEmployees);
router.get('/employees/:employeeId',  handleGetEmployeeById);


module.exports = router;