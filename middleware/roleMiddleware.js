const authorizeRoles = (roles) => {
    return (req, res, next) => {
   try {
   if(!roles.includes(req.user.role)){
    return res.status(403).json({message: "Unauthorized Access! , You are not authorized to access this resources "});
   } 
   next();
   } catch (error) {
    console.log(error);
   }
    };
  };

const verifyManagerOrAdmin = (req, res, next) => {
  try {
    const allowedRoles = ['manager', 'admin'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Manager or Admin role required."
      });
    }
    next();
  } catch (error) {
    console.error("Role verification error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
  
  module.exports = { 
    authorizeRoles,
    verifyManagerOrAdmin
  };
  