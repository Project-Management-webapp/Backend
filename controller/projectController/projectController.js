const Project = require('../../model/projectModel/project');
const ProjectAssignment = require('../../model/projectAssignmentModel/projectAssignment');
const User = require('../../model/userModel/user');
const { Op } = require('sequelize');

const handleCreateProject = async (req, res) => {
  try {
    const {
      // Basic Information
      name,
      description,
      projectType,
      category,
      
      // Timeline Information
      startDate,
      deadline,
      actualStartDate,
      actualEndDate,
      estimatedHours,
      actualHours,
      
      // Status and Progress
      status,
      priority,
      
      // Financial Information
      budget,
      allocatedAmount,
      spentAmount,
      currency,
      billingType,
      
      // Client Information
      clientName,
      clientEmail,
      clientPhone,
      clientCompany,
      stakeholders,
      
      // Technical Specifications
      technologies,
      frameworks,
      programmingLanguages,
      database,
      cloudProvider,
      architecture,
      
      // Repository and Version Control
      repositoryUrl,
      repositoryType,
      
      // Reference Links
      productionUrl,
      stagingUrl,
      developmentUrl,
      documentationUrl,
      apiDocumentationUrl,
      figmaUrl,
      jiraUrl,
      slackChannel,
      referenceLinks,
      
      
      // Project Management
      milestones,
      
      // Risks and Issues
      risks,
      issues,
      
      // Quality Assurance
      testingStatus,
      testCoverage,
      qaApprovalStatus,
      
      // Deployment Information
      deploymentStatus,
      lastDeploymentDate,
      deploymentFrequency,
      cicdPipeline,
      
      
      // Additional Information
      notes,

      // Team Information
      teamSize,
      teamLead,
      
      // Visibility and Access
      visibility,

    } = req.body;

    const createdBy = req.user.id;


    const newProject = await Project.create({
      // Basic Information
      name,
      description: description || null,
      projectCode: finalProjectCode,
      projectType: projectType || 'web_development',
      category: category || null,
      
      // Timeline Information
      startDate,
      deadline,
      actualStartDate: actualStartDate || null,
      actualEndDate: actualEndDate || null,
      estimatedHours: estimatedHours || 0,
      actualHours: actualHours || 0,
      
      // Status and Progress
      status: status || 'pending',
      completionPercentage: completionPercentage || 0,
      priority: priority || 'medium',
      
      // Financial Information
      budget: budget || 0,
      allocatedAmount: allocatedAmount || 0,
      spentAmount: spentAmount || 0,
      currency: currency || 'USD',
      billingType: billingType || 'fixed_price',
      
      // Client/Stakeholder Information
      clientName: clientName || null,
      clientEmail: clientEmail || null,
      clientPhone: clientPhone || null,
      clientCompany: clientCompany || null,
      stakeholders: stakeholders || null,
      
      // Technical Specifications
      technologies: technologies || null,
      frameworks: frameworks || null,
      programmingLanguages: programmingLanguages || null,
      database: database || null,
      cloudProvider: cloudProvider || null,
      architecture: architecture || null,
      
      // Repository and Version Control
      repositoryUrl: repositoryUrl || null,
      repositoryType: repositoryType || null,
      branchName: branchName || 'main',
      
      // Reference Links
      productionUrl: productionUrl || null,
      stagingUrl: stagingUrl || null,
      developmentUrl: developmentUrl || null,
      documentationUrl: documentationUrl || null,
      apiDocumentationUrl: apiDocumentationUrl || null,
      figmaUrl: figmaUrl || null,
      jiraUrl: jiraUrl || null,
      slackChannel: slackChannel || null,
      referenceLinks: referenceLinks || null,
      

      
      // Project Management
      methodology: methodology || 'agile',
      sprintDuration: sprintDuration || null,
      currentSprint: currentSprint || 0,
      totalSprints: totalSprints || null,
      milestones: milestones || null,
      
      // Risks and Issues
      risks: risks || null,
      issues: issues || null,
      
      // Quality Assurance
      testingStatus: testingStatus || null,
      testCoverage: testCoverage || null,
      qaApprovalStatus: qaApprovalStatus || 'pending',
      
      // Deployment Information
      deploymentStatus: deploymentStatus || null,
      lastDeploymentDate: lastDeploymentDate || null,
      deploymentFrequency: deploymentFrequency || null,
      cicdPipeline: cicdPipeline || null,
      
      // Security
      securityAuditStatus: securityAuditStatus || null,
      securityAuditDate: securityAuditDate || null,
      complianceRequirements: complianceRequirements || null,
      
      // Performance Metrics
      performanceMetrics: performanceMetrics || null,
      
      // Tags and Labels
      tags: tags || null,
      labels: labels || null,
      
      // Additional Information
      notes: notes || null,
      objectives: objectives || null,
      deliverables: deliverables || null,
      successCriteria: successCriteria || null,
      lessonsLearned: lessonsLearned || null,
      
      // Team Information
      teamSize: teamSize || null,
      teamLead: teamLead || null,
      
      // Visibility and Access
      visibility: visibility || 'internal',
      isArchived: isArchived || false,
      
      // Creator
      createdBy
    });

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: newProject
    });

  } catch (error) {
    console.error("Create project error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

const handleGetAllProjects = async (req, res) => {
  try {
    const { 
      status, 
      priority, 
      search 
    } = req.query;

    const whereConditions = {};

    if (status) whereConditions.status = status;
    if (priority) whereConditions.priority = priority;
    if (search) {
      whereConditions[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    // If employee, show only assigned projects
    if (req.user.role === 'employee') {
      const assignments = await ProjectAssignment.findAll({
        where: { employeeId: req.user.id, isActive: true },
        attributes: ['projectId']
      });
      const projectIds = assignments.map(a => a.projectId);
      whereConditions.id = { [Op.in]: projectIds };
    }
    const  projects  = await Project.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'fullName', 'email', 'role']
        },
        {
          model: ProjectAssignment,
          as: 'assignments',
          include: [{
            model: User,
            as: 'employee',
            attributes: ['id', 'fullName', 'email', 'position']
          }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      message: "Projects retrieved successfully",
      data: {
        projects,
        total: projects.count
      }
    });

  } catch (error) {
    console.error("Get all projects error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
}

const  handleGetProjectById = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findOne({
      where: { id: projectId },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'fullName', 'email', 'role']
        },
        {
          model: ProjectAssignment,
          as: 'assignments',
          where: { isActive: true },
          required: false,
          include: [{
            model: User,
            as: 'employee',
            attributes: ['id', 'fullName', 'email', 'position', 'department']
          }]
        },
      ]
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    // Check if employee is authorized to view this project
    if (req.user.role === 'employee') {
      const isAssigned = await ProjectAssignment.findOne({
        where: { 
          projectId, 
          employeeId: req.user.id, 
          isActive: true 
        }
      });

      if (!isAssigned) {
        return res.status(403).json({
          success: false,
          message: "You are not assigned to this project"
        });
      }
    }

    res.status(200).json({
      success: true,
      message: "Project retrieved successfully",
      data: project
    });

  } catch (error) {
    console.error("Get project by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

const handleUpdateProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const {
      // Basic Information
      name,
      description,
      projectType,
      category,
      
      // Timeline Information
      startDate,
      deadline,
      actualStartDate,
      actualEndDate,
      estimatedHours,
      actualHours,
      
      // Status and Progress
      status,
      priority,
      
      // Financial Information
      budget,
      allocatedAmount,
      spentAmount,
      currency,
      billingType,
      
      // Client Information
      clientName,
      clientEmail,
      clientPhone,
      clientCompany,
      stakeholders,
      
      // Technical Specifications
      technologies,
      frameworks,
      programmingLanguages,
      database,
      cloudProvider,
      architecture,
      
      // Repository and Version Control
      repositoryUrl,
      repositoryType,
      
      // Reference Links
      productionUrl,
      stagingUrl,
      developmentUrl,
      documentationUrl,
      apiDocumentationUrl,
      figmaUrl,
      jiraUrl,
      slackChannel,
      referenceLinks,
      
    
      
      // Project Management
      milestones,
      
      // Risks and Issues
      risks,
      issues,
      
      // Quality Assurance
      testingStatus,
      testCoverage,
      qaApprovalStatus,
      
      // Deployment Information
      deploymentStatus,
      lastDeploymentDate,
      deploymentFrequency,
      cicdPipeline,
    
      // Additional Information
      notes,

      
      // Team Information
      teamSize,
      teamLead,
      
      // Visibility and Access
      visibility,
    } = req.body;

    const project = await Project.findByPk(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    const updateData = {};
    
    // Basic Information
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (projectType !== undefined) updateData.projectType = projectType;
    if (category !== undefined) updateData.category = category;
    
    // Timeline Information
    if (startDate !== undefined) updateData.startDate = startDate;
    if (deadline !== undefined) updateData.deadline = deadline;
    if (actualStartDate !== undefined) updateData.actualStartDate = actualStartDate;
    if (actualEndDate !== undefined) updateData.actualEndDate = actualEndDate;
    if (estimatedHours !== undefined) updateData.estimatedHours = estimatedHours;
    if (actualHours !== undefined) updateData.actualHours = actualHours;
    
    // Status and Progress
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    
    // Financial Information
    if (budget !== undefined) updateData.budget = budget;
    if (allocatedAmount !== undefined) updateData.allocatedAmount = allocatedAmount;
    if (spentAmount !== undefined) updateData.spentAmount = spentAmount;
    if (currency !== undefined) updateData.currency = currency;
    if (billingType !== undefined) updateData.billingType = billingType;
    
    // Client/Stakeholder Information
    if (clientName !== undefined) updateData.clientName = clientName;
    if (clientEmail !== undefined) updateData.clientEmail = clientEmail;
    if (clientPhone !== undefined) updateData.clientPhone = clientPhone;
    if (clientCompany !== undefined) updateData.clientCompany = clientCompany;
    if (stakeholders !== undefined) updateData.stakeholders = stakeholders;
    
    // Technical Specifications
    if (technologies !== undefined) updateData.technologies = technologies;
    if (frameworks !== undefined) updateData.frameworks = frameworks;
    if (programmingLanguages !== undefined) updateData.programmingLanguages = programmingLanguages;
    if (database !== undefined) updateData.database = database;
    if (cloudProvider !== undefined) updateData.cloudProvider = cloudProvider;
    if (architecture !== undefined) updateData.architecture = architecture;
    
    // Repository and Version Control
    if (repositoryUrl !== undefined) updateData.repositoryUrl = repositoryUrl;
    if (repositoryType !== undefined) updateData.repositoryType = repositoryType;
    
    // Reference Links
    if (productionUrl !== undefined) updateData.productionUrl = productionUrl;
    if (stagingUrl !== undefined) updateData.stagingUrl = stagingUrl;
    if (developmentUrl !== undefined) updateData.developmentUrl = developmentUrl;
    if (documentationUrl !== undefined) updateData.documentationUrl = documentationUrl;
    if (apiDocumentationUrl !== undefined) updateData.apiDocumentationUrl = apiDocumentationUrl;
    if (figmaUrl !== undefined) updateData.figmaUrl = figmaUrl;
    if (jiraUrl !== undefined) updateData.jiraUrl = jiraUrl;
    if (slackChannel !== undefined) updateData.slackChannel = slackChannel;
    if (referenceLinks !== undefined) updateData.referenceLinks = referenceLinks;
    

    
    
    if (milestones !== undefined) updateData.milestones = milestones;
    
    // Risks and Issues
    if (risks !== undefined) updateData.risks = risks;
    if (issues !== undefined) updateData.issues = issues;
    
    // Quality Assurance
    if (testingStatus !== undefined) updateData.testingStatus = testingStatus;
    if (testCoverage !== undefined) updateData.testCoverage = testCoverage;
    if (qaApprovalStatus !== undefined) updateData.qaApprovalStatus = qaApprovalStatus;
    
    // Deployment Information
    if (deploymentStatus !== undefined) updateData.deploymentStatus = deploymentStatus;
    if (lastDeploymentDate !== undefined) updateData.lastDeploymentDate = lastDeploymentDate;
    if (deploymentFrequency !== undefined) updateData.deploymentFrequency = deploymentFrequency;
    if (cicdPipeline !== undefined) updateData.cicdPipeline = cicdPipeline;
    
 
  
    // Additional Information
    if (notes !== undefined) updateData.notes = notes;
    
    // Team Information
    if (teamSize !== undefined) updateData.teamSize = teamSize;
    if (teamLead !== undefined) updateData.teamLead = teamLead;
    
    // Visibility and Access
    if (visibility !== undefined) updateData.visibility = visibility;

    await project.update(updateData);

    const updatedProject = await Project.findOne({
      where: { id: projectId },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'fullName', 'email']
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: "Project updated successfully",
      data: updatedProject,
      updatedFields: Object.keys(updateData)
    });

  } catch (error) {
    console.error("Update project error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

const handleDeleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findByPk(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    await project.destroy();

    res.status(200).json({
      success: true,
      message: "Project deleted successfully"
    });

  } catch (error) {
    console.error("Delete project error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};


const handleGetMyProjects = async (req, res) => {
  try {
    const userId = req.user.id;

    const assignments = await ProjectAssignment.findAll({
      where: { 
        employeeId: userId, 
        isActive: true 
      },
      include: [{
        model: Project,
        as: 'project',
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'fullName', 'email']
          },
        ]
      }]
    });

    res.status(200).json({
      success: true,
      message: "Your projects retrieved successfully",
      data: assignments
    });

  } catch (error) {
    console.error("Get my projects error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

module.exports = {
  handleCreateProject,
  handleGetAllProjects,
  handleGetProjectById,
  handleUpdateProject,
  handleDeleteProject,
  handleGetMyProjects
};
