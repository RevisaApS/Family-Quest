import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PageContainer } from '@/components/layout/page-container'
import { Header } from '@/components/layout/header'

export default function WelcomePage() {
  return (
    <>
      <Header />
      <PageContainer className="justify-center">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl font-serif text-primary">
              Family Quest
            </h1>
            <p className="text-xl text-muted-foreground">
              Embark on magical adventures together
            </p>
          </div>

          <div className="space-y-3 pt-8">
            <Button render={<Link href="/players" />} size="lg" className="w-full text-lg">
              Begin Your Journey
            </Button>

            <p className="text-sm text-muted-foreground">
              No account needed to start
            </p>
          </div>
        </div>
      </PageContainer>
    </>
  )
}
