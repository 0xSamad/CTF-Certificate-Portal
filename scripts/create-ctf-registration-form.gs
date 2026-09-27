/**
 * Creates a Google Form and a linked response spreadsheet for certificate data.
 *
 * How to use:
 * 1. Visit https://script.google.com and create a New project.
 * 2. Replace the default Code.gs with this file's contents.
 * 3. Run createCtfCertificateRegistrationForm and approve Google's prompts.
 * 4. Copy the public form URL from Executions/Logs and share it with students.
 * 5. In the linked Sheet, use File → Download → Comma-separated values (.csv),
 *    then upload that CSV to the CTF Certificate Portal's /admin page.
 */

const EVENT_NAME = "Peshawar Pentesters CTF 2026";
const ORGANIZER = "Peshawar Pentesters";

function createCtfCertificateRegistrationForm() {
  const form = FormApp.create(`${EVENT_NAME} — Certificate Details`);
  form
    .setDescription(
      `Thank you for participating in ${EVENT_NAME}!\n\n` +
      `Please submit the name and email address that should appear on your official certificate. ` +
      `Use an email address you can access: it will be used to find and download your certificate.\n\n` +
      `Organized by ${ORGANIZER}.`
    )
    .setConfirmationMessage(
      `Thank you! ${ORGANIZER} has received your certificate details. ` +
      `Your certificate will be available after the event results are published.`
    )
    .setCollectEmail(false)
    .setProgressBar(true)
    .setShowLinkToRespondAgain(false);

  form.addTextItem()
    .setTitle("Full Name")
    .setHelpText("Enter your full name exactly as it should appear on the certificate.")
    .setRequired(true);

  const emailValidation = FormApp.createTextValidation()
    .requireTextIsEmail()
    .setHelpText("Enter a valid email address, for example name@example.com.")
    .build();

  form.addTextItem()
    .setTitle("Email")
    .setHelpText("Use the email address you will later use to retrieve your certificate.")
    .setValidation(emailValidation)
    .setRequired(true);

  form.addCheckboxItem()
    .setTitle("Confirmation")
    .setHelpText("Required so we only issue certificates using participant-provided details.")
    .setChoiceValues(["I confirm that my name and email are correct for my CTF certificate."])
    .setRequired(true);

  const responseSheet = SpreadsheetApp.create(`${EVENT_NAME} — Certificate Responses`);
  form.setDestination(FormApp.DestinationType.SPREADSHEET, responseSheet.getId());

  Logger.log("Student form (share this): " + form.getPublishedUrl());
  Logger.log("Form editor (keep private): " + form.getEditUrl());
  Logger.log("Response spreadsheet: " + responseSheet.getUrl());
}
