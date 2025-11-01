const express = require('express');
const router = express.Router();
const { 
  handleGetAllEmployees,
  handleGetEmployeeById,
  handleUpdateEmployeeDetails,
} = require('../../controller/userController/employeeDetails');

router.get('/employees',  handleGetAllEmployees);
router.get('/employees/:employeeId',  handleGetEmployeeById);
router.put('/employees/:employeeId', handleUpdateEmployeeDetails);


module.exports = router;