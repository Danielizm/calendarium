
import { asDownload } from '../download.js'

const template = `
BEGIN:VCALENDAR
VERSION:2.0
PRODID:calendarium
BEGIN:VEVENT
UID:$uid@calendarium
DTSTART$dstartF
DTEND$dstopF
SEQUENCE:0
TRANSP:OPAQUE
$location
$title
CLASS:PUBLIC
$description
DTSTAMP$dnowF
END:VEVENT
END:VCALENDAR`

function uid () {
  return '_' + Math.random().toString(36).substr(2, 9)
}

/* generic endpoint */
export default function (calendarium) {
  const _makeDate = function (datetime, dayEvent = false) {
    if (!dayEvent) {
      return ':' + datetime.toISOString().replace(/\.\d+Z$/, 'Z').replace(/[-:]/g, '')
    } else {
      const day = datetime.toISOString().split('T')[0].replace(/-/g, '')
      return ';VALUE=DATE:' + day
    }
  }

  const _wrapLine = function (text, length = 73, prefix = '  ') {
    const re = new RegExp('(.{' + length + '})')
    const chunked = text
      .replace(/\n/g, ' ')
      .split(re)
      .filter($.trim)
      .join('\n  ')

    return $.trim(chunked)
  }

  const _addDays = function (date, days = 1) {
    const d = new Date(date)
    d.setDate(d.getDate() + days)
    return d
  }

  const _makeICSFile = function (data) {
    const isAllday = (data.mode && data.mode === 'day')

    const startStr = _makeDate(data.start, isAllday)
    const endStr = _makeDate(data.stop, isAllday)
    const altEndStr = isAllday && endStr === startStr
      ? _makeDate(_addDays(data.stop, 1), isAllday)
      : null

    return $.trim(template)
      .replace('$uid', uid())
      .replace('$dstartF', startStr)
      .replace('$dstopF', altEndStr || endStr)
      .replace('$dnowF', _makeDate(new Date()))
      .replace('$location', _wrapLine(`LOCATION:${data.location}`))
      .replace('$title', _wrapLine(`SUMMARY:${data.title}`))
      .replace('$description', _wrapLine(`DESCRIPTION:${data.description}`))
      .replace(/\n/g, '\r\n')
  }

  return {
    name: 'ics',
    title: {
      'de': 'als iCal Datei speichern',
      'en': 'save as iCal file'
    },
    text: {
      'de': 'iCal',
      'en': 'iCal'
    },
    link: () => {
      const eventData = calendarium.getEventData()
      const eventName = eventData.title || 'event'
      const payload = _makeICSFile(eventData)
      asDownload(payload, `${eventName}.ics`, 'text/calendar', false)
    }
  }
}
