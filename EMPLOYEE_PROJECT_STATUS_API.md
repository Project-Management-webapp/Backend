# Employee Project Status APIs - Pending, Ongoing & Completed

## Overview
This guide covers all endpoints for employees to view their projects at different stages: pending assignments, ongoing work, and completed projects.

---

## 📋 Available Endpoints

| Endpoint | Purpose | What It Returns |
|----------|---------|-----------------|
| `GET /pending` | New assignments requiring action | Projects waiting for accept/reject |
| `GET /ongoing` | Current active work | Projects employee is working on |
| `GET /completed` | Finished projects | Verified and completed work |
| `GET /accepted` | All accepted projects | Both ongoing and completed |
| `GET /my-assignments` | All assignments | Pending, accepted, rejected - everything |

---

## 1. Get Pending Assignments

### Endpoint
```
GET /api/employee/project-assignments/pending
```

### Description
Get all project assignments waiting for employee to accept or reject.

### Example
```bash
GET http://localhost:8000/api/employee/project-assignments/pending
```

### Success Response (200)
```json
{
  "success": true,
  "message": "Pending assignments retrieved successfully",
  "count": 2,
  "expiredCount": 1,
  "assignments": [
    {
      "id": 15,
      "projectId": 3,
      "employeeId": 5,
      "role": "Full Stack Developer",
      "allocatedAmount": 8000,
      "currency": "USD",
      "assignmentStatus": "pending",
      "workStatus": "not_started",
      "responseDeadline": "2025-10-20T12:00:00Z",
      "responsibilities": [
        "Develop authentication system",
        "Create REST APIs"
      ],
      "project": {
        "id": 3,
        "name": "Healthcare Platform",
        "description": "Patient management system",
        "status": "planning",
        "priority": "high",
        "deadline": "2026-06-30",
        "budget": 120000
      },
      "assigner": {
        "id": 2,
        "fullName": "John Manager",
        "email": "manager@company.com",
        "profileImage": "https://cloudinary.com/profile.jpg"
      }
    }
  ],
  "expiredAssignments": [
    {
      "id": 14,
      "projectName": "Old Project",
      "responseDeadline": "2025-10-15T12:00:00Z"
    }
  ]
}
```

**Use Case:** Employee logs in and checks for new project assignments requiring their response.

---

## 2. Get Ongoing Projects

### Endpoint
```
GET /api/employee/project-assignments/ongoing
```

### Description
Get all projects the employee is currently working on. Includes projects that are:
- `in_progress` - Currently being worked on
- `submitted` - Work submitted, awaiting manager verification
- `revision_required` - Manager requested changes

### Example
```bash
GET http://localhost:8000/api/employee/project-assignments/ongoing
```

### Success Response (200)
```json
{
  "success": true,
  "message": "Ongoing projects retrieved successfully",
  "summary": {
    "totalOngoing": 5,
    "inProgress": 3,
    "submitted": 1,
    "needingRevision": 1,
    "totalAllocatedAmount": 32500
  },
  "projects": [
    {
      "id": 10,
      "projectId": 1,
      "employeeId": 5,
      "role": "Frontend Developer",
      "allocatedAmount": 5000,
      "currency": "USD",
      "assignmentStatus": "accepted",
      "workStatus": "in_progress",
      "workStartedAt": "2025-10-10T08:00:00Z",
      "acceptedAt": "2025-10-08T14:30:00Z",
      "responsibilities": [
        "Build UI components",
        "Implement responsive design",
        "User authentication pages"
      ],
      "deliverables": [
        "Login/Signup pages",
        "Dashboard UI",
        "Mobile responsive layouts"
      ],
      "project": {
        "id": 1,
        "name": "E-Commerce Platform",
        "description": "Online shopping platform",
        "status": "active",
        "priority": "high",
        "deadline": "2026-03-15",
        "budget": 50000,
        "category": "Web Development",
        "progressPercentage": 35
      },
      "assigner": {
        "id": 2,
        "fullName": "John Manager",
        "email": "manager@company.com"
      }
    },
    {
      "id": 11,
      "projectId": 2,
      "employeeId": 5,
      "role": "Backend Developer",
      "allocatedAmount": 7500,
      "currency": "USD",
      "assignmentStatus": "accepted",
      "workStatus": "submitted",
      "workSubmittedAt": "2025-10-17T16:45:00Z",
      "workSubmissionNotes": "API endpoints completed with documentation",
      "project": {
        "id": 2,
        "name": "CRM System",
        "description": "Customer relationship management",
        "status": "active",
        "priority": "medium"
      }
    },
    {
      "id": 12,
      "projectId": 4,
      "employeeId": 5,
      "role": "Full Stack Developer",
      "allocatedAmount": 10000,
      "workStatus": "revision_required",
      "revisionDeadline": "2025-10-22T12:00:00Z",
      "rejectionReason": "Need to add input validation and error handling",
      "project": {
        "id": 4,
        "name": "Mobile App Backend",
        "status": "active"
      }
    }
  ]
}
```

