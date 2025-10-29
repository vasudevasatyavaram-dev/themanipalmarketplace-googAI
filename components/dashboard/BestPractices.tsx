import React from 'react';

interface BestPracticesProps {
    onNavigate: (view: 'dashboard') => void;
}

const CameraIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
);
const PencilIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
);
const PriceTagIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
);
const ChatIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
);

const practices = [
    {
        icon: <CameraIcon />,
        title: "Master Your Product Photography",
        description: "Your photos are the first thing a buyer sees. Make a great impression!",
        points: [
            "<strong>Use Natural Light:</strong> Avoid harsh flash. Set up your product near a window for soft, natural lighting that shows true colors.",
            "<strong>Clean Background:</strong> Use a simple, uncluttered background (like a white wall or a clean table) to make your product the star.",
            "<strong>Show Multiple Angles:</strong> Take photos from the front, back, sides, and include close-ups of any important details or imperfections.",
            "<strong>High-Resolution is Key:</strong> Ensure your photos are clear and not blurry. A sharp, high-quality image builds trust. The recommended crop is <strong>Square</strong> for consistency across the marketplace."
        ]
    },
    {
        icon: <PencilIcon />,
        title: "Write Compelling Descriptions",
        description: "Your description is your sales pitch. Be honest, detailed, and persuasive.",
        points: [
            "<strong>Be Specific:</strong> Include the brand, model, size, color, and condition. Use bullet points for easy reading.",
            "<strong>Honesty is the Best Policy:</strong> Clearly mention any scratches, dents, or defects. Buyers appreciate transparency, and it prevents disputes later.",
            "<strong>Tell a Story:</strong> Why are you selling it? What did you love about it? A little personality can go a long way."
        ]
    },
    {
        icon: <PriceTagIcon />,
        title: "Price Your Items Competitively",
        description: "Smart pricing is the key to a quick sale.",
        points: [
            "<strong>Research the Market:</strong> See what similar items are selling for on the marketplace. Price your item competitively based on its condition.",
            "<strong>Factor in Condition:</strong> A brand-new item can be priced higher than a used one. Be realistic about the value.",
            "<strong>Consider \"Rent\" vs. \"Buy\":</strong> If your item is something students might only need temporarily (like a textbook or a specific gadget), offering a rental option can be very attractive."
        ]
    },
    {
        icon: <ChatIcon />,
        title: "Be a Responsive Seller",
        description: "Good communication leads to happy customers and positive reviews.",
        points: [
            "<strong>Check Notifications:</strong> Keep an eye on your phone for approval notifications and messages from potential buyers.",
            "<strong>Reply Promptly:</strong> A quick, helpful reply can seal the deal."
        ]
    }
];


const BestPractices: React.FC<BestPracticesProps> = ({ onNavigate }) => {
    return (
        <div className="bg-brand-cream p-6 sm:p-8 rounded-2xl shadow-lg border border-brand-dark/10 animate-fade-in">
            <div className="max-w-7xl mx-auto">
                <button onClick={() => onNavigate('dashboard')} className="text-brand-accent font-semibold text-sm mb-6 hover:underline">
                    &larr; Back to Dashboard
                </button>
                <div className="text-center">
                    <h1 className="text-4xl font-extrabold text-brand-dark mb-4">Seller Best Practices Guide</h1>
                    <p className="text-lg text-brand-dark/70 max-w-3xl mx-auto mb-12">Follow these tips to create listings that attract buyers and skyrocket your sales!</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {practices.map((practice, index) => (
                        <div key={index} className="bg-brand-light rounded-xl p-6 shadow-lg border border-brand-dark/10 transform hover:-translate-y-1 transition-transform duration-300 flex flex-col">
                            <div className="flex items-center gap-4 mb-3">
                                <div className="w-12 h-12 bg-brand-accent/10 rounded-lg flex items-center justify-center text-brand-accent flex-shrink-0">
                                    {practice.icon}
                                </div>
                                <h2 className="text-xl font-bold text-brand-dark">{practice.title}</h2>
                            </div>
                            <p className="text-brand-dark/70 mb-4 text-sm flex-grow">{practice.description}</p>
                            <ul className="space-y-3 text-brand-dark/90 text-sm">
                                {practice.points.map((point, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                        <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                        <span dangerouslySetInnerHTML={{ __html: point }} />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

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