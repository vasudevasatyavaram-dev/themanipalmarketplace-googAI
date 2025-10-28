import React from 'react';

interface BestPracticesProps {
    onNavigate: (view: 'dashboard') => void;
}

const BestPractices: React.FC<BestPracticesProps> = ({ onNavigate }) => {
    return (
        <div className="bg-brand-cream p-6 sm:p-8 rounded-2xl shadow-lg border border-brand-dark/10 animate-fade-in">
            <div className="max-w-4xl mx-auto">
                <button onClick={() => onNavigate('dashboard')} className="text-brand-accent font-semibold text-sm mb-6 hover:underline">
                    &larr; Back to Dashboard
                </button>
                <h1 className="text-4xl font-extrabold text-brand-dark mb-4">Seller Best Practices Guide</h1>
                <p className="text-lg text-brand-dark/70 mb-8">Follow these tips to create listings that attract buyers and skyrocket your sales!</p>

                {/* FIX: Casted style object to React.CSSProperties to allow CSS custom properties for Tailwind's typography plugin. */}
                <article className="prose prose-lg max-w-none text-brand-dark" style={{
                    '--tw-prose-body': '#3D081B',
                    '--tw-prose-headings': '#3D081B',
                    '--tw-prose-lead': '#910F3F',
                    '--tw-prose-links': '#910F3F',
                    '--tw-prose-bold': '#3D081B',
                    '--tw-prose-counters': '#910F3F',
                    '--tw-prose-bullets': '#910F3F',
                } as React.CSSProperties}>
                    <h2 className="text-2xl font-bold">1. Master Your Product Photography</h2>
                    <p>Your photos are the first thing a buyer sees. Make a great impression!</p>
                    <ul>
                        <li><strong>Use Natural Light:</strong> Avoid harsh flash. Set up your product near a window for soft, natural lighting that shows true colors.</li>
                        <li><strong>Clean Background:</strong> Use a simple, uncluttered background (like a white wall or a clean table) to make your product the star.</li>
                        <li><strong>Show Multiple Angles:</strong> Take photos from the front, back, sides, and include close-ups of any important details or imperfections.</li>
                        <li><strong>High-Resolution is Key:</strong> Ensure your photos are clear and not blurry. A sharp, high-quality image builds trust. The recommended crop is <strong>Square</strong> for consistency across the marketplace.</li>
                    </ul>

                    <h2 className="text-2xl font-bold mt-8">2. Write Compelling Descriptions</h2>
                    <p>Your description is your sales pitch. Be honest, detailed, and persuasive.</p>
                    <ul>
                        <li><strong>Be Specific:</strong> Include the brand, model, size, color, and condition. Use bullet points for easy reading.</li>
                        <li><strong>Honesty is the Best Policy:</strong> Clearly mention any scratches, dents, or defects. Buyers appreciate transparency, and it prevents disputes later.</li>
                        <li><strong>Tell a Story:</strong> Why are you selling it? What did you love about it? A little personality can go a long way.</li>
                    </ul>

                    <h2 className="text-2xl font-bold mt-8">3. Price Your Items Competitively</h2>
                    <p>Smart pricing is the key to a quick sale.</p>
                    <ul>
                        <li><strong>Research the Market:</strong> See what similar items are selling for on the marketplace. Price your item competitively based on its condition.</li>
                        <li><strong>Factor in Condition:</strong> A brand-new item can be priced higher than a used one. Be realistic about the value.</li>
                        <li><strong>Consider "Rent" vs. "Buy":</strong> If your item is something students might only need temporarily (like a textbook or a specific gadget), offering a rental option can be very attractive.</li>
                    </ul>

                     <h2 className="text-2xl font-bold mt-8">4. Be a Responsive Seller</h2>
                    <p>Good communication leads to happy customers and positive reviews.</p>
                    <ul>
                        <li><strong>Check Notifications:</strong> Keep an eye on your phone for approval notifications and messages from potential buyers.</li>
                        <li><strong>Reply Promptly:</strong> A quick, helpful reply can seal the deal.</li>
                    </ul>
                </article>

                <div className="text-center mt-12">
                     <button onClick={() => onNavigate('dashboard')} className="bg-brand-accent text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:opacity-90 transition duration-300">
                        Got It! Back to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BestPractices;