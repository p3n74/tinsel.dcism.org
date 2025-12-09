import nodemailer from "nodemailer";

interface EmailConfig {
	to: string;
	subject: string;
	html: string;
}

class EmailService {
	private transporter: nodemailer.Transporter;

	constructor() {
		const emailProvider = process.env.EMAIL_PROVIDER || "gmail";

		switch (emailProvider) {
			case "gmail":
				this.transporter = nodemailer.createTransport({
					service: "gmail",
					auth: {
						user: process.env.EMAIL_FROM,
						pass: process.env.EMAIL_PASSWORD,
					},
				});
				break;

			case "sendgrid":
				this.transporter = nodemailer.createTransport({
					host: "smtp.sendgrid.net",
					port: 587,
					secure: false,
					auth: {
						user: "apikey",
						pass: process.env.SENDGRID_API_KEY,
					},
				});
				break;

			case "resend":
				this.transporter = nodemailer.createTransport({
					host: "smtp.resend.com",
					port: 587,
					secure: false,
					auth: {
						user: "resend",
						pass: process.env.RESEND_API_KEY,
					},
				});
				break;

			default:
				// For development/testing, use a mock transporter
				this.transporter = nodemailer.createTransport({
					host: "localhost",
					port: 1025,
					secure: false,
					ignoreTLS: true,
				});
		}
        console.log(`[EmailService] Initialized with ${emailProvider} provider.`);
	}

	private async sendEmail(config: EmailConfig): Promise<boolean> {
		try {
			const mailOptions = {
				from: `"Nikolai from CISCO" <${process.env.EMAIL_FROM || "noreply@campus-life-interface.com"}>`,
				to: config.to,
				subject: config.subject,
				html: config.html,
			};

            console.log("[EmailService] Attempting to send email with options:", mailOptions);

			const info = await this.transporter.sendMail(mailOptions);
			console.log("[EmailService] Email sent successfully. Response:", info);
			return true;
		} catch (error) {
			console.error("[EmailService] Failed to send email. Full error:", error);
			return false;
		}
	}

	async sendTinselTreatsClaimedEmail(params: {
		email: string;
		studentName: string;
        foodClaimed: string;
        officerName: string;
	}): Promise<boolean> {
		const subject = `Tinsel Treats Claimed!`;

		const html = `
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="utf-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Tinsel Treats Claimed!</title>
				<style>
					body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
					.container { max-width: 640px; margin: 0 auto; padding: 20px; }
					.header { background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; padding: 24px; text-align: center; border-radius: 10px 10px 0 0; }
					.content { background: #f9f9f9; padding: 24px; border-radius: 0 0 10px 10px; }
                    .meta-info { font-size: 0.9em; color: #555; }
					.footer { text-align: center; margin-top: 24px; color: #666; font-size: 14px; }
				</style>
			</head>
			<body>
				<div class="container">
					<div class="header">
						<h1>Tinsel Treats</h1>
						<p>Claim Confirmation</p>
					</div>
					<div class="content">
						<p>Hi ${params.studentName},</p>
						<p>This is to confirm that you have successfully claimed your <strong>${params.foodClaimed}</strong> for Tinsel Treats!</p>
                        <p>We're wishing you a very Merry Christmas and the best of luck on your final examinations!</p>
						
                        <br>
                        <p class="meta-info">This claim was processed by Officer ${params.officerName}.</p>

						<br><br>--
						<br><strong>Nikolai Tristan E. Pazon</strong>
						<br>Vice-President for Finance | Computer and Information Sciences Council
						<br><a href='http://dcism.org'>Department of Computer, Information Sciences, and Mathematics</a>
						<br><span style='color: green;'>UNIVERSITY OF SAN CARLOS</span>
						<br><em style='color: green;'>The content of this email is confidential and is intended for the recipient specified in message only. It is strictly forbidden to share any part of this message with any third party without the express consent of the sender. If you received this message by mistake, please reply to this message and follow with its deletion, so that we can ensure such a mistake does not occur in the future.
						</em>
					</div>
					<div class="footer">
						<p>&copy; 2024 Campus Life Interface. All rights reserved.</p>
						<p>This email was sent to ${params.email}</p>
					</div>
				</div>
			</body>
			</html>
		`;

		return this.sendEmail({
			to: params.email,
			subject,
			html,
		});
	}
}

export const emailService = new EmailService();
