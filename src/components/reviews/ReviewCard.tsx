import type { Review } from '@/types';
import { Star, UserCircle2 } from 'lucide-react';

interface ReviewCardProps {
  review: Review;
}

const ReviewCard = ({ review }: ReviewCardProps) => {
  return (
    <div className="bg-muted/50 p-4 rounded-lg shadow">
      <div className="flex items-center mb-2">
        <UserCircle2 className="h-8 w-8 text-accent mr-3" />
        <div>
          <p className="font-semibold text-foreground">{review.userName}</p>
          <p className="text-xs text-muted-foreground">{new Date(review.date).toLocaleDateString()}</p>
        </div>
      </div>
      <div className="flex mb-2">
        {Array(5).fill(0).map((_, i) => (
          <Star
            key={i}
            className={`h-5 w-5 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/50'}`}
          />
        ))}
      </div>
      <p className="text-sm text-foreground leading-relaxed">{review.text}</p>
    </div>
  );
};

export default ReviewCard;
