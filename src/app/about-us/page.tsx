import Image from 'next/image';
import { Heart, Users, Package } from 'lucide-react';

export const metadata = {
  title: 'About Us - TheYarnZoo',
  description: 'Learn more about TheYarnZoo, our mission, and our love for handcrafted crocheted toys.',
};

export default function AboutUsPage() {
  return (
    <div className="container mx-auto px-4 py-12 space-y-16">
      <section className="text-center">
        <h1 className="text-5xl font-headline font-bold text-gray-800 mb-6">
          Our Story: Weaving Joy, One Stitch at a Time
        </h1>
        <p className="text-xl text-foreground max-w-3xl mx-auto">
          At TheYarnZoo, we believe in the magic of handmade. Our journey began with a simple passion for crochet and a dream to bring smiles to faces with unique, lovable characters.
        </p>
      </section>

      <section className="grid md:grid-cols-2 gap-12 items-center">
        <div>
          <Image
            src="https://placehold.co/600x450.png"
            alt="Team crafting toys"
            width={600}
            height={450}
            className="rounded-xl shadow-2xl"
            data-ai-hint="crafting team"
          />
        </div>
        <div className="space-y-6">
          <h2 className="text-3xl font-headline font-semibold text-gray-700">More Than Just Toys</h2>
          <p className="text-lg text-foreground leading-relaxed">
            Each toy at TheYarnZoo is more than just an object; it's a companion waiting to be loved, a spark for imagination, and a testament to the art of crochet. We pour our hearts into every stitch, ensuring that each creation is not only adorable but also durable and safe for all ages.
          </p>
          <p className="text-lg text-foreground leading-relaxed">
            Our artisans are a collective of passionate crafters who share a common vision: to preserve the tradition of handmade goods while infusing modern charm and creativity.
          </p>
        </div>
      </section>

      <section className="bg-secondary/50 p-12 rounded-xl">
        <h2 className="text-3xl font-headline font-semibold text-center text-gray-700 mb-10">Our Core Values</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="text-center p-6 bg-card rounded-lg shadow-lg hover-lift transition-all">
            <Heart className="mx-auto h-12 w-12 text-accent mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Handcrafted with Love</h3>
            <p className="text-muted-foreground">Every item is unique, made with meticulous care and passion by skilled artisans.</p>
          </div>
          <div className="text-center p-6 bg-card rounded-lg shadow-lg hover-lift transition-all">
            <Package className="mx-auto h-12 w-12 text-accent mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Quality Materials</h3>
            <p className="text-muted-foreground">We use only high-quality, child-safe yarns and materials for lasting joy.</p>
          </div>
          <div className="text-center p-6 bg-card rounded-lg shadow-lg hover-lift transition-all">
            <Users className="mx-auto h-12 w-12 text-accent mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Community Focused</h3>
            <p className="text-muted-foreground">We support our crafters and aim to build a joyful community around our creations.</p>
          </div>
        </div>
      </section>

      <section className="text-center">
        <h2 className="text-3xl font-headline font-semibold text-gray-700 mb-6">Meet the Founder (Placeholder)</h2>
        <Image
          src="https://placehold.co/300x300.png"
          alt="Founder of TheYarnZoo"
          width={200}
          height={200}
          className="rounded-full mx-auto mb-4 shadow-lg"
          data-ai-hint="founder portrait"
        />
        <p className="text-xl font-medium text-gray-800">Yarny McStitchface</p>
        <p className="text-md text-muted-foreground mb-4">Chief Crochet Officer</p>
        <p className="max-w-xl mx-auto text-foreground">
          "I started TheYarnZoo to share the warmth and joy that only a handmade toy can bring. It's a dream come true to see these little critters find new homes and create lasting memories."
        </p>
      </section>
    </div>
  );
}
