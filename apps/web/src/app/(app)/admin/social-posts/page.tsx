import { AdminPageHead } from '@/components/admin/AdminPageHead'
import { KpiCard, KpiGrid } from '@/components/admin/KpiCard'
import { SocialPostsClient } from '@/components/admin/SocialPostsClient'
import {
  getSocialPosts,
  getAutomationConfig,
  getCredentials,
} from './actions'

export default async function AdminSocialPostsPage() {
  const [postsRes, automation, credentials] = await Promise.all([
    getSocialPosts(),
    getAutomationConfig(),
    getCredentials(),
  ])

  const posts = postsRes.data
  const drafts = posts.filter((p) => p.status === 'DRAFT')
  const scheduled = posts.filter((p) => p.status === 'SCHEDULED')
  const published = posts.filter((p) => p.status === 'PUBLISHED')
  const platforms = new Set(posts.map((p) => p.platform)).size

  return (
    <>
      <AdminPageHead
        category="Marketing"
        title={
          <>
            Social <em>posts</em>.
          </>
        }
        subtitle="Generate, schedule, and manage social media content across platforms."
      />

      <div className="admin-content">
        <KpiGrid columns={4}>
          <KpiCard
            label="Total Posts"
            value={posts.length.toString()}
            subtitle="All time"
            variant="hl"
          />
          <KpiCard
            label="Drafts"
            value={drafts.length.toString()}
            subtitle="Awaiting approval"
          />
          <KpiCard
            label="Scheduled"
            value={scheduled.length.toString()}
            subtitle="In queue"
          />
          <KpiCard
            label="Published"
            value={published.length.toString()}
            subtitle={`${platforms} platform${platforms !== 1 ? 's' : ''}`}
          />
        </KpiGrid>

        <SocialPostsClient
          initialPosts={posts}
          initialAutomation={automation}
          initialCredentials={credentials}
        />
      </div>
    </>
  )
}
