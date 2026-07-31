'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'
import {
  Code,
  Target,
  Users,
  Lightbulb,
  Github,
  Linkedin,
  Mail,
  Twitter,
  ArrowRight,
  Heart,
  Zap,
  Globe
} from 'lucide-react'
import { ContactForm } from '@/components/about/ContactForm'
import { TeamMember } from '@/lib/types'
import { useState, useEffect } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

// Shared surface treatment for every card on this page: generous radius, hairline
// border and a soft shadow that deepens as the card lifts on hover.
const cardSurface =
  'group h-full rounded-2xl border-border/60 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5'

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

const socialLinkClass =
  'rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary'

function TeamMemberCard({ member, index }: { member: TeamMember; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="h-full"
    >
      <Card className={`${cardSurface} flex flex-col`}>
        <CardHeader className="items-center pt-8 text-center">
          {/* Gradient ring: padded wrapper shows through as a border around the avatar */}
          <div className="mb-5 rounded-full bg-gradient-to-br from-primary via-primary/50 to-secondary p-[3px] transition-transform duration-300 group-hover:scale-105">
            <div className="relative h-32 w-32 overflow-hidden rounded-full bg-card ring-2 ring-card sm:h-36 sm:w-36">
              {member.imageUrl ? (
                <Image
                  src={member.imageUrl}
                  alt={member.name}
                  fill
                  sizes="144px"
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-secondary">
                  <span className="text-2xl font-semibold text-primary">
                    {getInitials(member.name)}
                  </span>
                </div>
              )}
            </div>
          </div>
          <CardTitle className="text-lg">{member.name}</CardTitle>
          <CardDescription className="font-medium text-primary">
            {member.role}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col items-center gap-5 pb-8">
          <p className="flex-1 text-center text-sm leading-relaxed text-muted-foreground">
            {member.bio}
          </p>

          {member.socialLinks && (
            <div className="flex justify-center gap-2">
              {member.socialLinks.email && (
                <Button variant="ghost" size="icon" className={socialLinkClass} asChild>
                  <a href={`mailto:${member.socialLinks.email}`}>
                    <Mail className="h-4 w-4" />
                    <span className="sr-only">Email</span>
                  </a>
                </Button>
              )}
              {member.socialLinks.linkedin && (
                <Button variant="ghost" size="icon" className={socialLinkClass} asChild>
                  <a href={member.socialLinks.linkedin} target="_blank" rel="noopener noreferrer">
                    <Linkedin className="h-4 w-4" />
                    <span className="sr-only">LinkedIn</span>
                  </a>
                </Button>
              )}
              {member.socialLinks.github && (
                <Button variant="ghost" size="icon" className={socialLinkClass} asChild>
                  <a href={member.socialLinks.github} target="_blank" rel="noopener noreferrer">
                    <Github className="h-4 w-4" />
                    <span className="sr-only">GitHub</span>
                  </a>
                </Button>
              )}
              {member.socialLinks.twitter && (
                <Button variant="ghost" size="icon" className={socialLinkClass} asChild>
                  <a href={member.socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                    <Twitter className="h-4 w-4" />
                    <span className="sr-only">Twitter</span>
                  </a>
                </Button>
              )}
              {member.socialLinks.website && (
                <Button variant="ghost" size="icon" className={socialLinkClass} asChild>
                  <a href={member.socialLinks.website} target="_blank" rel="noopener noreferrer">
                    <Globe className="h-4 w-4" />
                    <span className="sr-only">{`${member.name}'s portfolio website`}</span>
                  </a>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

function TeamMemberCardSkeleton() {
  return (
    <Card className="h-full rounded-2xl border-border/60 shadow-sm">
      <CardHeader className="items-center pt-8">
        <Skeleton className="mb-5 h-32 w-32 rounded-full sm:h-36 sm:w-36" />
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent className="space-y-2 pb-8">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="mx-auto h-3 w-5/6" />
        <Skeleton className="mx-auto h-3 w-2/3" />
      </CardContent>
    </Card>
  )
}

interface AboutClientProps {
  locale: string
}

export default function AboutClient({ locale }: AboutClientProps) {
  const t = useTranslations('about')
  const [coreTeamMembers, setCoreTeamMembers] = useState<TeamMember[]>([])
  const [leadershipTeam, setLeadershipTeam] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        const [coreTeamResponse, leadershipResponse] = await Promise.all([
          fetch('/api/team?leadership=false'),
          fetch('/api/team?leadership=true')
        ])

        const [coreTeamResult, leadershipResult] = await Promise.all([
          coreTeamResponse.json(),
          leadershipResponse.json()
        ])

        if (coreTeamResult.success) {
          setCoreTeamMembers(coreTeamResult.data)
        }

        if (leadershipResult.success) {
          setLeadershipTeam(leadershipResult.data)
        }
      } catch (error) {
        console.error('Error fetching team data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTeamData()
  }, [])

  const goals = [
    {
      icon: Users,
      title: t('goals.items.connect.title'),
      description: t('goals.items.connect.description'),
    },
    {
      icon: Code,
      title: t('goals.items.skills.title'),
      description: t('goals.items.skills.description'),
    },
    {
      icon: Heart,
      title: t('goals.items.community.title'),
      description: t('goals.items.community.description'),
    },
    {
      icon: Target,
      title: t('goals.items.opportunities.title'),
      description: t('goals.items.opportunities.description'),
    }
  ]

  const values = [
    {
      icon: Lightbulb,
      title: t('values.corevalues.corevalue1.title'),
      description: t('values.corevalues.corevalue1.description')
    },
    {
      icon: Globe,
      title: t('values.corevalues.corevalue2.title'),
      description: t('values.corevalues.corevalue2.description')
    },
    {
      icon: Zap,
      title: t('values.corevalues.corevalue3.title'),
      description: t('values.corevalues.corevalue3.description')
    }
  ]

  return (
    <div className="container py-20 space-y-20">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-6"
      >
        <h1 className="text-4xl md:text-5xl font-bold">{t('title')}</h1>
        <p className="text-xl text-muted-foreground max-w-4xl mx-auto">
          {t('mission.description')}
        </p>
      </motion.div>

      {/* Mission Section */}
      <section className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center space-y-4"
        >
          <h2 className="text-3xl md:text-4xl font-bold">{t('mission.title')}</h2>
        </motion.div>

        {/* Goals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {goals.map((goal, index) => (
            <motion.div
              key={goal.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className={cardSurface}>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 ring-1 ring-inset ring-primary/10 transition-colors duration-300 group-hover:from-primary/25 group-hover:to-primary/10">
                      <goal.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{goal.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="leading-relaxed text-muted-foreground">{goal.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-muted/30 -mx-4 px-4 py-16 rounded-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center space-y-4 mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold">{t('values.title')}</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            {t('values.description')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {values.map((value, index) => (
            <motion.div
              key={value.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className={`${cardSurface} text-center`}>
                <CardHeader className="pt-8">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/15 to-primary/5 ring-1 ring-inset ring-primary/10 transition-transform duration-300 group-hover:scale-110">
                    <value.icon className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle>{value.title}</CardTitle>
                </CardHeader>
                <CardContent className="pb-8">
                  <p className="leading-relaxed text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Team Group Photo */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="group relative aspect-[16/9] w-full overflow-hidden rounded-3xl shadow-xl shadow-primary/5"
      >
        <Image
          src="/images/team/group.jpg"
          alt={t('team.title')}
          fill
          sizes="(min-width: 1280px) 1200px, 100vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {/* Inset hairline keeps the photo edge crisp against light backgrounds */}
        <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-black/10" />
      </motion.div>

      {/* Leadership Team Section */}
      <section className="space-y-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center space-y-4"
        >
          <h2 className="text-3xl md:text-4xl font-bold">Leadership Team</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            {t('team.leadersdescription')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            // Loading skeleton for leadership team
            Array.from({ length: 3 }).map((_, index) => (
              <TeamMemberCardSkeleton key={index} />
            ))
          ) : (
            leadershipTeam.map((member, index) => (
              <TeamMemberCard key={member.id} member={member} index={index} />
            ))
          )}
        </div>
      </section>

      {/* Full Team Section */}
      <section className="space-y-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center space-y-4"
        >
          <h2 className="text-3xl md:text-4xl font-bold">{t('team.title')}</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            {t('team.description')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            // Loading skeleton for core team
            Array.from({ length: 5 }).map((_, index) => (
              <TeamMemberCardSkeleton key={index} />
            ))
          ) : (
            coreTeamMembers.map((member, index) => (
              <TeamMemberCard key={member.id} member={member} index={index} />
            ))
          )}
        </div>
      </section>

      {/* Contact Section */}
      <section className="bg-primary/5 -mx-4 px-4 py-16 rounded-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center space-y-8"
        >
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">{t('contact.title')}</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              {t('contact.description')}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" asChild>
              <a href="mailto:dscdarmstadt@gmail.com">
                <Mail className="h-4 w-4 mr-2" />
                {t('contact.email')}
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/events">
                Join Our Events
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>

          <div className="flex justify-center space-x-6">
            <a
              href="https://github.com/dsc-darmstadt/dscdarmstadt"
              className="text-muted-foreground hover:text-foreground transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="h-6 w-6" />
              <span className="sr-only">GitHub</span>
            </a>
            <a
              href="https://www.linkedin.com/company/dsc-tu-darmstadt/"
              className="text-muted-foreground hover:text-foreground transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Linkedin className="h-6 w-6" />
              <span className="sr-only">LinkedIn</span>
            </a>
            {/* <a
              href="https://twitter.com/dsc_darmstadt"
              className="text-muted-foreground hover:text-foreground transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Twitter className="h-6 w-6" />
              <span className="sr-only">Twitter</span>
            </a> */}
          </div>
        </motion.div>
      </section>
    </div>
  )
}