**Use Case:** Employee wants to see all projects they're currently working on and their status.

---

## 3. Get Completed Projects

### Endpoint
```
GET /api/employee/project-assignments/completed
```

### Description
Get all projects where employee's work has been verified and completed. Shows earning history and completion statistics.

### Example
```bash
GET http://localhost:8000/api/employee/project-assignments/completed
```

### Success Response (200)
```json
{
  "success": true,
  "message": "Completed projects retrieved successfully",
  "summary": {
    "totalCompleted": 8,
    "totalEarned": 42000,
    "averagePerProject": "5250.00"
  },
  "completionsByMonth": [
    {
      "month": "2025-09",
      "count": 3,
      "earned": 15000
    },
    {
      "month": "2025-10",
      "count": 5,
      "earned": 27000
    }
  ],
  "projects": [
    {
      "id": 5,
      "projectId": 5,
      "employeeId": 5,
      "role": "Frontend Developer",
      "allocatedAmount": 6000,
      "currency": "USD",
      "assignmentStatus": "accepted",
      "workStatus": "verified",
      "acceptedAt": "2025-09-01T10:00:00Z",
      "workStartedAt": "2025-09-02T08:00:00Z",
      "workSubmittedAt": "2025-09-25T17:00:00Z",
      "workVerifiedAt": "2025-09-27T11:30:00Z",
      "verificationNotes": "Excellent work! Clean code and great UI.",
      "performanceFeedback": "Outstanding performance, ahead of schedule",
      "project": {
        "id": 5,
        "name": "Portfolio Website",
        "description": "Company portfolio site",
        "status": "completed",
        "priority": "medium",
        "completedAt": "2025-09-28T00:00:00Z"
      },
      "assigner": {
        "id": 2,
        "fullName": "John Manager",
        "email": "manager@company.com"
      },
      "verifier": {
        "id": 2,
        "fullName": "John Manager",
        "email": "manager@company.com"
      }
    }
  ]
}
```

**Use Case:** Employee wants to review their work history, earnings, and performance feedback.

---

## 4. Get All Accepted Projects

### Endpoint
```
GET /api/employee/project-assignments/accepted
```

### Description
Get all projects employee has accepted, categorized by work status. Includes both ongoing and completed projects.

### Example
```bash
GET http://localhost:8000/api/employee/project-assignments/accepted
```

### Success Response (200)
```json
{
  "success": true,
  "message": "Accepted projects retrieved successfully",
  "summary": {
    "total": 15,
    "notStarted": 2,
    "ongoing": 5,
    "completed": 7,
    "rejected": 1
  },
  "projects": {
    "all": [
      // All accepted assignments
    ],
    "notStarted": [
      {
        "id": 20,
        "role": "UI Designer",
        "workStatus": "not_started",
        "project": {
          "name": "New Project Starting Soon"
        }
      }
    ],
    "ongoing": [
      // Projects currently being worked on
    ],
    "completed": [
      // Verified projects
    ],
    "rejected": [
      // Work rejected by manager
    ]
  }
}
```

**Use Case:** Employee wants overview of all projects they've accepted across all statuses.

---

## 5. Get All My Assignments

### Endpoint
```
GET /api/employee/project-assignments/my-assignments
```

### Query Parameters (Optional)
- `status` - Filter by: `pending`, `accepted`, `rejected`
- `workStatus` - Filter by: `not_started`, `in_progress`, `submitted`, `verified`, `rejected`

### Description
Get complete list of all assignments including pending, accepted, and rejected.

### Examples

```bash
# Get everything
GET http://localhost:8000/api/employee/project-assignments/my-assignments

# Get only accepted assignments
GET http://localhost:8000/api/employee/project-assignments/my-assignments?status=accepted

# Get only in-progress work
GET http://localhost:8000/api/employee/project-assignments/my-assignments?workStatus=in_progress
```

### Success Response (200)
```json
{
  "success": true,
  "message": "Assignments retrieved successfully",
  "summary": {
    "total": 20,
    "pending": 2,
    "accepted": 15,
    "rejected": 3
  },
  "assignments": {
    "all": [
      // All assignments
    ],
    "pending": [
      // Assignments awaiting response
    ],
    "accepted": [
      // Accepted assignments
    ],
    "rejected": [
      // Rejected assignments
    ]
  }
}
```

**Use Case:** Employee dashboard showing complete overview of all project assignments.

---

## 📊 Comparison Table

| Endpoint | Shows | Assignment Status | Work Status |
|----------|-------|-------------------|-------------|
| `/pending` | Need action | `pending` | `not_started` |
| `/ongoing` | Active work | `accepted` | `in_progress`, `submitted`, `revision_required` |
| `/completed` | Done work | `accepted` | `verified` |
| `/accepted` | All accepted | `accepted` | All statuses |
| `/my-assignments` | Everything | All | All |

---

## 🎯 Use Cases & Workflows

### Use Case 1: Employee Morning Routine

