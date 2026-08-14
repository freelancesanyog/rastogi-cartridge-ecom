import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task
def send_contact_email_task(name: str, email: str, subject: str, message: str):
    """
    Asynchronous task to log and process customer inquiry emails.
    """
    logger.info(
        f"[CONTACT INQUIRY] From: {name} <{email}> | Subject: {subject} | Message: {message}"
    )
    return True
