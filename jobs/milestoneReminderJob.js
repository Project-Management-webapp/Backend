const cron = require('node-cron');
const { Op } = require('sequelize');
const Project = require('../model/projectModel/project');
const ProjectAssignment = require('../model/projectAssignmentModel/projectAssignment');
const User = require('../model/userModel/user');
const Notification = require('../model/notificationModel/notification');
const { sendMilestoneReminderEmail } = require('../emailService/milestoneEmail');

/**
 * Cron job to check milestones and send reminders
 * Runs every day at 9:00 AM
 * Format: minute hour day month dayOfWeek
 */
const milestoneReminderJob = cron.schedule('0 9 * * *', async () => {
  console.log(' Running milestone reminder job at:', new Date().toISOString());
  
  try {
    // Get today's date and tomorrow's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayStr = today.toISOString().split('T')[0];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    console.log(` Checking milestones for today (${todayStr}) and tomorrow (${tomorrowStr})`);

    // Find all active projects that have milestones
    const projects = await Project.findAll({
      where: {
        status: {
          [Op.in]: ['pending', 'in-progress']
        },
        milestones: {
          [Op.ne]: null
        }
      },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'fullName', 'email']
        }
      ]
    });

    console.log(` Found ${projects.length} active projects with milestones`);

    for (const project of projects) {
      // Skip if no milestones
      if (!project.milestones || !Array.isArray(project.milestones) || project.milestones.length === 0) {
        continue;
      }

      // Check if project has assigned employees
      const assignments = await ProjectAssignment.findAll({
        where: {
          projectId: project.id,
          isActive: true
        },
        include: [
          {
            model: User,
            as: 'employee',
            attributes: ['id', 'fullName', 'email']
          }
        ]
      });

      if (assignments.length === 0) {
        console.log(`⏭  Project "${project.name}" has no assigned employees, skipping...`);
        continue;
      }

      // Check each milestone
      for (const milestone of project.milestones) {
        // Skip if milestone doesn't have required fields
        if (!milestone.name || !milestone.deadline || milestone.status === 'completed') {
          continue;
        }

        const milestoneDate = milestone.deadline;
        
        // Check if milestone is today or tomorrow
        if (milestoneDate === todayStr || milestoneDate === tomorrowStr) {
          const isToday = milestoneDate === todayStr;
          const daysUntil = isToday ? 0 : 1;
          
          console.log(` Milestone "${milestone.name}" for project "${project.name}" is ${isToday ? 'TODAY' : 'TOMORROW'}!`);

          // Prepare notification message
          const notificationTitle = isToday 
            ? ` Milestone Due Today: ${milestone.name}`
            : ` Milestone Due Tomorrow: ${milestone.name}`;
          
          const notificationMessage = isToday
            ? `The milestone "${milestone.name}" for project "${project.name}" is due TODAY (${milestoneDate}). ${milestone.description ? milestone.description : ''}`
            : `The milestone "${milestone.name}" for project "${project.name}" is due TOMORROW (${milestoneDate}). ${milestone.description ? milestone.description : ''}`;

          // Send notifications to all assigned employees
          for (const assignment of assignments) {
            // Create notification for employee
            await Notification.create({
              userId: assignment.employeeId,
              title: notificationTitle,
              message: notificationMessage,
              type: 'milestone_reminder',
              relatedId: project.id,
              relatedType: 'project',
              priority: isToday ? 'urgent' : 'high',
              metadata: {
                projectId: project.id,
                projectName: project.name,
                milestoneName: milestone.name,
                milestoneDeadline: milestone.deadline,
                daysUntil: daysUntil
              }
            });

            // Send email to employee
            if (assignment.employee && assignment.employee.email) {
              await sendMilestoneReminderEmail(
                assignment.employee.email,
                assignment.employee.fullName,
                project.name,
                milestone.name,
                milestone.description || '',
                milestone.deadline,
                isToday
              );
              console.log(`  Email sent to employee: ${assignment.employee.email}`);
            }
          }

          // Send notification to project manager/creator
          if (project.createdBy) {
            await Notification.create({
              userId: project.createdBy,
              title: notificationTitle,
              message: notificationMessage,
              type: 'milestone_reminder',
              relatedId: project.id,
              relatedType: 'project',
              priority: isToday ? 'urgent' : 'high',
              metadata: {
                projectId: project.id,
                projectName: project.name,
                milestoneName: milestone.name,
                milestoneDeadline: milestone.deadline,
                daysUntil: daysUntil,
                assignedEmployees: assignments.length
              }
            });

            // Send email to manager
            if (project.creator && project.creator.email) {
              await sendMilestoneReminderEmail(
                project.creator.email,
                project.creator.fullName,
                project.name,
                milestone.name,
                milestone.description || '',
                milestone.deadline,
                isToday,
                true, // isManager flag
                assignments.length
              );
              console.log(`  Email sent to manager: ${project.creator.email}`);
            }
          }

          console.log(` Reminders sent for milestone "${milestone.name}" in project "${project.name}"`);
        }
      }
    }

    console.log(' Milestone reminder job completed successfully');
  } catch (error) {
    console.error(' Error in milestone reminder job:', error);
  }
}, {
  scheduled: false, // Don't start automatically, will be started in server.js
  timezone: "Asia/Kolkata" // Change this to your timezone
});

module.exports = milestoneReminderJob;