```javascript
// Step 1: Check for new assignments
GET /api/employee/project-assignments/pending
// Response: 2 new assignments

// Step 2: Review details and accept one
POST /api/employee/project-assignments/15/accept

// Step 3: Check ongoing work
GET /api/employee/project-assignments/ongoing
// Response: 5 projects to work on today
```

---

### Use Case 2: Employee Dashboard

```javascript
// Get overview of all work
GET /api/employee/project-assignments/my-assignments

// Display:
// - Pending: 2 (need response)
// - Ongoing: 5 (current work)
// - Completed: 8 (finished)
// - Total Earnings: $42,000
```

---

### Use Case 3: Employee Portfolio Review

```javascript
// View completed projects for resume/portfolio
GET /api/employee/project-assignments/completed

// Shows:
// - All completed projects
// - Performance feedback
// - Total earnings
// - Completion timeline
```

---

### Use Case 4: Check Work Status

```javascript
// Employee submitted work and wants to check status
GET /api/employee/project-assignments/ongoing

// Filter for submitted work
const submitted = projects.filter(p => p.workStatus === 'submitted');

// Shows which projects are awaiting manager review
```

---

## 🧪 Testing Examples

### Test 1: Get Pending Assignments
```bash
curl -X GET http://localhost:8000/api/employee/project-assignments/pending \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

### Test 2: Get Ongoing Projects
```bash
curl -X GET http://localhost:8000/api/employee/project-assignments/ongoing \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

### Test 3: Get Completed Projects
```bash
curl -X GET http://localhost:8000/api/employee/project-assignments/completed \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

### Test 4: Get Accepted Projects
```bash
curl -X GET http://localhost:8000/api/employee/project-assignments/accepted \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

---

## 📱 Frontend Component Example (React)

```jsx
import React, { useState, useEffect } from 'react';

function EmployeeProjectDashboard() {
  const [pending, setPending] = useState([]);
  const [ongoing, setOngoing] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllProjects();
  }, []);

  const fetchAllProjects = async () => {
    try {
      // Fetch pending
      const pendingRes = await fetch('/api/employee/project-assignments/pending', {
        credentials: 'include'
      });
      const pendingData = await pendingRes.json();
      setPending(pendingData.assignments);

      // Fetch ongoing
      const ongoingRes = await fetch('/api/employee/project-assignments/ongoing', {
        credentials: 'include'
      });
      const ongoingData = await ongoingRes.json();
      setOngoing(ongoingData.projects);

      // Fetch completed
      const completedRes = await fetch('/api/employee/project-assignments/completed', {
        credentials: 'include'
      });
      const completedData = await completedRes.json();
      setCompleted(completedData.projects);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="dashboard">
      <h1>My Projects</h1>
      
      {/* Pending Section */}
      <section className="pending-section">
        <h2>Pending Assignments ({pending.length})</h2>
        <p className="alert">Action Required!</p>
        {pending.map(assignment => (
          <ProjectCard 
            key={assignment.id}
            assignment={assignment}
            type="pending"
          />
        ))}
      </section>

      {/* Ongoing Section */}
      <section className="ongoing-section">
        <h2>Ongoing Projects ({ongoing.length})</h2>
        {ongoing.map(assignment => (
          <ProjectCard 
            key={assignment.id}
            assignment={assignment}
            type="ongoing"
          />
        ))}
      </section>

      {/* Completed Section */}
      <section className="completed-section">
        <h2>Completed Projects ({completed.length})</h2>
        <p>Total Earned: ${completed.reduce((sum, a) => sum + Number(a.allocatedAmount), 0)}</p>
        {completed.map(assignment => (
          <ProjectCard 
            key={assignment.id}
            assignment={assignment}
            type="completed"
          />
        ))}
      </section>
    </div>
  );
}

function ProjectCard({ assignment, type }) {
  return (
    <div className={`project-card ${type}`}>
      <h3>{assignment.project.name}</h3>
      <p><strong>Role:</strong> {assignment.role}</p>
      <p><strong>Payment:</strong> ${assignment.allocatedAmount}</p>
      <p><strong>Status:</strong> {assignment.workStatus}</p>
      
      {type === 'pending' && (
        <div className="actions">
          <button onClick={() => acceptAssignment(assignment.id)}>Accept</button>
          <button onClick={() => rejectAssignment(assignment.id)}>Reject</button>
        </div>
      )}
      
      {type === 'ongoing' && assignment.workStatus === 'in_progress' && (
        <button onClick={() => submitWork(assignment.id)}>Submit Work</button>
      )}
      
      {type === 'completed' && assignment.verificationNotes && (
        <p className="feedback"><strong>Feedback:</strong> {assignment.verificationNotes}</p>
      )}
    </div>
  );
}
```

---

## ✅ Quick Reference

| What Employee Wants | Endpoint |
|---------------------|----------|
| New assignments to respond to | `GET /pending` |
| Current projects I'm working on | `GET /ongoing` |
| Projects I've finished | `GET /completed` |
| All my accepted projects | `GET /accepted` |
| Complete overview of everything | `GET /my-assignments` |

---

This comprehensive API suite gives employees complete visibility into their project lifecycle! 🎉
