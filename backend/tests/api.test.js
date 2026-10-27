const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Issue = require('../src/models/Issue');
const IssueActivity = require('../src/models/IssueActivity');

require('./setup');

describe('CampusFix API Integration Tests', () => {
  let studentToken;
  let staffToken;
  let adminToken;
  let studentUser;
  let staffUser;
  let adminUser;
  let testIssueId;

  const testStudentEmail = `test_student_${Date.now()}@example.com`;
  const testStaffEmail = `test_staff_${Date.now()}@example.com`;
  const testAdminEmail = `test_admin_${Date.now()}@example.com`;

  beforeAll(async () => {
    // Clear test data from this test run
    await User.deleteMany({ email: { $regex: /@example\.com$/ } });
    await Issue.deleteMany({ title: { $regex: /^\[TEST\]/ } });
  });

  afterAll(async () => {
    // Clean up created entities
    await User.deleteMany({ email: { $regex: /@example\.com$/ } });
    await Issue.deleteMany({ title: { $regex: /^\[TEST\]/ } });
  });

  describe('GET /api/health', () => {
    it('returns 200 with operational status and database connection state', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.service).toBe('CampusFix API');
      expect(res.body.status).toBe('operational');
    });
  });

  describe('Auth Endpoints (/api/auth)', () => {
    it('rejects registration with missing required fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'bad@example.com' });
      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('rejects registration with short password (< 6 chars)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test Student',
          email: 'shortpass@example.com',
          password: '123',
        });
      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('successfully registers a student user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Integration Student',
          email: testStudentEmail,
          password: 'Password@123',
          department: 'Computer Science',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.role).toBe('student');
      expect(res.body.data.user.passwordHash).toBeUndefined();

      studentToken = res.body.data.token;
      studentUser = res.body.data.user;
    });

    it('prevents registering with a duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Duplicate Student',
          email: testStudentEmail,
          password: 'Password@123',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('fails login with invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testStudentEmail,
          password: 'WrongPassword',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('successfully logs in with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testStudentEmail,
          password: 'Password@123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
    });

    it('retrieves current user profile via GET /api/auth/me', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testStudentEmail);
    });

    it('rejects /api/auth/me without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });

  describe('Staff & Admin Setup for Issue Testing', () => {
    it('creates staff and admin accounts directly in database', async () => {
      const staffPasswordHash = await User.hashPassword('Staff@123');
      const staff = await User.create({
        name: 'Integration Staff',
        email: testStaffEmail,
        passwordHash: staffPasswordHash,
        role: 'staff',
        department: 'Maintenance',
      });
      staffUser = staff;

      const adminPasswordHash = await User.hashPassword('Admin@123');
      const admin = await User.create({
        name: 'Integration Admin',
        email: testAdminEmail,
        passwordHash: adminPasswordHash,
        role: 'admin',
        department: 'Operations',
      });
      adminUser = admin;

      // Log in as staff
      const staffLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: testStaffEmail, password: 'Staff@123' });
      staffToken = staffLogin.body.data.token;

      // Log in as admin
      const adminLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: testAdminEmail, password: 'Admin@123' });
      adminToken = adminLogin.body.data.token;

      expect(staffToken).toBeDefined();
      expect(adminToken).toBeDefined();
    });
  });

  describe('Issue Management (/api/issues)', () => {
    it('rejects issue creation with missing fields or short title/description', async () => {
      const res = await request(app)
        .post('/api/issues')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'Hi',
          description: 'Short',
          category: 'Electrical',
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('successfully creates an issue as a student', async () => {
      const res = await request(app)
        .post('/api/issues')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: '[TEST] Broken AC in Room 401',
          description: 'The air conditioner in room 401 makes a loud humming sound and blows hot air.',
          category: 'Electrical',
          location: {
            building: 'Block C',
            room: '401',
            additionalDetail: 'Near front window',
          },
          priority: 'High',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.issue.issueCode).toMatch(/^CF-\d{4}-\d{4}$/);
      expect(res.body.data.issue.status).toBe('Submitted');

      testIssueId = res.body.data.issue._id;
    });

    it('student can view their created issue by ID', async () => {
      const res = await request(app)
        .get(`/api/issues/${testIssueId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.issue.title).toBe('[TEST] Broken AC in Room 401');
    });

    it('student can edit their issue while in Submitted status', async () => {
      const res = await request(app)
        .patch(`/api/issues/${testIssueId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: '[TEST] Broken AC in Room 401 (Urgent)',
          description: 'The air conditioner in room 401 makes a loud humming sound and blows hot air. Students cannot sit near it.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.issue.title).toContain('(Urgent)');
    });

    it('staff can view the issue list and find the submitted issue', async () => {
      const res = await request(app)
        .get('/api/issues?search=Broken%20AC')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.issues.length).toBeGreaterThanOrEqual(1);
    });

    it('staff can assign the issue to themselves', async () => {
      const res = await request(app)
        .patch(`/api/issues/${testIssueId}/assignment`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          assigneeId: staffUser._id.toString(),
          note: 'Taking over this electrical ticket',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.issue.assignee._id.toString()).toBe(staffUser._id.toString());
    });

    it('rejects invalid status transition (Submitted -> Resolved directly)', async () => {
      const res = await request(app)
        .patch(`/api/issues/${testIssueId}/status`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          status: 'Resolved',
          resolutionNote: 'Fixed without inspection',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Cannot transition');
    });

    it('valid status transition: Submitted -> Acknowledged', async () => {
      const res = await request(app)
        .patch(`/api/issues/${testIssueId}/status`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          status: 'Acknowledged',
          note: 'Assigned to maintenance technician for inspection',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.issue.status).toBe('Acknowledged');
    });

    it('student cannot edit issue once status is past Submitted', async () => {
      const res = await request(app)
        .patch(`/api/issues/${testIssueId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: '[TEST] Trying to edit after acknowledgement',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Submitted status');
    });

    it('valid status transition: Acknowledged -> In Progress', async () => {
      const res = await request(app)
        .patch(`/api/issues/${testIssueId}/status`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          status: 'In Progress',
          note: 'Technician is actively replacing condenser unit',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.issue.status).toBe('In Progress');
    });

    it('valid status transition: In Progress -> Resolved with resolution note', async () => {
      const res = await request(app)
        .patch(`/api/issues/${testIssueId}/status`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          status: 'Resolved',
          resolutionNote: 'Replaced AC capacitor and cleaned filter. Cooling restored.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.issue.status).toBe('Resolved');
      expect(res.body.data.issue.resolutionNote).toBeDefined();
    });

    it('checks audit trail / activity log for the issue', async () => {
      const res = await request(app)
        .get(`/api/issues/${testIssueId}/activity`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.activities.length).toBeGreaterThanOrEqual(4);
      // Ensure creation, assignment, and status updates are recorded
      const actions = res.body.data.activities.map((a) => a.action);
      expect(actions).toContain('created');
      expect(actions).toContain('assigned');
      expect(actions).toContain('status_changed');
      expect(actions).toContain('resolved');
    });
  });

  describe('Dashboard Endpoints (/api/dashboard)', () => {
    it('denies student access to staff/admin dashboard summary (403)', async () => {
      const res = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('allows staff access to dashboard summary with aggregate statistics', async () => {
      const res = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.total).toBeDefined();
      expect(res.body.data.byStatus).toBeDefined();
      expect(res.body.data.byPriority).toBeDefined();
      expect(res.body.data.byCategory).toBeDefined();
    });
  });

  describe('User Administration (/api/users)', () => {
    it('denies non-admin access to user management', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(403);
    });

    it('allows admin to list users and create a new staff member', async () => {
      const newStaffEmail = `created_staff_${Date.now()}@example.com`;
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Newly Created Staff',
          email: newStaffEmail,
          password: 'StaffPassword@123',
          role: 'staff',
          department: 'Carpentry',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('staff');

      // Admin can list users
      const listRes = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.data.users.length).toBeGreaterThanOrEqual(1);

      // Clean up
      await User.deleteOne({ email: newStaffEmail });
    });

    it('allows staff to fetch staff list for ticket assignment dropdown', async () => {
      const res = await request(app)
        .get('/api/users/staff')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.staff)).toBe(true);
    });
  });
});
