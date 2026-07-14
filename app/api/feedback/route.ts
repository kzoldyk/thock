import { NextResponse } from "next/server"
import nodemailer from "nodemailer"

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

      return NextResponse.json({
        success: true,
        mocked: true,
        message: "Feedback logged to console (SMTP environment variables not configured).",
      })
    }

    // Configure Nodemailer Transporter
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort),
      secure: smtpPort === "465",
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })

    // Send Mail
    await transporter.sendMail({
      from: smtpFrom,
      to: "hitesh.prajapati.in@gmail.com",
      subject: mailSubject,
      html: htmlContent,
      text: `thock. Feedback\n\nCategory: ${subjectType}\nName: ${name || "N/A"}\nEmail: ${email || "N/A"}\nDevice / OS: ${detectedOS}\nScreen: ${screen}\nLanguage: ${language}\nUser Agent: ${userAgent}\n\nMessage:\n${message}`,
    })

    return NextResponse.json({ success: true, mocked: false })
  } catch (error) {
    const err = error as Error
    console.error("[api/feedback] Error sending feedback:", err)
    return NextResponse.json(
      { error: err.message || "Failed to send feedback. Please try again later." },
      { status: 500 }
    )
  }
}
