const  User  = require('../../model/userModel/user');


const handleGetAllEmployees = async (req, res) => {
  try {

    const employees  = await User.findAndCountAll({
      where: {
      role: ['employee'],
      },
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      message: "Employees retrieved successfully",
      data: {
        employees,
      }
    });

  } catch (error) {
    console.error("Get all employees error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

const handleGetEmployeeById = async (req, res) => {
  try {

    const { employeeId } = req.params;

    const employee = await User.findOne({
      where: {
        id: employeeId,
        role: ['employee']
      },
      attributes: { exclude: ['password'] }
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Employee retrieved successfully",
      data: employee
    });

  } catch (error) {
    console.error("Get employee by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

const handleUpdateEmployeeDetails = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { rate } = req.body;

    // Find the employee
    const employee = await User.findOne({
      where: {
        id: employeeId,
        role: 'employee'
      }
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    // Update only the rate field
    await employee.update({
      rate: rate !== undefined ? rate : employee.rate
    });

    res.status(200).json({
      success: true,
      message: "Employee details updated successfully",
      data: {
        id: employee.id,
        rate: employee.rate
      }
    });

  } catch (error) {
    console.error("Update employee details error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};



module.exports = {

handleGetAllEmployees,
handleGetEmployeeById,
handleUpdateEmployeeDetails,
};