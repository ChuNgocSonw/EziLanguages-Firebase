
import { MessageSquare, BookOpen, Headphones, ClipboardList, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from './ui/button';
import LandingHeader from './landing-header';
import LandingFooter from './landing-footer';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const features = [
  {
    icon: <MessageSquare className="h-10 w-10 text-primary" />,
    title: 'AI Language Chat',
    description: 'Practice conversations with an AI partner that provides instant feedback and corrections.',
  },
  {
    icon: <BookOpen className="h-10 w-10 text-primary" />,
    title: 'Reading Comprehension',
    description: 'Improve your reading and pronunciation with interactive stories and articles.',
  },
  {
    icon: <Headphones className="h-10 w-10 text-primary" />,
    title: 'Listening Exercises',
    description: 'Sharpen your listening skills with a variety of audio clips and comprehension questions.',
  },
  {
    icon: <ClipboardList className="h-10 w-10 text-primary" />,
    title: 'Dynamic Quizzes',
    description: 'Test your vocabulary and grammar knowledge with AI-generated quizzes on any topic.',
  },
];


export default function LandingPage() {
    return (
        <div className="flex flex-col min-h-screen bg-background">
            <LandingHeader />
            <main className="flex-1">
                {/* Hero Section */}
                <section className="py-20 md:py-32">
                    <div className="container mx-auto px-4 text-center">
                        <h1 className="text-4xl md:text-6xl font-bold font-headline tracking-tight">
                            The Future of Language Learning is Here
                        </h1>
                        <p className="mt-4 max-w-3xl mx-auto text-lg md:text-xl text-muted-foreground">
                            Ezi Languages uses the power of AI to create personalized, engaging, and effective lessons. 
                            Start your journey to fluency today.
                        </p>
                        <div className="mt-8 flex justify-center gap-4">
                            <Button size="lg" className="bg-accent hover:bg-accent/90" asChild>
                                <Link href="/signup">Get Started for Free <ArrowRight className="ml-2 h-5 w-5" /></Link>
                            </Button>
                        </div>
                         <div className="mt-12 relative">
                            <Image
                                src="/landing-screenshot.png"
                                alt="App Screenshot"
                                width={1000}
                                height={500}
                                className="rounded-lg shadow-2xl mx-auto"
                                data-ai-hint="language learning app"
                            />
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="py-20 md:py-24 bg-card">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold font-headline">All The Tools You Need to Succeed</h2>
                            <p className="mt-2 max-w-2xl mx-auto text-muted-foreground">
                                From interactive chat to dynamic quizzes, our app is packed with features to help you learn faster.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {features.map((feature) => (
                                <Card key={feature.title} className="text-center">
                                    <CardHeader>
                                        <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
                                            {feature.icon}
                                        </div>
                                        <CardTitle className="mt-4">{feature.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-muted-foreground">{feature.description}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>
            </main>
            <LandingFooter />
        </div>
    )
}
