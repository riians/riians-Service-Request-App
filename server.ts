import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("governance.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    service_type TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT,
    email TEXT,
    profile_picture TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Ensure profile_picture column exists if table was already created
  -- We use a try-catch pattern in SQL or just run it and ignore errors if it exists
  -- SQLite doesn't have a simple "IF NOT EXISTS" for ADD COLUMN in older versions, 
  -- but we can just run it.
`);

try {
  db.exec("ALTER TABLE admins ADD COLUMN profile_picture TEXT");
} catch (e) {
  // Column probably already exists
}

db.exec(`
  -- Seed initial admin if not exists
  INSERT OR IGNORE INTO admins (username, password, full_name, email) 
  VALUES ('9472641134', 'vinay#328', 'Vinay Kumar', 'admin@rajveer.com');
`);

// Email Transporter (Lazy initialization)
let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
    if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
      transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: parseInt(SMTP_PORT),
        secure: SMTP_PORT === "465",
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
      });
    }
  }
  return transporter;
}

async function sendAdminNotification(requestData: any) {
  const mailTransporter = getTransporter();
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!mailTransporter || !adminEmail) {
    console.warn("Email configuration missing. Skipping notification.");
    return;
  }

  const mailOptions = {
    from: `"Rajveer E-Gov System" <${process.env.SMTP_USER}>`,
    to: adminEmail,
    subject: `New Service Request: ${requestData.service_type}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #4f46e5; color: white; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">New Service Request</h1>
        </div>
        <div style="padding: 24px; color: #1e293b;">
          <p>A new request has been submitted by a citizen.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #64748b; width: 140px;">Citizen Name:</td>
              <td style="padding: 8px 0;">${requestData.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #64748b;">Email:</td>
              <td style="padding: 8px 0;">${requestData.email}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #64748b;">Phone:</td>
              <td style="padding: 8px 0;">${requestData.phone}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #64748b;">Service Type:</td>
              <td style="padding: 8px 0;">${requestData.service_type}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #64748b; vertical-align: top;">Details:</td>
              <td style="padding: 8px 0;">${requestData.description || "No additional details provided."}</td>
            </tr>
          </table>
          <div style="margin-top: 32px; text-align: center;">
            <a href="${process.env.APP_URL}" style="background-color: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">View in Dashboard</a>
          </div>
        </div>
        <div style="background-color: #f8fafc; padding: 16px; text-align: center; color: #94a3b8; font-size: 12px;">
          © 2026 Rajveer E-Governance Services
        </div>
      </div>
    `,
  };

  try {
    await mailTransporter.sendMail(mailOptions);
    console.log("Admin notification email sent successfully.");
  } catch (error) {
    console.error("Failed to send admin notification email:", error);
  }
}

async function sendSMS(phone: string, message: string) {
  // In a real application, you would use a service like Twilio or MSG91 here.
  // For now, we'll just log the SMS content.
  console.log(`[SMS to ${phone}]: ${message}`);
}

async function sendCustomerConfirmation(requestData: any) {
  const mailTransporter = getTransporter();
  if (!mailTransporter) return;

  const mailOptions = {
    from: `"Rajveer E-Gov System" <${process.env.SMTP_USER}>`,
    to: requestData.email,
    subject: `Request Received: ${requestData.service_type}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #4f46e5; color: white; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Request Received</h1>
        </div>
        <div style="padding: 24px; color: #1e293b;">
          <p>Dear ${requestData.name},</p>
          <p>Thank you for submitting your request for <strong>${requestData.service_type}</strong>. We have received your application and our team will review it shortly.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p><strong>Request Details:</strong></p>
          <p>Service: ${requestData.service_type}</p>
          <p>Status: Pending</p>
          <p>We will notify you once there is an update on your request.</p>
        </div>
        <div style="background-color: #f8fafc; padding: 16px; text-align: center; color: #94a3b8; font-size: 12px;">
          © 2026 Rajveer E-Governance Services
        </div>
      </div>
    `,
  };

  try {
    await mailTransporter.sendMail(mailOptions);
    await sendSMS(requestData.phone, `Hi ${requestData.name}, your request for ${requestData.service_type} has been received. We will notify you of any updates.`);
  } catch (error) {
    console.error("Failed to send customer confirmation:", error);
  }
}

async function sendCustomerStatusUpdate(requestData: any, newStatus: string) {
  const mailTransporter = getTransporter();
  if (!mailTransporter) return;

  const statusColors: any = {
    'pending': '#6366f1',
    'in-progress': '#f59e0b',
    'completed': '#10b981',
    'rejected': '#ef4444'
  };

  const statusLabels: any = {
    'pending': 'Pending Review',
    'in-progress': 'In Progress',
    'completed': 'Approved / Completed',
    'rejected': 'Rejected'
  };

  const statusMessages: any = {
    'completed': 'Great news! Your request has been approved and processed successfully.',
    'rejected': 'We regret to inform you that your request has been rejected. Please contact support for more details.',
    'in-progress': 'Your request is currently being processed by our team.',
    'pending': 'Your request is currently in the queue for review.'
  };

  const mailOptions = {
    from: `"Rajveer E-Gov System" <${process.env.SMTP_USER}>`,
    to: requestData.email,
    subject: `Update on your Request: ${requestData.service_type}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background-color: ${statusColors[newStatus] || '#4f46e5'}; color: white; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Status Updated</h1>
        </div>
        <div style="padding: 24px; color: #1e293b;">
          <p>Dear ${requestData.name},</p>
          <p>The status of your request for <strong>${requestData.service_type}</strong> has been updated.</p>
          
          <div style="margin: 24px 0; padding: 24px; background-color: #f8fafc; border-radius: 12px; text-align: center; border: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; font-weight: bold;">New Status</p>
            <p style="margin: 8px 0; font-size: 24px; font-weight: 800; color: ${statusColors[newStatus] || '#4f46e5'}; text-transform: uppercase;">${statusLabels[newStatus] || newStatus}</p>
            <p style="margin: 16px 0 0 0; font-size: 15px; color: #475569; line-height: 1.5;">${statusMessages[newStatus] || 'Your request status has been updated.'}</p>
          </div>

          <p style="font-size: 14px; color: #64748b;">If you have any questions regarding this update, please reply to this email or call our support line.</p>
          <p style="margin-top: 32px; font-weight: bold;">Thank you for choosing Rajveer Innovations.</p>
        </div>
        <div style="background-color: #f8fafc; padding: 16px; text-align: center; color: #94a3b8; font-size: 12px;">
          © 2026 Rajveer E-Governance Services • Badlapur, Mumbai
        </div>
      </div>
    `,
  };

  try {
    await mailTransporter.sendMail(mailOptions);
    
    // SMS Notification
    const smsMessage = `Hi ${requestData.name}, your ${requestData.service_type} request status is now: ${statusLabels[newStatus] || newStatus.toUpperCase()}. ${newStatus === 'completed' ? 'It has been approved!' : ''}`;
    await sendSMS(requestData.phone, smsMessage);
    
    console.log(`Status update notification sent to ${requestData.email} and ${requestData.phone}`);
  } catch (error) {
    console.error("Failed to send status update notification:", error);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Admin Auth API
  app.post("/api/admin/login", (req, res) => {
    const { username, password } = req.body;
    try {
      const admin = db.prepare("SELECT * FROM admins WHERE username = ? AND password = ?").get(username, password) as any;
      if (admin) {
        const { password, ...adminInfo } = admin;
        res.json({ success: true, admin: adminInfo });
      } else {
        res.status(401).json({ success: false, error: "Invalid credentials" });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.get("/api/admin/profile", (req, res) => {
    const username = req.query.username;
    try {
      const admin = db.prepare("SELECT id, username, full_name, email, profile_picture FROM admins WHERE username = ?").get(username) as any;
      if (admin) {
        res.json(admin);
      } else {
        res.status(404).json({ error: "Admin not found" });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  app.patch("/api/admin/profile", (req, res) => {
    const { username, full_name, email, newUsername, profile_picture, password, newPassword } = req.body;
    try {
      // Verify current password first
      const admin = db.prepare("SELECT * FROM admins WHERE username = ? AND password = ?").get(username, password);
      if (!admin) {
        return res.status(401).json({ error: "Current password incorrect" });
      }

      const updates: string[] = ["updated_at = CURRENT_TIMESTAMP"];
      const params: any[] = [];

      if (full_name) { updates.push("full_name = ?"); params.push(full_name); }
      if (email) { updates.push("email = ?"); params.push(email); }
      if (profile_picture !== undefined) { updates.push("profile_picture = ?"); params.push(profile_picture); }
      if (newUsername) { 
        // Check if new username already exists
        const existing = db.prepare("SELECT id FROM admins WHERE username = ?").get(newUsername);
        if (existing) {
          return res.status(400).json({ error: "Username already taken" });
        }
        updates.push("username = ?"); 
        params.push(newUsername); 
      }
      if (newPassword) { updates.push("password = ?"); params.push(newPassword); }

      if (updates.length === 1) {
        return res.status(400).json({ error: "No fields to update" });
      }

      params.push(username);
      const stmt = db.prepare(`UPDATE admins SET ${updates.join(", ")} WHERE username = ?`);
      stmt.run(...params);
      
      const finalUsername = newUsername || username;
      const updatedAdmin = db.prepare("SELECT id, username, full_name, email, profile_picture FROM admins WHERE username = ?").get(finalUsername);
      res.json({ success: true, admin: updatedAdmin });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // API Routes
  app.post("/api/contact", async (req, res) => {
    const { name, email, subject, message } = req.body;
    try {
      const stmt = db.prepare(
        "INSERT INTO messages (name, email, subject, message) VALUES (?, ?, ?, ?)"
      );
      const info = stmt.run(name, email, subject, message);
      
      // Send notification email to support@riians.in
      const mailTransporter = getTransporter();
      if (mailTransporter) {
        const mailOptions = {
          from: `"Rajveer Innovations Contact" <${process.env.SMTP_USER}>`,
          to: "support@riians.in",
          subject: `New Contact Message: ${subject}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
              <div style="background-color: #4f46e5; color: white; padding: 24px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">New Contact Message</h1>
              </div>
              <div style="padding: 24px; color: #1e293b;">
                <p>You have received a new message from the contact form.</p>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #64748b; width: 140px;">Name:</td>
                    <td style="padding: 8px 0;">${name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #64748b;">Email:</td>
                    <td style="padding: 8px 0;">${email}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #64748b;">Subject:</td>
                    <td style="padding: 8px 0;">${subject}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #64748b; vertical-align: top;">Message:</td>
                    <td style="padding: 8px 0;">${message}</td>
                  </tr>
                </table>
              </div>
            </div>
          `,
        };
        mailTransporter.sendMail(mailOptions).catch(err => console.error("Failed to send contact email:", err));
      }

      res.status(201).json({ id: info.lastInsertRowid });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  app.post("/api/requests", async (req, res) => {
    const { name, email, phone, service_type, description } = req.body;
    try {
      const stmt = db.prepare(
        "INSERT INTO requests (name, email, phone, service_type, description) VALUES (?, ?, ?, ?, ?)"
      );
      const info = stmt.run(name, email, phone, service_type, description);
      
      // Send notification email asynchronously
      sendAdminNotification({ name, email, phone, service_type, description });
      sendCustomerConfirmation({ name, email, phone, service_type });

      res.status(201).json({ id: info.lastInsertRowid });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to submit request" });
    }
  });

  app.get("/api/requests", (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    try {
      const totalCount = db.prepare("SELECT COUNT(*) as count FROM requests").get() as { count: number };
      const requests = db.prepare("SELECT * FROM requests ORDER BY created_at DESC LIMIT ? OFFSET ?").all(limit, offset);
      
      res.json({
        requests,
        total: totalCount.count,
        page,
        limit,
        totalPages: Math.ceil(totalCount.count / limit)
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch requests" });
    }
  });

  app.patch("/api/requests/:id", (req, res) => {
    const { id } = req.params;
    const { status, name, email, phone, service_type, description } = req.body;
    try {
      const updates: string[] = [];
      const params: any[] = [];

      if (status !== undefined) { updates.push("status = ?"); params.push(status); }
      if (name !== undefined) { updates.push("name = ?"); params.push(name); }
      if (email !== undefined) { updates.push("email = ?"); params.push(email); }
      if (phone !== undefined) { updates.push("phone = ?"); params.push(phone); }
      if (service_type !== undefined) { updates.push("service_type = ?"); params.push(service_type); }
      if (description !== undefined) { updates.push("description = ?"); params.push(description); }

      if (updates.length === 0) {
        return res.status(400).json({ error: "No fields to update" });
      }

      params.push(id);
      const stmt = db.prepare(`UPDATE requests SET ${updates.join(", ")} WHERE id = ?`);
      stmt.run(...params);

      // If status was updated, notify customer
      if (status !== undefined) {
        const request = db.prepare("SELECT * FROM requests WHERE id = ?").get(id) as any;
        if (request) {
          sendCustomerStatusUpdate(request, status);
        }
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to update request" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
