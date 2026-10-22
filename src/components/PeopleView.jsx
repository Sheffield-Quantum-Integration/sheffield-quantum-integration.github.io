import { Mail } from 'lucide-react'
import { groupCoreMembers } from '../site/content.js'
import { Avatar, Container, ExternalLink, PageHeader, buttonStyles } from './ui.jsx'

const slug = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-')

const PI_LINKS = [
  ['staffProfile', 'Staff profile'],
  ['orcid', 'ORCID'],
  ['linkedin', 'LinkedIn']
]

const PiCard = ({ pi }) => (
  <section
    aria-labelledby="pi-name"
    className="grid gap-8 rounded-lg border border-white/10 bg-navy-900 p-6 sm:grid-cols-[11rem_minmax(0,1fr)] md:grid-cols-[14rem_minmax(0,1fr)] md:gap-10 md:p-10"
  >
    <img
      src={pi.photo}
      alt=""
      width={pi.photoWidth || 448}
      height={pi.photoHeight || 672}
      decoding="async"
      className="aspect-[2/3] w-40 rounded-md border border-white/10 bg-navy-800 object-cover sm:w-full"
    />
    <div className="min-w-0">
      <p className="text-sm font-semibold text-amber-300">{pi.role}</p>
      <h2 id="pi-name" className="mt-1 text-3xl font-semibold tracking-tight text-white">
        {pi.name}
      </h2>
      <ul className="mt-5 flex flex-wrap gap-2">
        {PI_LINKS.filter(([key]) => pi.socials?.[key]).map(([key, label]) => (
          <li key={key}>
            <ExternalLink href={pi.socials[key]} className={buttonStyles.pill}>
              {label}
            </ExternalLink>
          </li>
        ))}
        {pi.socials?.email && (
          <li>
            <a href={pi.socials.email} className={buttonStyles.pill}>
              <Mail className="h-4 w-4" aria-hidden="true" />
              Email
            </a>
          </li>
        )}
      </ul>
      <h3 className="mt-8 text-lg font-semibold text-white">Biography</h3>
      <p className="mt-3 leading-relaxed text-slate-300">{pi.bio}</p>
      {pi.timeline?.length > 0 && (
        <dl className="mt-6 space-y-3 text-sm">
          {pi.timeline.map((entry) => {
            const [when, ...rest] = entry.split(':')
            return (
              <div key={entry} className="grid gap-x-4 sm:grid-cols-[8.5rem_minmax(0,1fr)]">
                <dt className="font-semibold text-slate-200">{when.trim()}</dt>
                <dd className="text-slate-400">{rest.join(':').trim()}</dd>
              </div>
            )
          })}
        </dl>
      )}
    </div>
  </section>
)

const PersonCard = ({ name, detail, note, photo }) => (
  <li className="flex items-center gap-4 rounded-lg border border-white/10 bg-navy-900 p-5">
    <Avatar name={name} photo={photo} />
    <div className="min-w-0">
      <p className="break-words font-semibold text-slate-100">{name}</p>
      {detail && <p className="text-sm text-amber-300">{detail}</p>}
      {note && <p className="mt-1 break-words text-sm text-slate-400">{note}</p>}
    </div>
  </li>
)

export default function PeopleView({ people }) {
  const pi = people?.pi
  const groups = groupCoreMembers(people?.members)
  const collaborators = people?.collaborators || []
  const alumni = people?.alumni || []

  return (
    <div className="pb-20">
      <PageHeader title="People" />
      <Container className="space-y-16 pt-12 md:pt-16">
        {pi && <PiCard pi={pi} />}

        {groups.map(({ group, members }) => (
          <section key={group} aria-labelledby={`group-${slug(group)}`}>
            <h2 id={`group-${slug(group)}`} className="text-2xl font-semibold tracking-tight text-white">
              {group}
            </h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {members.map((member) => (
                <PersonCard key={member.name} name={member.name} detail={member.role} note={member.note} photo={member.photo} />
              ))}
            </ul>
          </section>
        ))}

        {collaborators.length > 0 && (
          <section aria-labelledby="people-collaborators" className="border-t border-white/10 pt-12">
            <h2 id="people-collaborators" className="text-2xl font-semibold tracking-tight text-white">
              {people.collaboratorsHeading}
            </h2>
            {people.collaboratorsIntro && <p className="mt-3 max-w-2xl text-slate-400">{people.collaboratorsIntro}</p>}
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {collaborators.map((person) => (
                <PersonCard key={person.name} name={person.name} note={person.affiliation} photo={person.photo} />
              ))}
            </ul>
          </section>
        )}

        {alumni.length > 0 && (
          <section aria-labelledby="people-alumni" className="border-t border-white/10 pt-12">
            <h2 id="people-alumni" className="text-2xl font-semibold tracking-tight text-white">
              Previous Team Members
            </h2>
            <ul className="mt-6 divide-y divide-white/5 rounded-lg border border-white/10 bg-navy-900 px-6">
              {alumni.map((person) => (
                <li key={person.name} className="flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                  <span className="font-semibold text-slate-100">{person.name}</span>
                  {person.destination && <span className="text-sm text-slate-400">{person.destination}</span>}
                </li>
              ))}
            </ul>
          </section>
        )}
      </Container>
    </div>
  )
}
