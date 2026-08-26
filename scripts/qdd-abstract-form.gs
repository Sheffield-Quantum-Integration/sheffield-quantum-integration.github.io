/**
 * Creates the Quantum Dot Day 2026 abstract form and a linked response sheet.
 *
 * In https://script.google.com (signed in as joe.a.smith@sheffield.ac.uk):
 *   1. New project → paste this file → save
 *   2. Run createQddAbstractForm
 *   3. Accept the Forms + Drive + Sheets permissions
 *   4. View → Logs — copy publishedUrl into QDD_ABSTRACT_FORM_URL in src/App.jsx
 *
 * Safe to re-run: it will not overwrite an existing form with the same title.
 * Delete that form first if you want a clean rebuild.
 */
function createQddAbstractForm() {
  const TITLE = 'Quantum Dot Day 2026 — Abstract submission'
  const existing = findFormByTitle_(TITLE)
  if (existing) {
    Logger.log(JSON.stringify({
      alreadyExists: true,
      publishedUrl: existing.getPublishedUrl(),
      editUrl: existing.getEditUrl()
    }, null, 2))
    return existing
  }

  const form = FormApp.create(TITLE)
  form.setDescription(
    'Thursday 26 November 2026, Sheffield Town Hall.\n\n' +
      'We welcome contributions for oral and poster presentations. ' +
      'Abstracts of 250 words should be submitted online.\n\n' +
      'The 2026 meeting keeps the broader scope of Cardiff 2025 — colour centres ' +
      'and related emitters as well as epitaxial dots.'
  )
  form.setAllowResponseEdits(true)
  form.setCollectEmail(true)
  form.setLimitOneResponsePerUser(false)
  form.setProgressBar(true)
  form.setConfirmationMessage(
    'Thank you. Your abstract has been received for Quantum Dot Day 2026.'
  )

  form.addTextItem()
    .setTitle('Presenting author')
    .setRequired(true)

  form.addTextItem()
    .setTitle('Institution')
    .setHelpText('University or organisation of the presenting author.')
    .setRequired(true)

  form.addParagraphTextItem()
    .setTitle('Co-authors')
    .setHelpText('Names and institutions, one per line. Leave blank if none.')
    .setRequired(false)

  form.addTextItem()
    .setTitle('Abstract title')
    .setRequired(true)

  form.addParagraphTextItem()
    .setTitle('Abstract')
    .setHelpText('250 words. Do not include figures.')
    .setRequired(true)

  form.addMultipleChoiceItem()
    .setTitle('Presentation preference')
    .setChoiceValues(['Contributed talk', 'Poster', 'Either'])
    .setRequired(true)

  form.addMultipleChoiceItem()
    .setTitle('Preferred session')
    .setChoiceValues([
      'Epitaxy / III–V emitters',
      'Colour centres / defects',
      'Colloidal / soft-matter',
      'Optics / integration / devices'
    ])
    .setRequired(true)

  const sheet = SpreadsheetApp.create('Quantum Dot Day 2026 — Abstract submissions')
  form.setDestination(FormApp.DestinationType.SPREADSHEET, sheet.getId())

  Logger.log(JSON.stringify({
    publishedUrl: form.getPublishedUrl(),
    editUrl: form.getEditUrl(),
    sheetUrl: sheet.getUrl()
  }, null, 2))

  return form
}

function findFormByTitle_(title) {
  const files = DriveApp.getFilesByName(title)
  while (files.hasNext()) {
    const file = files.next()
    if (file.getMimeType() === MimeType.GOOGLE_FORMS) {
      return FormApp.openById(file.getId())
    }
  }
  return null
}
