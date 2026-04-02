"""
Notification service for Blood Bank Management System.
Integrates with SendGrid (email) and Twilio (SMS).
Set environment variables: SENDGRID_API_KEY, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_PHONE
"""
import os
import logging

logger = logging.getLogger(__name__)

SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_FROM_PHONE = os.getenv("TWILIO_FROM_PHONE")
FROM_EMAIL = os.getenv("FROM_EMAIL", "noreply@bloodbank.com")


def send_email(to_email: str, subject: str, body: str):
    """Send email via SendGrid."""
    if not SENDGRID_API_KEY:
        logger.info(f"[EMAIL STUB] To: {to_email} | Subject: {subject}")
        return
    try:
        import sendgrid
        from sendgrid.helpers.mail import Mail
        sg = sendgrid.SendGridAPIClient(SENDGRID_API_KEY)
        message = Mail(from_email=FROM_EMAIL, to_emails=to_email, subject=subject, plain_text_content=body)
        sg.send(message)
        logger.info(f"Email sent to {to_email}")
    except Exception as e:
        logger.error(f"Email send failed: {e}")


def send_sms(to_phone: str, message: str):
    """Send SMS via Twilio."""
    if not (TWILIO_ACCOUNT_SID and to_phone):
        logger.info(f"[SMS STUB] To: {to_phone} | Message: {message}")
        return
    try:
        from twilio.rest import Client
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        client.messages.create(body=message, from_=TWILIO_FROM_PHONE, to=to_phone)
        logger.info(f"SMS sent to {to_phone}")
    except Exception as e:
        logger.error(f"SMS send failed: {e}")


async def notify_blood_request(blood_request, user):
    """Notify admin and user on new blood request."""
    admin_email = os.getenv("ADMIN_EMAIL", "admin@bloodbank.com")
    urgency = blood_request.urgency.upper()

    # Notify admin
    send_email(
        admin_email,
        f"[{urgency}] New Blood Request - {blood_request.blood_group}",
        f"New blood request from {user.name}.\n"
        f"Patient: {blood_request.patient_name}\n"
        f"Blood Group: {blood_request.blood_group}\n"
        f"Units: {blood_request.units_needed}\n"
        f"Hospital: {blood_request.hospital_name}\n"
        f"Urgency: {blood_request.urgency}"
    )

    # Notify requester
    send_email(
        user.email,
        "Blood Request Submitted",
        f"Dear {user.name},\n\nYour blood request for {blood_request.units_needed} units of "
        f"{blood_request.blood_group} has been submitted and is pending review.\n\nRequest ID: {blood_request.id}"
    )
    if user.phone:
        send_sms(user.phone, f"BloodBank: Your request #{blood_request.id} for {blood_request.blood_group} is under review.")


async def send_appointment_confirmation(appointment, user):
    """Send appointment confirmation to user."""
    send_email(
        user.email,
        "Appointment Confirmation",
        f"Dear {user.name},\n\nYour appointment has been booked.\n"
        f"Type: {appointment.appointment_type}\n"
        f"Date: {appointment.scheduled_date.strftime('%B %d, %Y at %I:%M %p')}\n"
        f"Appointment ID: {appointment.id}\n\n"
        f"Please arrive 15 minutes early."
    )
    if user.phone:
        send_sms(user.phone, f"BloodBank: Appointment #{appointment.id} on {appointment.scheduled_date.strftime('%b %d at %I:%M %p')} confirmed.")
