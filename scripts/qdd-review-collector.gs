/**
 * Quantum Dot Day 2026 committee ranking collector.
 * Appends each POST to a Google Sheet. The response is only { ok: true } or an error.
 * It never reads or returns other reviewers' rows.
 *
 * Deploy:
 * 1. Create a Google Sheet, then Extensions → Apps Script, paste this file, and save.
 * 2. Run setupRankingSheet once and approve the Sheets permission when prompted.
 * 3. Deploy → New deployment → Web app. Execute as: Me. Who has access: Anyone.
 * 4. Copy the /exec URL into QDD_REVIEW_SCRIPT_URL in src/qdd-review/config.js and rebuild the site.
 * 5. After any later edit, Deploy → Manage deployments → Edit → New version. Each submit appends a row.
 */

var HEADERS = [
  'Timestamp',
  'Reviewer',
  'Ranked order',
  'Session moves',
  'Conflicts',
  'Notes',
  'Proposed moves',
  'Poster decisions',
  'Raw JSON'
]

function setupRankingSheet() {
  var sheet = rankingSheet_()
  Logger.log('Rankings sheet ready: ' + sheet.getParent().getUrl())
}

function doGet() {
  return json_({
    ok: true,
    message: 'POST a ranking JSON body. This endpoint does not return submissions.'
  })
}

function doPost(e) {
  var lock = LockService.getScriptLock()
  try {
    lock.waitLock(15000)
    var raw = e && e.postData && e.postData.contents ? e.postData.contents : '{}'
    var data = JSON.parse(raw)
    var sheet = rankingSheet_()
    sheet.appendRow([
      asText_(data.submittedAt || new Date().toISOString()),
      asText_(data.reviewer || ''),
      asText_(rankedCell_(data)),
      asText_(movesCell_(data)),
      asText_(conflictsCell_(data)),
      asText_(notesCell_(data)),
      asText_(proposalsCell_(data)),
      asText_(postersCell_(data)),
      clip_(raw)
    ])
    return json_({ ok: true })
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message ? err.message : err) })
  } finally {
    lock.releaseLock()
  }
}

function spreadsheet_() {
  var active = SpreadsheetApp.getActiveSpreadsheet()
  if (active) return active
  var props = PropertiesService.getScriptProperties()
  var existing = props.getProperty('SHEET_ID')
  if (existing) return SpreadsheetApp.openById(existing)
  var created = SpreadsheetApp.create('Quantum Dot Day 2026 — Committee rankings')
  props.setProperty('SHEET_ID', created.getId())
  return created
}

function rankingSheet_() {
  var ss = spreadsheet_()
  var sheet = ss.getSheetByName('Rankings')
  if (!sheet) {
    var first = ss.getSheets()[0]
    if (first.getLastRow() === 0) {
      sheet = first
      sheet.setName('Rankings')
    } else {
      sheet = ss.insertSheet('Rankings')
    }
  }
  ensureHeaders_(sheet)
  return sheet
}

function ensureHeaders_(sheet) {
  if (sheet.getLastRow() === 0 || !sheet.getRange(1, 1).getValue()) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS])
    sheet.setFrozenRows(1)
    return
  }
  var current = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0]
  for (var i = 0; i < HEADERS.length; i++) {
    if (current[i] !== HEADERS[i]) sheet.getRange(1, i + 1).setValue(HEADERS[i])
  }
  sheet.setFrozenRows(1)
}

function rankedCell_(data) {
  var blocks = data.sessions || []
  if (!blocks.length) return 'none'
  return blocks
    .map(function (block) {
      var lines = [(block.session || 'Session') + ' (target ' + block.talkTarget + ')']
      var rows = block.ranked || []
      if (!rows.length) lines.push('(none)')
      rows.forEach(function (row) {
        var mark = row.conflict ? 'SKIP' : row.aboveCut ? 'TALK ' + row.talkRank : 'below ' + row.talkRank
        lines.push(mark + '  ' + row.id + '  ' + (row.presenter || '') + ' — ' + (row.title || ''))
      })
      return lines.join('\n')
    })
    .join('\n\n')
}

function movesCell_(data) {
  var moves = data.moves || []
  if (!moves.length) return 'none'
  return moves
    .map(function (move) {
      return move.id + ': ' + move.from + ' → ' + move.to
    })
    .join('\n')
}

function conflictsCell_(data) {
  var conflicts = data.conflicts || []
  if (!conflicts.length) return 'none'
  return conflicts
    .map(function (conflict) {
      return conflict.id + ' (' + (conflict.session || '') + ')' + (conflict.note ? ' — ' + conflict.note : '')
    })
    .join('\n')
}

function notesCell_(data) {
  var notes = data.notes || []
  if (!notes.length) return 'none'
  return notes
    .map(function (note) {
      return note.id + ': ' + note.note
    })
    .join('\n')
}

function decisionLabel_(decision) {
  if (decision === 'confirm') return 'confirm this session'
  if (decision === 'original') return 'keep in original session'
  return 'unanswered'
}

function proposalsCell_(data) {
  var proposals = data.proposals || []
  if (!proposals.length) return 'none'
  return proposals
    .map(function (proposal) {
      return (
        proposal.id +
        ' decision: ' +
        decisionLabel_(proposal.decision) +
        ' — comment: ' +
        (proposal.comment || '(none)') +
        ' — submitted to ' +
        proposal.submittedSession +
        ' — proposed ' +
        proposal.proposedSession +
        ' — current ' +
        proposal.currentSession
      )
    })
    .join('\n')
}

function postersCell_(data) {
  var posters = data.posters || []
  if (!posters.length) return 'none'
  return posters
    .map(function (poster) {
      var verdict = poster.decision === 'reject' || poster.accept === false ? 'REJECT' : 'ACCEPT'
      var reason = verdict === 'REJECT' ? ' — reason: ' + (poster.reason || '(missing)') : ''
      var conflict = poster.conflict ? ' — conflict' : ''
      var note = poster.note ? ' — note: ' + poster.note : ''
      return verdict + '  ' + poster.id + '  ' + (poster.presenter || '') + reason + conflict + note
    })
    .join('\n')
}

function asText_(value) {
  var text = value == null ? '' : String(value)
  if (/^[=+\-@]/.test(text)) return "'" + text
  return text
}

function clip_(value) {
  var text = value == null ? '' : String(value)
  if (text.length <= 49000) return text
  return text.slice(0, 49000) + '\n…[truncated]'
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON)
}
