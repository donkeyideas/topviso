import { AdminPageHead } from '@/components/admin/AdminPageHead'
import { KpiCard, KpiGrid } from '@/components/admin/KpiCard'
import { BlogClient } from '@/components/admin/BlogClient'
import { getAllPosts } from './actions'

export default async function AdminBlogPage() {
  const [blogPosts, guides] = await Promise.all([
    getAllPosts('blog'),
    getAllPosts('guide'),
  ])

  const published = [...blogPosts, ...guides].filter(
    (p) => p.status === 'published',
  )
  const drafts = [...blogPosts, ...guides].filter(
    (p) => p.status === 'draft',
  )

  return (
    <>
      <AdminPageHead
        category="Marketing"
        title={
          <>
            Blog & <em>guides</em>.
          </>
        }
        subtitle="Create, manage, and publish blog posts and guides for your platform."
      />

      <div className="admin-content">
        <KpiGrid columns={4}>
          <KpiCard
            label="Total Posts"
            value={(blogPosts.length + guides.length).toString()}
            subtitle="All time"
            variant="hl"
          />
          <KpiCard
            label="Published"
            value={published.length.toString()}
            subtitle="Live on blog"
          />
          <KpiCard
            label="Drafts"
            value={drafts.length.toString()}
            subtitle="Unpublished"
          />
          <KpiCard
            label="Guides"
            value={guides.length.toString()}
            subtitle="How-to content"
          />
        </KpiGrid>

        <BlogClient blogPosts={blogPosts} guides={guides} />
      </div>
    </>
  )
}
