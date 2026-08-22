import { NextResponse } from "next/server"
import nodemailer from "nodemailer"
import { db } from "@/lib/db"

interface FeedbackRow {
  id: string
  type: string
  name: string | null
  email: string | null
  message: string
  user_agent: string | null
  language: string | null
  screen: string | null
  os: string | null
  is_mocked: number
  status: string
  created_at: number
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, name, email, message, metadata } = body

    if (!type || !message) {
      return NextResponse.json(
        { error: "Feedback type and message are required." },
        { status: 400 }
      )
    }

    // Determine subject based on type
    let subjectType = "General Feedback"
    if (type === "bug") {
      subjectType = "Bug Report"
    } else if (type === "feature") {
      subjectType = "Feature Recommendation"
    } else if (type === "appreciation") {
      subjectType = "Appreciation"
    }

    const senderIdentifier = name || email || "Anonymous"
    const mailSubject = `[Thock ${subjectType}] from ${senderIdentifier}`

    // Parse metadata
    const userAgent = metadata?.userAgent || "Unknown"
    const language = metadata?.language || "Unknown"
    const screen = metadata?.screen || "Unknown"

    let detectedOS = "Unknown OS"
    if (/iphone|ipad|ipod/i.test(userAgent)) {
      detectedOS = "iOS"
    } else if (/android/i.test(userAgent)) {
      detectedOS = "Android"
    } else if (/macintosh|mac os x/i.test(userAgent)) {
      detectedOS = "macOS"
    } else if (/windows/i.test(userAgent)) {
      detectedOS = "Windows"
    } else if (/linux/i.test(userAgent)) {
      detectedOS = "Linux"
    }

    // 1. Persist to D1 first — email delivery is best-effort on top.
    let stored = false
    try {
      await db.execute(
        `INSERT INTO feedback (id, type, name, email, message, user_agent, language, screen, os, is_mocked, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          `fb_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          String(type),
          name ? String(name) : null,
          email ? String(email) : null,
          String(message),
          userAgent === "Unknown" ? null : String(userAgent).slice(0, 512),
          language === "Unknown" ? null : String(language).slice(0, 64),
          screen === "Unknown" ? null : String(screen).slice(0, 64),
          detectedOS,
          0,
          "new",
          Date.now(),
        ]
      )
      stored = true
    } catch (dbErr) {
      console.error("[api/feedback] Failed to store feedback in D1:", dbErr)
    }

    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e7; borderRadius: 8px; color: #18181b;">
        <h2 style="border-bottom: 2px solid #18181b; padding-bottom: 10px; margin-top: 0; color: #18181b;">thock. Feedback Submission</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          <tr>
            <td style="padding: 6px 0; font-weight: bold; width: 120px; border-bottom: 1px solid #f4f4f5;">Category:</td>
            <td style="padding: 6px 0; border-bottom: 1px solid #f4f4f5;">${subjectType}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold; border-bottom: 1px solid #f4f4f5;">Sender Name:</td>
            <td style="padding: 6px 0; border-bottom: 1px solid #f4f4f5;">${name || "Not provided"}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold; border-bottom: 1px solid #f4f4f5;">Sender Email:</td>
            <td style="padding: 6px 0; border-bottom: 1px solid #f4f4f5;">${email || "Not provided"}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold; border-bottom: 1px solid #f4f4f5;">Submitted At:</td>
            <td style="padding: 6px 0; border-bottom: 1px solid #f4f4f5;">${new Date().toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold; border-bottom: 1px solid #f4f4f5;">Device / OS:</td>
            <td style="padding: 6px 0; border-bottom: 1px solid #f4f4f5;">${detectedOS}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold; border-bottom: 1px solid #f4f4f5;">Screen Size:</td>
            <td style="padding: 6px 0; border-bottom: 1px solid #f4f4f5;">${screen}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold; border-bottom: 1px solid #f4f4f5;">Language:</td>
            <td style="padding: 6px 0; border-bottom: 1px solid #f4f4f5;">${language}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold; vertical-align: top; font-size: 11px; color: #71717a;">User Agent:</td>
            <td style="padding: 6px 0; font-size: 11px; color: #71717a; word-break: break-all; max-width: 440px;">${userAgent}</td>
          </tr>
        </table>
        <div style="margin-top: 20px; padding: 15px; background-color: #f4f4f5; border-radius: 6px; border-left: 4px solid #18181b; white-space: pre-wrap; font-size: 14px; line-height: 1.6;">
          ${message}
        </div>
      </div>
    `

    const smtpHost = process.env.SMTP_HOST
    const smtpPort = process.env.SMTP_PORT
    const smtpUser = process.env.SMTP_USER
    const smtpPass = process.env.SMTP_PASS
    const smtpFrom = process.env.SMTP_FROM || `"thock. Feedback" <noreply@thock.dev>`

    // Verify SMTP env vars. If any are missing, fall back to console logging
    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
      console.log("\n========================================================")
      console.log("📨  [MOCK EMAIL SUBMISSION] (SMTP Settings Missing)")
      console.log(`To: hitesh.prajapati.in@gmail.com`)
      console.log(`Subject: ${mailSubject}`)
      console.log("--------------------------------------------------------")
      console.log(`Category: ${type}`)
      console.log(`Sender: ${name || "Anonymous"} <${email || "not provided"}>`)
      console.log(`Device / OS: ${detectedOS}`)
      console.log(`Screen Size: ${screen}`)
      console.log(`Language: ${language}`)
      console.log(`User Agent: ${userAgent}`)
      console.log("------------------------ MESSAGE -----------------------")
      console.log(message)
      console.log("========================================================\n")

      if (stored) {
        try {
          await db.execute(`UPDATE feedback SET is_mocked = 1 WHERE created_at = (SELECT MAX(created_at) FROM feedback)`)
        } catch {}
      }

      return NextResponse.json({
        success: true,
        stored,
        mocked: true,
        message: stored
          ? "Feedback saved and logged to console (SMTP not configured)."
          : "Feedback logged to console (SMTP environment variables not configured).",
      })
    }

    // Configure Nodemailer Transporter — failure here must NOT lose the stored row
    let emailed = false
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort),
        secure: smtpPort === "465",
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      })

      await transporter.sendMail({
        from: smtpFrom,
        to: "hitesh.prajapati.in@gmail.com",
        subject: mailSubject,
        html: htmlContent,
        text: `thock. Feedback\n\nCategory: ${subjectType}\nName: ${name || "N/A"}\nEmail: ${email || "N/A"}\nDevice / OS: ${detectedOS}\nScreen: ${screen}\nLanguage: ${language}\nUser Agent: ${userAgent}\n\nMessage:\n${message}`,
      })
      emailed = true
    } catch (mailErr) {
      console.error("[api/feedback] Email dispatch failed (feedback already stored):", mailErr)
    }

    return NextResponse.json({ success: true, stored, mocked: !emailed })
  } catch (error) {
    const err = error as Error
    console.error("[api/feedback] Error sending feedback:", err)
    return NextResponse.json(
      { error: err.message || "Failed to send feedback. Please try again later." },
      { status: 500 }
    )
  }
}

/**
 * GET /api/feedback — recent submissions for the /analytics dashboard.
 * Password-gated with the same credential as /api/analytics (PII protection).
 */
export async function GET(request: Request) {
  try {
    const ANALYTICS_PASSWORD = process.env.ANALYTICS_PASSWORD || "1501"
    const provided =
      request.headers.get("x-analytics-password") ||
      new URL(request.url).searchParams.get("password")
    if (provided !== ANALYTICS_PASSWORD) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", feedback: [] },
        { status: 401 }
      )
    }

    const rows = await db.query<FeedbackRow>(
      `SELECT id, type, name, email, message, user_agent, language, screen, os, is_mocked, status, created_at
       FROM feedback
       ORDER BY created_at DESC
       LIMIT 200`
    )
    return NextResponse.json({ success: true, feedback: rows })
  } catch (error) {
    const err = error as Error
    console.error("[api/feedback] Failed to list feedback:", err)
    return NextResponse.json(
      { success: false, error: err.message || "Failed to load feedback.", feedback: [] },
      { status: 500 }
    )
  }
}
